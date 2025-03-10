/**
 * Utility functions for making fetch requests with error handling, timeouts, and retries
 */

/**
 * Enhanced fetch function with timeout, retry, and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {number} [options.retryDelay=1000] - Delay between retries in milliseconds
 * @param {boolean} [options.retryOnNetworkError=true] - Whether to retry on network errors
 * @param {boolean} [options.retryOn5xx=true] - Whether to retry on 5xx errors
 * @param {boolean} [options.retryOn429=true] - Whether to retry on 429 (rate limit) errors
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithErrorHandling(url, options = {}) {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    retryOnNetworkError = true,
    retryOn5xx = true,
    retryOn429 = true,
    ...fetchOptions
  } = options;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Add signal to fetch options
  const fetchOptionsWithSignal = {
    ...fetchOptions,
    signal: controller.signal,
  };

  let lastError;
  let attempt = 0;

  while (attempt < retries) {
    attempt++;
    
    try {
      const response = await fetch(url, fetchOptionsWithSignal);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Check if we should retry based on status code
      if (
        (retryOn5xx && response.status >= 500 && response.status < 600) ||
        (retryOn429 && response.status === 429)
      ) {
        if (attempt < retries) {
          // Get retry delay from Retry-After header or use default
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Save the error
      lastError = error;
      
      // Check if we should retry based on error type
      if (
        retryOnNetworkError &&
        (error.name === 'AbortError' || error.name === 'TypeError' || error.name === 'NetworkError') &&
        attempt < retries
      ) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // Rethrow the error if we shouldn't retry or have exhausted retries
      throw error;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError;
}

/**
 * Fetch JSON data with error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - JSON response
 */
export async function fetchJSON(url, options = {}) {
  const response = await fetchWithErrorHandling(url, options);
  
  if (!response.ok) {
    const error = new Error(`HTTP error ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.statusText = response.statusText;
    
    try {
      error.data = await response.json();
    } catch (e) {
      // Ignore JSON parsing errors
    }
    
    throw error;
  }
  
  return response.json();
}

/**
 * Fetch with automatic retry on rate limiting
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithRateLimitHandling(url, options = {}) {
  try {
    return await fetchWithErrorHandling(url, {
      ...options,
      retryOn429: true,
    });
  } catch (error) {
    // If we still hit a rate limit after retries, throw a specific error
    if (error.status === 429) {
      const retryAfter = error.headers?.get('Retry-After') || '60';
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.retryAfter = parseInt(retryAfter, 10);
      throw rateLimitError;
    }
    
    throw error;
  }
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} [timeout=30000] - Timeout in milliseconds
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  return fetchWithErrorHandling(url, {
    ...options,
    timeout,
    retries: 1, // No retries
  });
}

/**
 * Check if an error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether the error is a network error
 */
export function isNetworkError(error) {
  return (
    error.name === 'TypeError' ||
    error.name === 'NetworkError' ||
    error.name === 'AbortError' ||
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('abort')
  );
}

/**
 * Check if an error is a timeout error
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether the error is a timeout error
 */
export function isTimeoutError(error) {
  return (
    error.name === 'AbortError' ||
    error.message.includes('timeout') ||
    error.message.includes('timed out')
  );
}

/**
 * Check if an error is a rate limit error
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether the error is a rate limit error
 */
export function isRateLimitError(error) {
  return (
    error.status === 429 ||
    error.message.includes('rate limit') ||
    error.message.includes('too many requests')
  );
}
