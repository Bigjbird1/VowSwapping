/**
 * Test utilities for error handling tests
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a mock NextRequest object
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} url - Request URL
 * @param {Object} body - Request body (for POST, PUT, etc.)
 * @param {Object} headers - Request headers
 * @returns {NextRequest} - Mock NextRequest object
 */
export function createMockRequest(method, url, body = null, headers = {}) {
  const options = {
    method,
    headers: new Headers(headers)
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return new NextRequest(url, options);
}

/**
 * Creates a mock authenticated session
 * @param {Object} overrides - Session property overrides
 * @returns {Object} - Mock session object
 */
export function createMockSession(overrides = {}) {
  return {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    ...overrides
  };
}

/**
 * Simulates a network delay
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>} - Promise that resolves after the delay
 */
export function simulateNetworkDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates a network failure
 * @param {string} message - Error message
 * @throws {Error} - Network error
 */
export function simulateNetworkFailure(message = 'Network error') {
  throw new Error(message);
}

/**
 * Creates a mock database error
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} meta - Additional error metadata
 * @returns {Error} - Database error
 */
export function createDatabaseError(code, message, meta = {}) {
  const error = new Error(message);
  error.code = code;
  error.meta = meta;
  return error;
}

/**
 * Simulates a database timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<never>} - Promise that rejects after the timeout
 */
export function simulateDatabaseTimeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timed out')), ms);
  });
}

/**
 * Creates a mock Prisma client with controlled failure scenarios
 * @param {Object} options - Configuration options
 * @returns {Object} - Mock Prisma client
 */
export function createMockPrismaClient(options = {}) {
  const {
    shouldFailOnFind = false,
    shouldFailOnCreate = false,
    shouldFailOnUpdate = false,
    shouldFailOnDelete = false,
    shouldTimeout = false,
    timeoutMs = 5000,
    errorCode = 'P2002',
    errorMessage = 'Database error',
    errorMeta = {}
  } = options;

  const mockOperation = (operation, shouldFail) => {
    if (shouldTimeout) {
      return jest.fn().mockImplementation(() => simulateDatabaseTimeout(timeoutMs));
    }
    
    if (shouldFail) {
      return jest.fn().mockRejectedValue(createDatabaseError(errorCode, errorMessage, errorMeta));
    }
    
    return jest.fn().mockResolvedValue({});
  };

  return {
    user: {
      findUnique: mockOperation('findUnique', shouldFailOnFind),
      findFirst: mockOperation('findFirst', shouldFailOnFind),
      findMany: mockOperation('findMany', shouldFailOnFind),
      create: mockOperation('create', shouldFailOnCreate),
      update: mockOperation('update', shouldFailOnUpdate),
      delete: mockOperation('delete', shouldFailOnDelete),
    },
    product: {
      findUnique: mockOperation('findUnique', shouldFailOnFind),
      findMany: mockOperation('findMany', shouldFailOnFind),
      create: mockOperation('create', shouldFailOnCreate),
      update: mockOperation('update', shouldFailOnUpdate),
      delete: mockOperation('delete', shouldFailOnDelete),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      if (shouldFailOnCreate) {
        throw createDatabaseError(errorCode, errorMessage, errorMeta);
      }
      return callback({});
    }),
  };
}

/**
 * Simulates concurrent requests to test race conditions
 * @param {Function[]} requestFunctions - Array of request functions to execute concurrently
 * @returns {Promise<any[]>} - Promise that resolves with the results of all requests
 */
export function simulateConcurrentRequests(requestFunctions) {
  return Promise.all(requestFunctions.map(fn => fn()));
}

/**
 * Creates a mock Stripe error
 * @param {string} type - Error type (StripeCardError, StripeInvalidRequestError, etc.)
 * @param {string} message - Error message
 * @param {Object} extras - Additional error properties
 * @returns {Error} - Stripe error
 */
export function createStripeError(type, message, extras = {}) {
  const error = new Error(message);
  error.type = type;
  
  // Add common Stripe error properties
  error.code = extras.code || 'generic_error';
  error.param = extras.param;
  error.detail = extras.detail;
  
  // Add specific properties based on error type
  switch (type) {
    case 'StripeCardError':
      error.decline_code = extras.decline_code || 'generic_decline';
      break;
    case 'StripeRateLimitError':
      error.headers = { 'retry-after': extras.retryAfter || '30' };
      break;
    case 'StripeInvalidRequestError':
      error.param = extras.param || 'generic_param';
      break;
    case 'StripeAPIError':
      error.http_status = extras.http_status || 500;
      break;
    case 'StripeAuthenticationError':
      error.http_status = extras.http_status || 401;
      break;
    case 'StripePermissionError':
      error.http_status = extras.http_status || 403;
      break;
    case 'StripeConnectionError':
      error.http_status = extras.http_status || 503;
      break;
    case 'StripeSignatureVerificationError':
      error.header = extras.header || 'stripe-signature';
      error.payload = extras.payload || '{}';
      break;
  }
  
  return error;
}

/**
 * Validates that a response contains the expected error structure
 * @param {NextResponse} response - Response to validate
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedErrorPattern - Expected error message pattern (pipe-separated alternatives)
 * @returns {Promise<void>} - Promise that resolves if validation passes
 */
export async function validateErrorResponse(response, expectedStatus, expectedErrorPattern) {
  // Check status code
  expect(response.status).toBe(expectedStatus);
  
  // Parse response body
  const data = await response.json();
  
  // Check error structure
  expect(data).toHaveProperty('error');
  
  // Check error message against pattern
  const errorMessage = data.error.toLowerCase();
  const patterns = expectedErrorPattern.toLowerCase().split('|');
  
  // At least one pattern should match
  const hasMatch = patterns.some(pattern => errorMessage.includes(pattern));
  
  if (!hasMatch) {
    console.error(`Error message "${errorMessage}" does not match any pattern in "${expectedErrorPattern}"`);
  }
  
  expect(hasMatch).toBe(true);
}

/**
 * Creates a mock FormData object
 * @param {Object} fields - Form fields
 * @param {Object} files - Form files
 * @returns {FormData} - Mock FormData object
 */
export function createMockFormData(fields = {}, files = {}) {
  const formData = new FormData();
  
  // Add fields
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Add files
  Object.entries(files).forEach(([key, file]) => {
    const { content, name, type } = file;
    const blob = new Blob([content], { type });
    formData.append(key, blob, name);
  });
  
  return formData;
}

/**
 * Creates a mock URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {URL} - URL object
 */
export function createMockUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url;
}

/**
 * Creates a mock Headers object
 * @param {Object} headers - Headers
 * @returns {Headers} - Headers object
 */
export function createMockHeaders(headers = {}) {
  return new Headers(headers);
}

/**
 * Creates a mock Response object
 * @param {Object|string} body - Response body
 * @param {Object} options - Response options
 * @returns {Object} - Mock Response object
 */
export function createMockResponse(body, options = {}) {
  const { status = 200, statusText = 'OK', headers = {} } = options;
  
  const responseBody = typeof body === 'string' ? body : JSON.stringify(body);
  
  // Create a mock Response object instead of using the actual Response class
  return {
    status,
    statusText,
    headers: new Headers(headers),
    body: responseBody,
    json: async () => typeof body === 'string' ? JSON.parse(body) : body,
    text: async () => responseBody,
    ok: status >= 200 && status < 300
  };
}
