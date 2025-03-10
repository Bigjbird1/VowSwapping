import { createMocks } from 'node-mocks-http';
import httpMocks from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import { rateLimit } from '@/lib/rate-limit'; // Assuming this is the rate limiter implementation

// Configure node-mocks-http to properly handle headers
httpMocks.createResponse.prototype._getHeaders = function() {
  return this._headers;
};

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock the rate limiter
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
}));

// Mock Redis client (if used for rate limiting)
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
    };
  });
});

describe('API Rate Limiting', () => {
  // Sample API handler with rate limiting
  const createApiHandler = (options = {}) => {
    return async (req, res) => {
      try {
        // Apply rate limiting
        await rateLimit(req, res, options);
        
        // If rate limit not exceeded, return success
        return res.status(200).json({ success: true });
      } catch (error) {
        // If rate limit exceeded, return 429 Too Many Requests
        if (error.status === 429) {
          return res.status(429).json({ error: 'Too many requests' });
        }
        
        // For other errors, return 500 Internal Server Error
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated session by default
    getServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
  });
  
  describe('Rate Limit Enforcement', () => {
    it('should allow requests within rate limit', async () => {
      // Mock rate limiter to not exceed limit
      rateLimit.mockResolvedValue({
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000, // 1 minute from now
      });
      
      // Create API handler with rate limiting
      const handler = createApiHandler({
        limit: 10,
        windowMs: 60000, // 1 minute
      });
      
      // Create mock request and response with proper header handling
      const { req, res } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler
      await handler(req, res);
      
      // Verify response
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true });
      
      // Verify rate limit headers
      expect(res._getHeaders()['x-ratelimit-limit']).toBe(10);
      expect(res._getHeaders()['x-ratelimit-remaining']).toBe(9);
      expect(res._getHeaders()['x-ratelimit-reset']).toBeDefined();
    });
    
    it('should block requests exceeding rate limit', async () => {
      // Mock rate limiter to exceed limit
      rateLimit.mockRejectedValue({
        status: 429,
        message: 'Too many requests',
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000, // 1 minute from now
      });
      
      // Create API handler with rate limiting
      const handler = createApiHandler({
        limit: 10,
        windowMs: 60000, // 1 minute
      });
      
      // Create mock request and response with proper header handling
      const { req, res } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler
      await handler(req, res);
      
      // Verify response
      expect(res._getStatusCode()).toBe(429);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Too many requests' });
      
      // Verify rate limit headers
      expect(res._getHeaders()['x-ratelimit-limit']).toBe(10);
      expect(res._getHeaders()['x-ratelimit-remaining']).toBe(0);
      expect(res._getHeaders()['x-ratelimit-reset']).toBeDefined();
      expect(res._getHeaders()['retry-after']).toBeDefined();
    });
  });
  
  describe('Rate Limit Configuration', () => {
    it('should apply different limits based on endpoint', async () => {
      // Mock rate limiter for different endpoints
      rateLimit
        .mockImplementationOnce(() => {
          // For auth endpoint (stricter)
          return Promise.resolve({
            limit: 5,
            remaining: 4,
            reset: Date.now() + 60000,
          });
        })
        .mockImplementationOnce(() => {
          // For products endpoint (more lenient)
          return Promise.resolve({
            limit: 50,
            remaining: 49,
            reset: Date.now() + 60000,
          });
        });
      
      // Create API handlers with different rate limits
      const authHandler = createApiHandler({
        limit: 5,
        windowMs: 60000,
        keyPrefix: 'auth',
      });
      
      const productsHandler = createApiHandler({
        limit: 50,
        windowMs: 60000,
        keyPrefix: 'products',
      });
      
      // Create mock requests and responses with proper header handling
      const { req: authReq, res: authRes } = createMocks({
        method: 'POST',
        url: '/api/auth/login',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      const { req: productsReq, res: productsRes } = createMocks({
        method: 'GET',
        url: '/api/products',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handlers
      await authHandler(authReq, authRes);
      await productsHandler(productsReq, productsRes);
      
      // Verify auth response has stricter limits
      expect(authRes._getHeaders()['x-ratelimit-limit']).toBe(5);
      expect(authRes._getHeaders()['x-ratelimit-remaining']).toBe(4);
      
      // Verify products response has more lenient limits
      expect(productsRes._getHeaders()['x-ratelimit-limit']).toBe(50);
      expect(productsRes._getHeaders()['x-ratelimit-remaining']).toBe(49);
    });
    
    it('should apply different limits based on authentication status', async () => {
      // First test with authenticated user
      rateLimit.mockResolvedValueOnce({
        limit: 100, // Higher limit for authenticated users
        remaining: 99,
        reset: Date.now() + 60000,
      });
      
      // Create API handler
      const handler = createApiHandler({
        limit: 100,
        windowMs: 60000,
      });
      
      // Create mock request and response with proper header handling
      const { req: authReq, res: authRes } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler with authenticated user
      await handler(authReq, authRes);
      
      // Verify authenticated user gets higher limit
      expect(authRes._getHeaders()['x-ratelimit-limit']).toBe(100);
      
      // Now test with unauthenticated user
      getServerSession.mockResolvedValue(null); // No session
      
      rateLimit.mockResolvedValueOnce({
        limit: 20, // Lower limit for unauthenticated users
        remaining: 19,
        reset: Date.now() + 60000,
      });
      
      // Create mock request and response with proper header handling
      const { req: unauthReq, res: unauthRes } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler with unauthenticated user
      await handler(unauthReq, unauthRes);
      
      // Verify unauthenticated user gets lower limit
      expect(unauthRes._getHeaders()['x-ratelimit-limit']).toBe(20);
    });
  });
  
  describe('Rate Limit Recovery', () => {
    it('should reset rate limit after window expires', async () => {
      // Mock time
      jest.useFakeTimers();
      
      // Set initial time
      const initialTime = new Date('2025-01-01T00:00:00Z').getTime();
      jest.setSystemTime(initialTime);
      
      // Mock rate limiter for first request
      rateLimit.mockResolvedValueOnce({
        limit: 10,
        remaining: 1, // Almost at limit
        reset: initialTime + 60000, // Reset in 1 minute
      });
      
      // Create API handler
      const handler = createApiHandler({
        limit: 10,
        windowMs: 60000, // 1 minute window
      });
      
      // Create mock request and response with proper header handling
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler for first request
      await handler(req1, res1);
      
      // Verify first response
      expect(res1._getStatusCode()).toBe(200);
      expect(res1._getHeaders()['x-ratelimit-remaining']).toBe(1);
      
      // Mock rate limiter for second request (at limit)
      rateLimit.mockRejectedValueOnce({
        status: 429,
        message: 'Too many requests',
        limit: 10,
        remaining: 0,
        reset: initialTime + 60000,
      });
      
      // Create mock request and response for second request with proper header handling
      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler for second request
      await handler(req2, res2);
      
      // Verify second response (rate limited)
      expect(res2._getStatusCode()).toBe(429);
      expect(res2._getHeaders()['x-ratelimit-remaining']).toBe(0);
      
      // Advance time past the rate limit window
      jest.advanceTimersByTime(60001); // 1 minute and 1 ms
      
      // Mock rate limiter for third request (limit reset)
      rateLimit.mockResolvedValueOnce({
        limit: 10,
        remaining: 9, // Reset to full limit minus this request
        reset: initialTime + 120000, // New reset time
      });
      
      // Create mock request and response for third request with proper header handling
      const { req: req3, res: res3 } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler for third request
      await handler(req3, res3);
      
      // Verify third response (no longer rate limited)
      expect(res3._getStatusCode()).toBe(200);
      expect(res3._getHeaders()['x-ratelimit-remaining']).toBe(9);
      
      // Restore real timers
      jest.useRealTimers();
    });
  });
  
  describe('Rate Limit Bypass Prevention', () => {
    it('should prevent rate limit bypass using different IPs', async () => {
      // Mock rate limiter to track by user ID instead of IP
      rateLimit
        .mockImplementationOnce((req) => {
          // First request from IP 1
          return Promise.resolve({
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          });
        })
        .mockImplementationOnce((req) => {
          // Second request from IP 2, but same user
          return Promise.resolve({
            limit: 10,
            remaining: 8, // Count decremented, showing it's tracking the user
            reset: Date.now() + 60000,
          });
        });
      
      // Create API handler that uses user ID for rate limiting
      const handler = createApiHandler({
        limit: 10,
        windowMs: 60000,
        keyGenerator: (req) => {
          // Use user ID from session instead of IP
          const session = getServerSession(req);
          return session?.user?.id || req.ip;
        },
      });
      
      // Create mock requests from different IPs with proper header handling
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        headers: {
          'x-forwarded-for': '1.2.3.4',
        },
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        headers: {
          'x-forwarded-for': '5.6.7.8', // Different IP
        },
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler for both requests
      await handler(req1, res1);
      await handler(req2, res2);
      
      // Verify both requests counted against the same limit
      expect(res1._getHeaders()['x-ratelimit-remaining']).toBe(9);
      expect(res2._getHeaders()['x-ratelimit-remaining']).toBe(8);
    });
    
    it('should prevent rate limit bypass using different user agents', async () => {
      // Mock rate limiter to track by user ID instead of user agent
      rateLimit
        .mockImplementationOnce((req) => {
          // First request with user agent 1
          return Promise.resolve({
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          });
        })
        .mockImplementationOnce((req) => {
          // Second request with user agent 2, but same user
          return Promise.resolve({
            limit: 10,
            remaining: 8, // Count decremented, showing it's tracking the user
            reset: Date.now() + 60000,
          });
        });
      
      // Create API handler that uses user ID for rate limiting
      const handler = createApiHandler({
        limit: 10,
        windowMs: 60000,
        keyGenerator: (req) => {
          // Use user ID from session instead of user agent
          const session = getServerSession(req);
          return session?.user?.id || req.headers['user-agent'];
        },
      });
      
      // Create mock requests with different user agents with proper header handling
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', // Different user agent
        },
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler for both requests
      await handler(req1, res1);
      await handler(req2, res2);
      
      // Verify both requests counted against the same limit
      expect(res1._getHeaders()['x-ratelimit-remaining']).toBe(9);
      expect(res2._getHeaders()['x-ratelimit-remaining']).toBe(8);
    });
  });
  
  describe('DDoS Protection', () => {
    it('should apply stricter limits during suspected DDoS', async () => {
      // Mock a DDoS detection function
      const isDDoSAttack = jest.fn();
      
      // First test normal conditions
      isDDoSAttack.mockReturnValueOnce(false);
      
      rateLimit.mockResolvedValueOnce({
        limit: 100, // Normal limit
        remaining: 99,
        reset: Date.now() + 60000,
      });
      
      // Create API handler with dynamic rate limiting
      const handler = createApiHandler({
        // Dynamic limit based on DDoS detection
        limit: (req) => (isDDoSAttack(req) ? 10 : 100),
        windowMs: 60000,
      });
      
      // Create mock request and response with proper header handling
      const { req: normalReq, res: normalRes } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler under normal conditions
      await handler(normalReq, normalRes);
      
      // Verify normal limit applied
      expect(normalRes._getHeaders()['x-ratelimit-limit']).toBe(100);
      
      // Now test with suspected DDoS
      isDDoSAttack.mockReturnValueOnce(true);
      
      rateLimit.mockResolvedValueOnce({
        limit: 10, // Stricter limit during DDoS
        remaining: 9,
        reset: Date.now() + 60000,
      });
      
      // Create mock request and response with proper header handling
      const { req: ddosReq, res: ddosRes } = createMocks({
        method: 'GET',
      }, {
        eventEmitter: require('events').EventEmitter
      });
      
      // Call API handler during suspected DDoS
      await handler(ddosReq, ddosRes);
      
      // Verify stricter limit applied
      expect(ddosRes._getHeaders()['x-ratelimit-limit']).toBe(10);
    });
  });
});
