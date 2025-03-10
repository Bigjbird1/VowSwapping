/**
 * Tests for fetch test utility functions
 */

import {
  mockFetchSuccess,
  mockFetchError,
  mockNetworkError,
  mockTimeoutError,
  mockRateLimitError,
  setupFetchMock,
  restoreFetch,
  mockFetchSequence,
  mockFetchWithHandler,
  createMockAbortController,
  MockHeaders
} from './fetch-test-utils';

describe('Fetch Test Utilities', () => {
  // Save original fetch
  const originalFetch = global.fetch;

  // Restore fetch after each test
  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('mockFetchSuccess', () => {
    it('should create a successful response with default options', async () => {
      const data = { id: 1, name: 'Test' };
      const response = await mockFetchSuccess(data);
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      
      const jsonData = await response.json();
      expect(jsonData).toEqual(data);
      
      const textData = await response.text();
      expect(textData).toBe(JSON.stringify(data));
    });

    it('should create a successful response with custom options', async () => {
      const data = { id: 1, name: 'Test' };
      const options = {
        status: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json' }
      };
      
      const response = await mockFetchSuccess(data, options);
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const jsonData = await response.json();
      expect(jsonData).toEqual(data);
    });
  });

  describe('mockFetchError', () => {
    it('should create an error response with default options', async () => {
      const response = await mockFetchError();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      
      const jsonData = await response.json();
      expect(jsonData).toEqual({});
    });

    it('should create an error response with custom options', async () => {
      const data = { error: 'Not found' };
      const response = await mockFetchError(404, 'Not Found', data, { 'Content-Type': 'application/json' });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const jsonData = await response.json();
      expect(jsonData).toEqual(data);
    });
  });

  describe('mockNetworkError', () => {
    it('should reject with a network error', async () => {
      await expect(mockNetworkError()).rejects.toThrow('Network error');
      await expect(mockNetworkError()).rejects.toHaveProperty('name', 'NetworkError');
    });

    it('should reject with a custom error message', async () => {
      await expect(mockNetworkError('Custom network error')).rejects.toThrow('Custom network error');
    });
  });

  describe('mockTimeoutError', () => {
    it('should reject with a timeout error', async () => {
      await expect(mockTimeoutError()).rejects.toThrow('Request timed out');
      await expect(mockTimeoutError()).rejects.toHaveProperty('name', 'AbortError');
    });

    it('should reject with a custom error message', async () => {
      await expect(mockTimeoutError('Custom timeout error')).rejects.toThrow('Custom timeout error');
    });
  });

  describe('mockRateLimitError', () => {
    it('should create a rate limit error response with default retry after', async () => {
      const response = await mockRateLimitError();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(response.statusText).toBe('Too Many Requests');
      expect(response.headers.get('Retry-After')).toBe('60');
      
      const jsonData = await response.json();
      expect(jsonData).toHaveProperty('error', 'Rate limit exceeded');
    });

    it('should create a rate limit error response with custom retry after', async () => {
      const response = await mockRateLimitError(120);
      
      expect(response.headers.get('Retry-After')).toBe('120');
    });
  });

  describe('setupFetchMock', () => {
    it('should replace global fetch with a mock', () => {
      const fetchMock = setupFetchMock();
      
      expect(global.fetch).toBe(fetchMock);
      expect(fetchMock).not.toBe(originalFetch);
    });

    it('should use the provided mock implementation', async () => {
      const data = { id: 1, name: 'Test' };
      setupFetchMock(mockFetchSuccess(data));
      
      const response = await global.fetch('https://example.com/api');
      const jsonData = await response.json();
      
      expect(jsonData).toEqual(data);
    });
  });

  describe('mockFetchSequence', () => {
    it('should mock a sequence of responses', async () => {
      mockFetchSequence([
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        () => mockFetchError(404, 'Not Found', { error: 'Not found' })
      ]);
      
      // First request
      let response = await global.fetch('https://example.com/api');
      let data = await response.json();
      expect(data).toEqual({ id: 1, name: 'First' });
      
      // Second request
      response = await global.fetch('https://example.com/api');
      data = await response.json();
      expect(data).toEqual({ id: 2, name: 'Second' });
      
      // Third request
      response = await global.fetch('https://example.com/api');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('mockFetchWithHandler', () => {
    it('should use a handler function to determine the response', async () => {
      mockFetchWithHandler((url, options) => {
        if (url.includes('/users')) {
          return mockFetchSuccess({ users: [{ id: 1, name: 'User 1' }] });
        } else if (url.includes('/products')) {
          return mockFetchSuccess({ products: [{ id: 1, name: 'Product 1' }] });
        } else {
          return mockFetchError(404, 'Not Found', { error: 'Resource not found' });
        }
      });
      
      // Users request
      let response = await global.fetch('https://example.com/api/users');
      let data = await response.json();
      expect(data).toHaveProperty('users');
      
      // Products request
      response = await global.fetch('https://example.com/api/products');
      data = await response.json();
      expect(data).toHaveProperty('products');
      
      // Unknown request
      response = await global.fetch('https://example.com/api/unknown');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('createMockAbortController', () => {
    it('should create a mock AbortController', () => {
      const controller = createMockAbortController();
      
      expect(controller.signal).toBeDefined();
      expect(controller.abort).toBeDefined();
      expect(controller.signal.aborted).toBe(false);
    });

    it('should have a working abort method', () => {
      const controller = createMockAbortController();
      
      controller.abort();
      expect(controller.abort).toHaveBeenCalled();
    });
  });

  describe('MockHeaders', () => {
    it('should create headers with initial values', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      });
      
      expect(headers.get('content-type')).toBe('application/json');
      expect(headers.get('authorization')).toBe('Bearer token');
    });

    it('should set and get header values', () => {
      const headers = new MockHeaders();
      
      headers.set('Content-Type', 'application/json');
      expect(headers.get('content-type')).toBe('application/json');
      
      headers.set('Authorization', 'Bearer token');
      expect(headers.get('authorization')).toBe('Bearer token');
    });

    it('should check if a header exists', () => {
      const headers = new MockHeaders({ 'Content-Type': 'application/json' });
      
      expect(headers.has('content-type')).toBe(true);
      expect(headers.has('authorization')).toBe(false);
    });

    it('should delete headers', () => {
      const headers = new MockHeaders({ 'Content-Type': 'application/json' });
      
      headers.delete('content-type');
      expect(headers.has('content-type')).toBe(false);
    });
  });
});
