/**
 * Utility functions for handling database transactions
 */

import { ApiError, ErrorType } from './error-handler';

/**
 * Execute a function with transaction retry logic
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options for retry
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.maxDelay - Maximum delay in milliseconds
 * @returns {Promise<any>} - Result of the function
 */
export async function withTransactionRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 3000,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      // If not retryable or max retries reached, throw
      if (!isRetryable || attempt >= maxRetries) {
        throw transformError(error);
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
  
  throw transformError(lastError);
}

/**
 * Check if an error is retryable
 * @param {Error} error - Error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(error) {
  // Prisma transaction errors
  if (error.code === 'P2034') return true; // Transaction failed due to a serialization error
  if (error.code === 'P2028') return true; // Transaction timed out
  if (error.code === 'P2037') return true; // Transaction failed due to a deadlock
  
  // Database connection errors
  if (error.code === 'P1001') return true; // Authentication failed
  if (error.code === 'P1002') return true; // Connection timed out
  if (error.code === 'P1008') return true; // Operations timed out
  if (error.code === 'P1017') return true; // Server closed the connection
  
  // Stripe rate limit errors
  if (error.type === 'StripeRateLimitError') return true;
  
  // Network errors
  if (error.name === 'FetchError') return true;
  if (error.name === 'NetworkError') return true;
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('connection')
  )) return true;
  
  // Concurrency errors
  if (error.name === 'ConcurrencyError') return true;
  if (error.message && (
    error.message.includes('concurrent') ||
    error.message.includes('conflict') ||
    error.message.includes('optimistic')
  )) return true;
  
  return false;
}

/**
 * Transform an error into a standardized API error
 * @param {Error} error - Error to transform
 * @returns {Error} - Transformed error
 */
function transformError(error) {
  // If it's already an ApiError, return it
  if (error.name === 'ApiError') {
    return error;
  }
  
  // Prisma errors
  if (error.code) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      return new ApiError(
        ErrorType.CONFLICT,
        `A record with this ${error.meta?.target?.join(', ') || 'field'} already exists`
      );
    }
    
    // Record not found
    if (error.code === 'P2001' || error.code === 'P2025') {
      return new ApiError(
        ErrorType.NOT_FOUND,
        'Record not found'
      );
    }
    
    // Foreign key constraint failed
    if (error.code === 'P2003') {
      return new ApiError(
        ErrorType.BAD_REQUEST,
        'Related record not found'
      );
    }
    
    // Validation errors
    if (error.code === 'P2007' || error.code === 'P2009' || error.code === 'P2010' || error.code === 'P2011' || error.code === 'P2012') {
      return new ApiError(
        ErrorType.VALIDATION_ERROR,
        error.message || 'Validation error in database operation',
        error.meta
      );
    }
    
    // Transaction errors
    if (error.code === 'P2034') {
      return new ApiError(
        ErrorType.CONCURRENCY_ERROR,
        'Transaction failed due to a serialization error'
      );
    }
    
    if (error.code === 'P2037') {
      return new ApiError(
        ErrorType.CONCURRENCY_ERROR,
        'Transaction failed due to a deadlock'
      );
    }
    
    // Transaction rollback errors
    if (error.code === 'P2028') {
      return new ApiError(
        ErrorType.INTERNAL_ERROR,
        'Transaction timed out or failed to commit',
        { rollback: true }
      );
    }
    
    // Database connection errors
    if (['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code)) {
      return new ApiError(
        ErrorType.SERVICE_UNAVAILABLE,
        'Database connection error'
      );
    }
    
    // Default database error
    return new ApiError(
      ErrorType.INTERNAL_ERROR,
      `Database error: ${error.message || 'Unknown database error'}`,
      { code: error.code, meta: error.meta }
    );
  }
  
  // Stripe errors
  if (error.type && error.type.startsWith('Stripe')) {
    if (error.type === 'StripeCardError') {
      return new ApiError(
        ErrorType.BAD_REQUEST,
        error.message || 'Card processing error',
        { code: error.code }
      );
    }
    
    if (error.type === 'StripeRateLimitError') {
      return new ApiError(
        ErrorType.RATE_LIMIT,
        'Too many requests to payment processor'
      );
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return new ApiError(
        ErrorType.VALIDATION_ERROR,
        error.message || 'Invalid payment request'
      );
    }
    
    if (error.type === 'StripeAPIError' || error.type === 'StripeConnectionError') {
      return new ApiError(
        ErrorType.SERVICE_UNAVAILABLE,
        'Payment service unavailable'
      );
    }
    
    // Default Stripe error
    return new ApiError(
      ErrorType.INTERNAL_ERROR,
      `Payment processing error: ${error.message || 'Unknown payment error'}`
    );
  }
  
  // Validation errors
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    return new ApiError(
      ErrorType.VALIDATION_ERROR,
      'Validation failed',
      error.errors || error.issues || error.message
    );
  }
  
  // Concurrency errors
  if (error.name === 'ConcurrencyError' || 
      (error.message && (
        error.message.includes('concurrent') ||
        error.message.includes('conflict') ||
        error.message.includes('optimistic')
      ))) {
    return new ApiError(
      ErrorType.CONCURRENCY_ERROR,
      'Concurrent modification conflict'
    );
  }
  
  // Network errors
  if (error.name === 'FetchError' || error.name === 'NetworkError' ||
      (error.message && (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('connection')
      ))) {
    return new ApiError(
      ErrorType.SERVICE_UNAVAILABLE,
      'Network or service connection error'
    );
  }
  
  // Default to internal server error
  return new ApiError(
    ErrorType.INTERNAL_ERROR,
    error.message || 'Internal server error'
  );
}

/**
 * Execute a database transaction with retry logic
 * @param {Object} prisma - Prisma client
 * @param {Function} fn - Function to execute in transaction
 * @param {Object} options - Options for retry
 * @returns {Promise<any>} - Result of the transaction
 */
export async function executeTransaction(prisma, fn, options = {}) {
  return withTransactionRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      return await fn(tx);
    }, {
      isolationLevel: 'Serializable', // Highest isolation level
      timeout: options.timeout || 10000, // 10 seconds default
    });
  }, options);
}

/**
 * Apply optimistic concurrency control to a database operation
 * @param {Object} prisma - Prisma client
 * @param {string} model - Model name
 * @param {string} id - Record ID
 * @param {number} version - Current version
 * @param {Function} fn - Function to execute
 * @returns {Promise<any>} - Result of the operation
 */
export async function withOptimisticConcurrency(prisma, model, id, version, fn) {
  return executeTransaction(prisma, async (tx) => {
    // Get the current record and check version
    const record = await tx[model].findUnique({
      where: { id },
      select: { version: true },
    });
    
    if (!record) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Record not found');
    }
    
    if (record.version !== version) {
      throw new ApiError(
        ErrorType.CONCURRENCY_ERROR,
        'Record has been modified by another user'
      );
    }
    
    // Execute the function with the transaction
    const result = await fn(tx);
    
    // Update the version
    await tx[model].update({
      where: { id },
      data: { version: { increment: 1 } },
    });
    
    return result;
  });
}

/**
 * Apply pessimistic locking to a database operation
 * @param {Object} prisma - Prisma client
 * @param {string} model - Model name
 * @param {string} id - Record ID
 * @param {Function} fn - Function to execute
 * @returns {Promise<any>} - Result of the operation
 */
export async function withPessimisticLock(prisma, model, id, fn) {
  return executeTransaction(prisma, async (tx) => {
    // Lock the record for update
    const record = await tx[model].findUnique({
      where: { id },
    });
    
    if (!record) {
      throw new ApiError(ErrorType.NOT_FOUND, 'Record not found');
    }
    
    // Execute the function with the transaction
    return await fn(tx, record);
  });
}
