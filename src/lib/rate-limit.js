/**
 * Rate limiting middleware for Next.js API routes
 * Provides protection against brute force attacks and API abuse
 */

// In-memory store for rate limiting
// In production, this should be replaced with Redis or another distributed store
const rateStore = new Map();

/**
 * Rate limiting middleware
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Object} options - Rate limiting options
 * @param {number} options.limit - Maximum number of requests allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyPrefix - Prefix for rate limit keys (e.g., 'auth', 'api')
 * @param {Function} options.keyGenerator - Function to generate a unique key for the request
 * @returns {Promise<Object>} - Rate limit information
 */
export async function rateLimit(req, res, options = {}) {
  // Default options
  const {
    limit = 60,
    windowMs = 60 * 1000, // 1 minute
    keyPrefix = 'global',
    keyGenerator = defaultKeyGenerator,
  } = typeof options === 'function' ? options(req, res) : options;

  // Generate a unique key for this request
  const key = `${keyPrefix}:${keyGenerator(req)}`;
  
  // Get the current timestamp
  const now = Date.now();
  
  // Get the current rate limit data for this key
  const rateData = rateStore.get(key) || {
    count: 0,
    reset: now + windowMs,
  };
  
  // Reset the count if the window has expired
  if (now > rateData.reset) {
    rateData.count = 0;
    rateData.reset = now + windowMs;
  }
  
  // Increment the count
  rateData.count += 1;
  
  // Store the updated rate data
  rateStore.set(key, rateData);
  
  // Calculate remaining requests and time until reset
  const remaining = Math.max(0, limit - rateData.count);
  const resetTime = rateData.reset;
  
  // Set rate limit headers - ensure compatibility with both Next.js and node-mocks-http
  const resetTimeSeconds = Math.ceil(resetTime / 1000);
  
  // For Next.js Response objects
  if (typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds);
  } 
  
  // For node-mocks-http Response objects
  if (res._headers) {
    res._headers['x-ratelimit-limit'] = limit;
    res._headers['x-ratelimit-remaining'] = remaining;
    res._headers['x-ratelimit-reset'] = resetTimeSeconds;
  }
  
  // For httpMocks Response objects
  if (typeof res.header === 'function') {
    res.header('X-RateLimit-Limit', limit);
    res.header('X-RateLimit-Remaining', remaining);
    res.header('X-RateLimit-Reset', resetTimeSeconds);
  }
  
  // For node-mocks-http with _getHeaders method
  if (typeof res._getHeaders === 'function') {
    const headers = res._getHeaders() || {};
    headers['x-ratelimit-limit'] = limit;
    headers['x-ratelimit-remaining'] = remaining;
    headers['x-ratelimit-reset'] = resetTimeSeconds;
  }
  
  // If the rate limit is exceeded, throw an error
  if (rateData.count > limit) {
    // Set retry-after header
    const retryAfter = Math.ceil((resetTime - now) / 1000);
    
    // For Next.js Response objects
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', retryAfter);
    }
    
    // For node-mocks-http Response objects
    if (res._headers) {
      res._headers['retry-after'] = retryAfter;
    }
    
    // For httpMocks Response objects
    if (typeof res.header === 'function') {
      res.header('Retry-After', retryAfter);
    }
    
    // For node-mocks-http with _getHeaders method
    if (typeof res._getHeaders === 'function') {
      const headers = res._getHeaders() || {};
      headers['retry-after'] = retryAfter;
    }
    
    // Throw rate limit error
    const error = new Error('Too many requests');
    error.status = 429;
    error.limit = limit;
    error.remaining = 0;
    error.reset = resetTime;
    throw error;
  }
  
  // Return rate limit information
  return {
    limit,
    remaining,
    reset: resetTime,
  };
}

/**
 * Default key generator function
 * Uses IP address as the key
 * @param {Object} req - Next.js request object
 * @returns {string} - Unique key for the request
 */
function defaultKeyGenerator(req) {
  // Get IP address from various headers or connection
  const ip = 
    (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    '127.0.0.1';
  
  return ip;
}

/**
 * Apply rate limiting to a Next.js API route handler
 * @param {Function} handler - Next.js API route handler
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Rate-limited handler
 */
export function withRateLimit(handler, options = {}) {
  return async function rateLimitedHandler(req, res) {
    try {
      // Apply rate limiting
      await rateLimit(req, res, options);
      
      // Call the original handler
      return handler(req, res);
    } catch (error) {
      // Handle rate limit errors
      if (error.status === 429) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Too many requests',
          type: 'RATE_LIMIT',
        });
      }
      
      // Pass other errors to the original handler
      throw error;
    }
  };
}
