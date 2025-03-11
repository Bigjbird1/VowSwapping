/**
 * Tests for test-utils.js
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createMockRequest,
  createMockSession,
  simulateNetworkDelay,
  simulateNetworkFailure,
  createDatabaseError,
  simulateDatabaseTimeout,
  createMockPrismaClient,
  simulateConcurrentRequests,
  createStripeError,
  validateErrorResponse,
  createMockFormData,
  createMockUrl,
  createMockHeaders,
  createMockResponse
} from './test-utils';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(Object.entries(options?.headers || {})),
    json: jest.fn().mockImplementation(async () => {
      if (options?.body) {
        return JSON.parse(options.body);
      }
      return {};
    }),
    nextUrl: new URL(url),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('Test Utilities', () => {
  describe('createMockRequest', () => {
    it('should create a mock request with default values', () => {
      const req = createMockRequest('GET', 'https://example.com');
      expect(req.method).toBe('GET');
      expect(req.url).toBe('https://example.com');
      expect(req.headers.get('Content-Type')).toBeUndefined();
    });

    it('should create a mock request with body and content type', () => {
      const body = { name: 'Test' };
      const req = createMockRequest('POST', 'https://example.com', body);
      expect(req.method).toBe('POST');
      expect(req.headers.get('Content-Type')).toBe('application/json');
    });

    it('should respect custom headers', () => {
      const headers = { 'X-Custom-Header': 'test-value' };
      const req = createMockRequest('GET', 'https://example.com', null, headers);
      expect(req.headers.get('X-Custom-Header')).toBe('test-value');
    });
  });

  describe('createMockSession', () => {
    it('should create a mock session with default values', () => {
      const session = createMockSession();
      expect(session.user.id).toBe('user-1');
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.name).toBe('Test User');
      expect(session.expires).toBeDefined();
    });

    it('should override default values with provided overrides', () => {
      const overrides = {
        user: {
          id: 'custom-id',
          role: 'admin'
        }
      };
      const session = createMockSession(overrides);
      expect(session.user.id).toBe('custom-id');
      expect(session.user.role).toBe('admin');
      expect(session.user.email).toBe('test@example.com'); // Not overridden
    });
  });

  describe('simulateNetworkDelay', () => {
    it('should delay execution for specified time', async () => {
      const start = Date.now();
      await simulateNetworkDelay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow for small timing variations
    });
  });

  describe('simulateNetworkFailure', () => {
    it('should throw an error with default message', () => {
      expect(() => simulateNetworkFailure()).toThrow('Network error');
    });

    it('should throw an error with custom message', () => {
      expect(() => simulateNetworkFailure('Custom error')).toThrow('Custom error');
    });
  });

  describe('createDatabaseError', () => {
    it('should create a database error with code and message', () => {
      const error = createDatabaseError('P2002', 'Unique constraint violation');
      expect(error.code).toBe('P2002');
      expect(error.message).toBe('Unique constraint violation');
      expect(error.meta).toEqual({});
    });

    it('should include metadata if provided', () => {
      const meta = { target: ['email'] };
      const error = createDatabaseError('P2002', 'Unique constraint violation', meta);
      expect(error.meta).toEqual(meta);
    });
  });

  describe('simulateDatabaseTimeout', () => {
    it('should reject after specified timeout', async () => {
      const promise = simulateDatabaseTimeout(100);
      await expect(promise).rejects.toThrow('Database operation timed out');
    });
  });

  describe('createMockPrismaClient', () => {
    it('should create a mock client with default success behavior', () => {
      const prisma = createMockPrismaClient();
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.product.findMany).toBeDefined();
      expect(prisma.$transaction).toBeDefined();
    });

    it('should simulate find failures when configured', async () => {
      const prisma = createMockPrismaClient({ shouldFailOnFind: true });
      await expect(prisma.user.findUnique()).rejects.toHaveProperty('code', 'P2002');
    });

    it('should simulate create failures when configured', async () => {
      const prisma = createMockPrismaClient({ shouldFailOnCreate: true });
      await expect(prisma.user.create()).rejects.toHaveProperty('code', 'P2002');
    });

    it('should simulate transaction failures when configured', async () => {
      const prisma = createMockPrismaClient({ shouldFailOnCreate: true });
      await expect(prisma.$transaction(() => {})).rejects.toHaveProperty('code', 'P2002');
    });

    it('should simulate timeouts when configured', async () => {
      const prisma = createMockPrismaClient({ shouldTimeout: true, timeoutMs: 100 });
      await expect(prisma.user.findUnique()).rejects.toThrow('Database operation timed out');
    });

    it('should use custom error codes and messages when provided', async () => {
      const prisma = createMockPrismaClient({
        shouldFailOnFind: true,
        errorCode: 'P2025',
        errorMessage: 'Record not found'
      });
      await expect(prisma.user.findUnique()).rejects.toHaveProperty('code', 'P2025');
      await expect(prisma.user.findUnique()).rejects.toHaveProperty('message', 'Record not found');
    });
  });

  describe('simulateConcurrentRequests', () => {
    it('should execute multiple request functions concurrently', async () => {
      const fn1 = jest.fn().mockResolvedValue('result1');
      const fn2 = jest.fn().mockResolvedValue('result2');
      
      const results = await simulateConcurrentRequests([fn1, fn2]);
      
      expect(results).toEqual(['result1', 'result2']);
      expect(fn1).toHaveBeenCalled();
      expect(fn2).toHaveBeenCalled();
    });

    it('should handle mixed success and failure', async () => {
      const fn1 = jest.fn().mockResolvedValue('success');
      const fn2 = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Using Promise.allSettled behavior
      const results = await Promise.allSettled(simulateConcurrentRequests([fn1, fn2]));
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('createStripeError', () => {
    it('should create a basic Stripe error', () => {
      const error = createStripeError('StripeError', 'Something went wrong');
      expect(error.type).toBe('StripeError');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('generic_error');
    });

    it('should create a card error with decline code', () => {
      const error = createStripeError('StripeCardError', 'Card declined', {
        decline_code: 'insufficient_funds'
      });
      expect(error.type).toBe('StripeCardError');
      expect(error.decline_code).toBe('insufficient_funds');
    });

    it('should create a rate limit error with retry header', () => {
      const error = createStripeError('StripeRateLimitError', 'Rate limited', {
        retryAfter: '60'
      });
      expect(error.type).toBe('StripeRateLimitError');
      expect(error.headers['retry-after']).toBe('60');
    });

    it('should create an API error with http status', () => {
      const error = createStripeError('StripeAPIError', 'Server error', {
        http_status: 503
      });
      expect(error.type).toBe('StripeAPIError');
      expect(error.http_status).toBe(503);
    });
  });

  describe('validateErrorResponse', () => {
    it('should validate a matching error response', async () => {
      const response = {
        status: 400,
        json: async () => ({ error: 'Invalid input data' })
      };
      
      await expect(validateErrorResponse(response, 400, 'invalid input')).resolves.not.toThrow();
    });

    it('should fail validation for non-matching status code', async () => {
      const response = {
        status: 500,
        json: async () => ({ error: 'Server error' })
      };
      
      await expect(validateErrorResponse(response, 400, 'invalid input')).rejects.toThrow();
    });

    it('should match any of the pipe-separated patterns', async () => {
      const response = {
        status: 400,
        json: async () => ({ error: 'Invalid email format' })
      };
      
      await expect(validateErrorResponse(response, 400, 'invalid password|invalid email')).resolves.not.toThrow();
    });
  });

  describe('createMockFormData', () => {
    it('should create FormData with fields', () => {
      const formData = createMockFormData({ name: 'Test', email: 'test@example.com' });
      expect(formData.get('name')).toBe('Test');
      expect(formData.get('email')).toBe('test@example.com');
    });

    it('should create FormData with files', () => {
      const files = {
        image: {
          content: 'test-content',
          name: 'test.jpg',
          type: 'image/jpeg'
        }
      };
      const formData = createMockFormData({}, files);
      const file = formData.get('image');
      expect(file).toBeInstanceOf(Blob);
      expect(file.type).toBe('image/jpeg');
    });
  });

  describe('createMockUrl', () => {
    it('should create a URL with query parameters', () => {
      const url = createMockUrl('https://example.com', { q: 'test', page: '2' });
      expect(url.searchParams.get('q')).toBe('test');
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.origin).toBe('https://example.com');
    });
  });

  describe('createMockHeaders', () => {
    it('should create Headers object with provided values', () => {
      const headers = createMockHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      });
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer token');
    });
  });

  describe('createMockResponse', () => {
    it('should create a response with JSON body', () => {
      const body = { success: true, data: [1, 2, 3] };
      const response = createMockResponse(body, { status: 200 });
      
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      return response.json().then(data => {
        expect(data).toEqual(body);
      });
    });

    it('should create a response with string body', () => {
      const body = 'Plain text response';
      const response = createMockResponse(body, { status: 200 });
      
      return response.text().then(text => {
        expect(text).toBe(body);
      });
    });

    it('should set ok to false for error status codes', () => {
      const response = createMockResponse({ error: 'Not found' }, { status: 404 });
      expect(response.ok).toBe(false);
    });
  });
});
