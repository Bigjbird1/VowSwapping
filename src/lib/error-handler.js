/**
 * Standardized error handling for API routes
 * Ensures consistent error responses across the application
 */

/**
 * Error types with corresponding HTTP status codes
 */
export const ErrorType = {
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONCURRENCY_ERROR: 'CONCURRENCY_ERROR',
};

/**
 * Map error types to HTTP status codes
 */
const statusCodes = {
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.BAD_REQUEST]: 400,
  [ErrorType.UNAUTHORIZED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
  [ErrorType.GATEWAY_TIMEOUT]: 504,
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.CONCURRENCY_ERROR]: 409,
};

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(type, message, details = null) {
    super(message);
    this.type = type;
    this.status = statusCodes[type] || 500;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Handle API errors and return standardized responses
 * @param {Error} error - Error object
 * @param {Object} res - Next.js response object
 * @returns {Object} - JSON response with error details
 */
export function handleApiError(error, res) {
  console.error('API Error:', error);
  
  // Ensure we have a default error message
  const errorMessage = error.message || 'An unexpected error occurred';
  
  // If it's already an ApiError, use its properties
  if (error.name === 'ApiError') {
    return res.status(error.status).json({
      error: error.message,
      type: error.type,
      ...(error.details && { details: error.details }),
    });
  }
  
  // Handle Prisma errors
  if (error.code) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: `A record with this ${error.meta?.target?.join(', ') || 'field'} already exists`,
        type: ErrorType.CONFLICT,
      });
    }
    
    // Record not found
    if (error.code === 'P2001' || error.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        type: ErrorType.NOT_FOUND,
      });
    }
    
    // Foreign key constraint failed
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Related record not found',
        type: ErrorType.BAD_REQUEST,
      });
    }
    
    // Invalid data
    if (error.code === 'P2007') {
      return res.status(400).json({
        error: 'Invalid data provided',
        type: ErrorType.VALIDATION_ERROR,
      });
    }
    
    // For any other Prisma error, ensure we have an error property
    return res.status(500).json({
      error: `Database error: ${errorMessage}`,
      type: ErrorType.INTERNAL_ERROR,
      code: error.code,
    });
  }
  
  // Handle Stripe errors
  if (error.type && error.type.startsWith('Stripe')) {
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message || 'Card processing error',
        type: ErrorType.BAD_REQUEST,
        code: error.code,
      });
    }
    
    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        error: 'Too many requests to payment processor',
        type: ErrorType.RATE_LIMIT,
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: error.message || 'Invalid payment request',
        type: ErrorType.VALIDATION_ERROR,
      });
    }
    
    if (error.type === 'StripeAPIError' || error.type === 'StripeConnectionError') {
      return res.status(503).json({
        error: 'Payment service unavailable',
        type: ErrorType.SERVICE_UNAVAILABLE,
      });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({
        error: 'Payment authentication error',
        type: ErrorType.INTERNAL_ERROR,
      });
    }
    
    // For any other Stripe error, ensure we have an error property
    return res.status(500).json({
      error: `Payment processing error: ${errorMessage}`,
      type: ErrorType.INTERNAL_ERROR,
    });
  }
  
  // Handle rate limit errors
  if (error.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      type: ErrorType.RATE_LIMIT,
    });
  }
  
  // Handle JWT/Auth errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Invalid or expired authentication',
      type: ErrorType.UNAUTHORIZED,
    });
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    // Extract validation details
    let details = error.errors || error.issues || error.message;
    
    // Ensure details is an object with an error property if it's an array
    if (Array.isArray(details) && details.length === 0) {
      details = { error: 'Validation failed' };
    }
    
    return res.status(400).json({
      error: 'Validation failed',
      type: ErrorType.VALIDATION_ERROR,
      details: details,
    });
  }
  
  // Handle concurrency errors
  if (error.name === 'ConcurrencyError' || error.message.includes('concurrent') || error.message.includes('conflict')) {
    return res.status(409).json({
      error: 'Concurrent modification conflict',
      type: ErrorType.CONCURRENCY_ERROR,
    });
  }
  
  // Default to internal server error
  return res.status(500).json({
    error: 'Internal server error',
    type: ErrorType.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
  });
}

/**
 * Create a not found error
 * @param {string} message - Error message
 * @returns {ApiError} - Not found error
 */
export function createNotFoundError(message = 'Resource not found') {
  return new ApiError(ErrorType.NOT_FOUND, message);
}

/**
 * Create a bad request error
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {ApiError} - Bad request error
 */
export function createBadRequestError(message = 'Invalid request', details = null) {
  return new ApiError(ErrorType.BAD_REQUEST, message, details);
}

/**
 * Create an unauthorized error
 * @param {string} message - Error message
 * @returns {ApiError} - Unauthorized error
 */
export function createUnauthorizedError(message = 'Unauthorized') {
  return new ApiError(ErrorType.UNAUTHORIZED, message);
}

/**
 * Create a forbidden error
 * @param {string} message - Error message
 * @returns {ApiError} - Forbidden error
 */
export function createForbiddenError(message = 'Forbidden') {
  return new ApiError(ErrorType.FORBIDDEN, message);
}

/**
 * Create a conflict error
 * @param {string} message - Error message
 * @returns {ApiError} - Conflict error
 */
export function createConflictError(message = 'Resource conflict') {
  return new ApiError(ErrorType.CONFLICT, message);
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} details - Validation error details
 * @returns {ApiError} - Validation error
 */
export function createValidationError(message = 'Validation failed', details = null) {
  return new ApiError(ErrorType.VALIDATION_ERROR, message, details);
}

/**
 * Create a concurrency error
 * @param {string} message - Error message
 * @returns {ApiError} - Concurrency error
 */
export function createConcurrencyError(message = 'Concurrent modification conflict') {
  return new ApiError(ErrorType.CONCURRENCY_ERROR, message);
}

/**
 * Create a service unavailable error
 * @param {string} message - Error message
 * @returns {ApiError} - Service unavailable error
 */
export function createServiceUnavailableError(message = 'Service unavailable') {
  return new ApiError(ErrorType.SERVICE_UNAVAILABLE, message);
}

/**
 * Wrap an API handler with error handling
 * @param {Function} handler - API handler function
 * @returns {Function} - Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      return handleApiError(error, res);
    }
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @param {Function} options.shouldRetry - Function to determine if retry should be attempted
 * @returns {Promise<any>} - Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 3000,
    shouldRetry = (error) => true,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt) + Math.random() * 100,
        maxDelay
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
