/**
 * Tests for fetch-test-utils.js
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
      const data = { success: true, message: 'Success' };
      const response = await mockFetchSuccess(data);
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(await response.json()).toEqual(data);
      expect(await response.text()).toBe(JSON.stringify(data));
      expect(response.headers).toBeInstanceOf(Headers);
    });

    it('should create a successful response with custom options', async () => {
      const data = { success: true, message: 'Created' };
      const options = {
        status: 201,
        statusText: 'Created',
        headers: { 'Content-Type': 'application/json', 'X-Custom': 'Value' }
      };
      
      const response = await mockFetchSuccess(data, options);
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(await response.json()).toEqual(data);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Custom')).toBe('Value');
    });

    it('should have a clone method that returns itself', async () => {
      const data = { success: true };
      const response = await mockFetchSuccess(data);
      
      const cloned = response.clone();
      
      expect(cloned).toBe(response);
      expect(await cloned.json()).toEqual(data);
    });
  });

  describe('mockFetchError', () => {
    it('should create an error response with default options', async () => {
      const response = await mockFetchError();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      expect(await response.json()).toEqual({});
    });

    it('should create an error response with custom options', async () => {
      const data = { error: 'Not Found', message: 'Resource not found' };
      const response = await mockFetchError(404, 'Not Found', data, { 'X-Error': 'NotFound' });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(await response.json()).toEqual(data);
      expect(response.headers.get('X-Error')).toBe('NotFound');
    });
  });

  describe('mockNetworkError', () => {
    it('should create a rejected promise with a TypeError', async () => {
      const errorPromise = mockNetworkError();
      
      await expect(errorPromise).rejects.toThrow('Network error');
      await expect(errorPromise).rejects.toBeInstanceOf(TypeError);
      
      try {
        await errorPromise;
      } catch (error) {
        expect(error.name).toBe('NetworkError');
      }
    });

    it('should allow custom error message', async () => {
      const errorPromise = mockNetworkError('Failed to connect');
      
      await expect(errorPromise).rejects.toThrow('Failed to connect');
    });
  });

  describe('mockTimeoutError', () => {
    it('should create a rejected promise with an AbortError', async () => {
      const errorPromise = mockTimeoutError();
      
      await expect(errorPromise).rejects.toThrow('Request timed out');
      
      try {
        await errorPromise;
      } catch (error) {
        expect(error.name).toBe('AbortError');
      }
    });

    it('should allow custom error message', async () => {
      const errorPromise = mockTimeoutError('Connection timed out');
      
      await expect(errorPromise).rejects.toThrow('Connection timed out');
    });
  });

  describe('mockRateLimitError', () => {
    it('should create a 429 response with default retry-after', async () => {
      const response = await mockRateLimitError();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(response.statusText).toBe('Too Many Requests');
      expect(await response.json()).toEqual({ error: 'Rate limit exceeded' });
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should allow custom retry-after value', async () => {
      const response = await mockRateLimitError(120);
      
      expect(response.headers.get('Retry-After')).toBe('120');
    });
  });

  describe('setupFetchMock', () => {
    it('should replace global fetch with a mock', () => {
      const fetchMock = setupFetchMock();
      
      expect(global.fetch).toBe(fetchMock);
      expect(jest.isMockFunction(global.fetch)).toBe(true);
    });

    it('should use default success response if no implementation provided', async () => {
      setupFetchMock();
      
      const response = await global.fetch('https://example.com');
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it('should use provided mock implementation', async () => {
      const errorResponse = mockFetchError(404, 'Not Found');
      setupFetchMock(errorResponse);
      
      const response = await global.fetch('https://example.com');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should return the mock for further customization', () => {
      const fetchMock = setupFetchMock();
      
      fetchMock.mockImplementationOnce(() => mockFetchError(401));
      
      expect(fetchMock).toBe(global.fetch);
    });
  });

  describe('restoreFetch', () => {
    it('should restore original fetch if it exists', () => {
      // Setup
      const mockFetch = jest.fn();
      global._originalFetch = originalFetch;
      global.fetch = mockFetch;
      
      // Act
      restoreFetch();
      
      // Assert
      expect(global.fetch).toBe(originalFetch);
      expect(global._originalFetch).toBeUndefined();
    });

    it('should delete mock if original fetch not saved', () => {
      // Setup
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
      
      // Act
      restoreFetch();
      
      // Assert
      expect(global.fetch).toBeUndefined();
    });
  });

  describe('mockFetchSequence', () => {
    it('should mock a sequence of responses', async () => {
      // Setup sequence: success, error, network error
      mockFetchSequence([
        { success: true, id: 1 },
        () => mockFetchError(404, 'Not Found'),
        () => mockNetworkError()
      ]);
      
      // First call - success
      const response1 = await global.fetch('https://example.com');
      expect(response1.ok).toBe(true);
      expect(await response1.json()).toEqual({ success: true, id: 1 });
      
      // Second call - error
      const response2 = await global.fetch('https://example.com');
      expect(response2.ok).toBe(false);
      expect(response2.status).toBe(404);
      
      // Third call - network error
      await expect(global.fetch('https://example.com')).rejects.toThrow('Network error');
    });

    it('should convert objects to success responses', async () => {
      mockFetchSequence([
        { id: 1 },
        { id: 2 }
      ]);
      
      const response1 = await global.fetch('https://example.com');
      expect(await response1.json()).toEqual({ id: 1 });
      
      const response2 = await global.fetch('https://example.com');
      expect(await response2.json()).toEqual({ id: 2 });
    });
  });

  describe('mockFetchWithHandler', () => {
    it('should use handler function to determine response', async () => {
      // Setup handler that returns different responses based on URL
      mockFetchWithHandler((url, options) => {
        if (url.includes('/users')) {
          return mockFetchSuccess({ users: [{ id: 1, name: 'User 1' }] });
        } else if (url.includes('/products')) {
          return mockFetchSuccess({ products: [{ id: 1, name: 'Product 1' }] });
        } else {
          return mockFetchError(404, 'Not Found');
        }
      });
      
      // Users endpoint
      const usersResponse = await global.fetch('https://example.com/users');
      expect(await usersResponse.json()).toEqual({ users: [{ id: 1, name: 'User 1' }] });
      
      // Products endpoint
      const productsResponse = await global.fetch('https://example.com/products');
      expect(await productsResponse.json()).toEqual({ products: [{ id: 1, name: 'Product 1' }] });
      
      // Unknown endpoint
      const notFoundResponse = await global.fetch('https://example.com/unknown');
      expect(notFoundResponse.status).toBe(404);
    });

    it('should pass request options to handler', async () => {
      const handler = jest.fn().mockReturnValue(mockFetchSuccess({}));
      mockFetchWithHandler(handler);
      
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' })
      };
      
      await global.fetch('https://example.com', options);
      
      expect(handler).toHaveBeenCalledWith('https://example.com', options);
    });
  });

  describe('createMockAbortController', () => {
    it('should create a mock AbortController with expected properties', () => {
      const controller = createMockAbortController();
      
      expect(controller.signal).toBeDefined();
      expect(controller.signal.aborted).toBe(false);
      expect(controller.abort).toBeDefined();
      expect(jest.isMockFunction(controller.abort)).toBe(true);
    });

    it('should have addEventListener and removeEventListener methods', () => {
      const controller = createMockAbortController();
      
      expect(controller.signal.addEventListener).toBeDefined();
      expect(controller.signal.removeEventListener).toBeDefined();
      expect(jest.isMockFunction(controller.signal.addEventListener)).toBe(true);
      expect(jest.isMockFunction(controller.signal.removeEventListener)).toBe(true);
    });
  });

  describe('MockHeaders', () => {
    it('should create headers with default values', () => {
      const headers = new MockHeaders();
      
      expect(headers.get('content-type')).toBeNull();
    });

    it('should create headers with initial values', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      });
      
      expect(headers.get('content-type')).toBe('application/json');
      expect(headers.get('x-api-key')).toBe('test-key');
    });

    it('should set and get header values', () => {
      const headers = new MockHeaders();
      
      headers.set('Content-Type', 'application/json');
      
      expect(headers.get('content-type')).toBe('application/json');
    });

    it('should check if header exists', () => {
      const headers = new MockHeaders({ 'X-Test': 'value' });
      
      expect(headers.has('x-test')).toBe(true);
      expect(headers.has('content-type')).toBe(false);
    });

    it('should delete headers', () => {
      const headers = new MockHeaders({ 'X-Test': 'value' });
      
      headers.delete('x-test');
      
      expect(headers.has('x-test')).toBe(false);
    });

    it('should append headers', () => {
      const headers = new MockHeaders();
      
      headers.append('X-Test', 'value');
      
      expect(headers.get('x-test')).toBe('value');
    });

    it('should iterate over entries', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      });
      
      const entries = Array.from(headers.entries());
      
      expect(entries).toEqual([
        ['content-type', 'application/json'],
        ['x-api-key', 'test-key']
      ]);
    });

    it('should iterate over keys', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      });
      
      const keys = Array.from(headers.keys());
      
      expect(keys).toEqual(['content-type', 'x-api-key']);
    });

    it('should iterate over values', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      });
      
      const values = Array.from(headers.values());
      
      expect(values).toEqual(['application/json', 'test-key']);
    });

    it('should execute forEach callback for each entry', () => {
      const headers = new MockHeaders({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      });
      
      const callback = jest.fn();
      headers.forEach(callback);
      
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('application/json', 'content-type', headers);
      expect(callback).toHaveBeenCalledWith('test-key', 'x-api-key', headers);
    });
  });
});
