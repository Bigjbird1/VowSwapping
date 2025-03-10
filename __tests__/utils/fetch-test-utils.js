/**
 * Test utilities for mocking fetch and handling network-related tests
 */

import { jest } from '@jest/globals';

/**
 * Mock successful fetch response
 * @param {Object} data - Response data
 * @param {Object} options - Response options
 * @returns {Promise<Response>} - Mocked fetch response
 */
export function mockFetchSuccess(data, options = {}) {
  const {
    status = 200,
    statusText = 'OK',
    headers = {},
  } = options;
  
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(headers),
    clone: function() { return this; },
  });
}

/**
 * Mock failed fetch response
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 * @param {Object} data - Response data
 * @param {Object} headers - Response headers
 * @returns {Promise<Response>} - Mocked fetch response
 */
export function mockFetchError(status = 500, statusText = 'Internal Server Error', data = {}, headers = {}) {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(headers),
    clone: function() { return this; },
  });
}

/**
 * Mock network error
 * @param {string} message - Error message
 * @returns {Promise<never>} - Rejected promise
 */
export function mockNetworkError(message = 'Network error') {
  const error = new TypeError(message);
  error.name = 'NetworkError';
  return Promise.reject(error);
}

/**
 * Mock timeout error
 * @param {string} message - Error message
 * @returns {Promise<never>} - Rejected promise
 */
export function mockTimeoutError(message = 'Request timed out') {
  const error = new Error(message);
  error.name = 'AbortError';
  return Promise.reject(error);
}

/**
 * Mock rate limit error
 * @param {number} retryAfter - Retry after seconds
 * @returns {Promise<Response>} - Mocked fetch response
 */
export function mockRateLimitError(retryAfter = 60) {
  return mockFetchError(429, 'Too Many Requests', { error: 'Rate limit exceeded' }, {
    'Retry-After': retryAfter.toString(),
  });
}

/**
 * Setup global fetch mock
 * @param {Function} mockImplementation - Mock implementation function
 * @returns {jest.Mock} - Jest mock function
 */
export function setupFetchMock(mockImplementation = mockFetchSuccess({})) {
  // Save original fetch if it exists
  const originalFetch = global.fetch;
  
  // Create a new mock function
  const fetchMock = jest.fn().mockImplementation(() => mockImplementation);
  
  // Replace global fetch with mock
  global.fetch = fetchMock;
  
  // Return the mock for further customization
  return fetchMock;
}

/**
 * Restore original fetch
 */
export function restoreFetch() {
  // Restore original fetch if it was saved
  if (global._originalFetch) {
    global.fetch = global._originalFetch;
    delete global._originalFetch;
  } else {
    // Otherwise, delete the mock
    delete global.fetch;
  }
}

/**
 * Mock fetch with multiple responses
 * @param {Array<Function|Object>} responses - Array of response functions or objects
 * @returns {jest.Mock} - Jest mock function
 */
export function mockFetchSequence(responses) {
  const fetchMock = setupFetchMock();
  
  // For each response in the sequence
  responses.forEach((response, index) => {
    if (typeof response === 'function') {
      // If it's a function, use it directly
      fetchMock.mockImplementationOnce(response);
    } else {
      // If it's an object, assume it's a success response
      fetchMock.mockImplementationOnce(() => mockFetchSuccess(response));
    }
  });
  
  return fetchMock;
}

/**
 * Mock fetch with a response that depends on the request
 * @param {Function} handler - Function that takes request info and returns a response
 * @returns {jest.Mock} - Jest mock function
 */
export function mockFetchWithHandler(handler) {
  const fetchMock = setupFetchMock();
  
  fetchMock.mockImplementation((url, options) => {
    return handler(url, options);
  });
  
  return fetchMock;
}

/**
 * Create a mock AbortController
 * @returns {Object} - Mock AbortController
 */
export function createMockAbortController() {
  const abortFn = jest.fn();
  
  return {
    signal: {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onabort: null,
      reason: undefined,
      throwIfAborted: jest.fn(),
    },
    abort: abortFn,
  };
}

/**
 * Mock Headers class
 */
export class MockHeaders {
  constructor(init = {}) {
    this._headers = new Map();
    
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  
  append(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }
  
  delete(name) {
    this._headers.delete(name.toLowerCase());
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase()) || null;
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase());
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }
  
  entries() {
    return this._headers.entries();
  }
  
  keys() {
    return this._headers.keys();
  }
  
  values() {
    return this._headers.values();
  }
  
  forEach(callback, thisArg) {
    this._headers.forEach((value, key) => {
      callback.call(thisArg, value, key, this);
    });
  }
}

// If Headers is not defined in the test environment, provide a mock implementation
if (typeof Headers === 'undefined') {
  global.Headers = MockHeaders;
}
