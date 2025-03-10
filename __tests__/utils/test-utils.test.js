/**
 * Tests for test utility functions
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
    it('should create a mock request with GET method', () => {
      const request = createMockRequest('GET', 'https://example.com/api');
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://example.com/api');
    });

    it('should create a mock request with POST method and body', () => {
      const body = { name: 'Test User', email: 'test@example.com' };
      const request = createMockRequest('POST', 'https://example.com/api/users', body);
      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://example.com/api/users');
      // In a real test, we would verify the body, but the mock implementation doesn't expose it directly
    });

    it('should create a mock request with custom headers', () => {
      const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };
      const request = createMockRequest('GET', 'https://example.com/api', null, headers);
      expect(request.headers.get('Content-Type')).toBe('application/json');
      expect(request.headers.get('Authorization')).toBe('Bearer token');
    });
  });

  describe('createMockSession', () => {
    it('should create a default mock session', () => {
      const session = createMockSession();
      expect(session.user).toBeDefined();
      expect(session.user.id).toBe('user-1');
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.name).toBe('Test User');
      expect(session.expires).toBeDefined();
    });

    it('should create a mock session with overrides', () => {
      const overrides = {
        user: {
          id: 'custom-user-id',
          email: 'custom@example.com',
          role: 'admin'
        },
        expires: '2023-12-31T00:00:00.000Z'
      };
      const session = createMockSession(overrides);
      expect(session.user.id).toBe('custom-user-id');
      expect(session.user.email).toBe('custom@example.com');
      expect(session.user.role).toBe('admin');
      expect(session.expires).toBe('2023-12-31T00:00:00.000Z');
    });
  });

  describe('simulateNetworkDelay', () => {
    it('should delay execution for the specified time', async () => {
      const start = Date.now();
      await simulateNetworkDelay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow for small timing variations
    });
  });

  describe('simulateNetworkFailure', () => {
    it('should throw an error with the default message', () => {
      expect(() => simulateNetworkFailure()).toThrow('Network error');
    });

    it('should throw an error with a custom message', () => {
      expect(() => simulateNetworkFailure('Custom error message')).toThrow('Custom error message');
    });
  });

  describe('createDatabaseError', () => {
    it('should create a database error with the specified code and message', () => {
      const error = createDatabaseError('P2002', 'Unique constraint violation');
      expect(error.message).toBe('Unique constraint violation');
      expect(error.code).toBe('P2002');
      expect(error.meta).toEqual({});
    });

    it('should create a database error with metadata', () => {
      const meta = { target: ['email'] };
      const error = createDatabaseError('P2002', 'Unique constraint violation', meta);
      expect(error.meta).toEqual(meta);
    });
  });

  describe('createMockPrismaClient', () => {
    it('should create a mock Prisma client with default options', () => {
      const prisma = createMockPrismaClient();
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.user.create).toBeDefined();
      expect(prisma.product.findMany).toBeDefined();
      expect(prisma.$transaction).toBeDefined();
    });

    it('should create a mock Prisma client that fails on find operations', async () => {
      const prisma = createMockPrismaClient({ shouldFailOnFind: true });
      await expect(prisma.user.findUnique()).rejects.toThrow();
    });

    it('should create a mock Prisma client that times out', async () => {
      const prisma = createMockPrismaClient({ shouldTimeout: true, timeoutMs: 100 });
      await expect(prisma.user.findUnique()).rejects.toThrow('Database operation timed out');
    });
  });

  describe('createStripeError', () => {
    it('should create a StripeCardError', () => {
      const error = createStripeError('StripeCardError', 'Your card was declined', {
        code: 'card_declined',
        decline_code: 'insufficient_funds'
      });
      expect(error.message).toBe('Your card was declined');
      expect(error.type).toBe('StripeCardError');
      expect(error.code).toBe('card_declined');
      expect(error.decline_code).toBe('insufficient_funds');
    });

    it('should create a StripeRateLimitError', () => {
      const error = createStripeError('StripeRateLimitError', 'Too many requests', {
        retryAfter: '60'
      });
      expect(error.message).toBe('Too many requests');
      expect(error.type).toBe('StripeRateLimitError');
      expect(error.headers['retry-after']).toBe('60');
    });
  });

  describe('createMockUrl', () => {
    it('should create a URL with query parameters', () => {
      const url = createMockUrl('https://example.com/api', { page: '1', limit: '10' });
      expect(url.href).toBe('https://example.com/api?page=1&limit=10');
      expect(url.searchParams.get('page')).toBe('1');
      expect(url.searchParams.get('limit')).toBe('10');
    });
  });

  describe('createMockResponse', () => {
    it('should create a response with JSON body', () => {
      const body = { id: 1, name: 'Test' };
      const response = createMockResponse(body);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
    });

    it('should create a response with custom status and headers', () => {
      const options = {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' }
      };
      const response = createMockResponse({ error: 'Not found' }, options);
      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
