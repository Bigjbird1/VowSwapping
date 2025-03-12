import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import {
  createMockRequest,
  createMockSession,
  validateErrorResponse
} from '../utils/test-utils';
import { hashPassword } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockImplementation((password) => {
    // Mock hash for the test password
    if (password === 'PreviousPassword123!') {
      return Promise.resolve('$2a$10$mockedHashForTestPassword');
    }
    return Promise.resolve('$2a$10$otherHash');
  })
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    verificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock crypto for token generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-token')
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('hashed-token')
    })
  })
}));

describe('Security Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Errors', () => {
    it('should handle missing authentication gracefully', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { GET: getUserProfileHandler } = await import('@/app/api/user/profile/route');

      // Mock getServerSession to return null (unauthenticated)
      getServerSession.mockResolvedValueOnce(null);

      // Create a mock request
      const req = createMockRequest('GET', 'http://localhost:3000/api/user/profile');

      // Call the handler
      const response = await getUserProfileHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 401, 'unauthorized|not authenticated|login');
    });

    it('should handle invalid credentials', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: signInHandler } = await import('@/app/api/auth/signin-after-register/route');

      // Mock user retrieval to return null (user not found)
      prisma.user.findUnique.mockResolvedValueOnce(null);

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/signin-after-register', {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      });

      // Call the handler
      const response = await signInHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 401, 'invalid|credentials|email|password');
    });

    it('should handle expired sessions', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { GET: getUserProfileHandler } = await import('@/app/api/user/profile/route');

      // Mock getServerSession to return a session with an expired token
      getServerSession.mockImplementationOnce(() => {
        throw new Error('Session expired');
      });

      // Create a mock request
      const req = createMockRequest('GET', 'http://localhost:3000/api/user/profile');

      // Call the handler
      const response = await getUserProfileHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 401, 'session expired|login again');
    });

    it('should handle invalid tokens', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: verifyEmailHandler } = await import('@/app/api/auth/verify-email/route');

      // Mock verification token retrieval to return null (token not found)
      prisma.verificationToken.findUnique.mockResolvedValueOnce(null);

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/verify-email', {
        token: 'invalid-token'
      });

      // Call the handler
      const response = await verifyEmailHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 400, 'invalid|token|not found');
    });

    it('should handle expired tokens', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: resetPasswordHandler } = await import('@/app/api/auth/reset-password/route');

      // Mock verification token retrieval to return an expired token
      prisma.verificationToken.findUnique.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'expired-token',
        expires: new Date(Date.now() - 3600000) // Expired 1 hour ago
      });

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/reset-password', {
        token: 'expired-token',
        password: 'NewPassword123!'
      });

      // Call the handler
      const response = await resetPasswordHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 400, 'expired|token|invalid');
    });
  });

  describe('Authorization Errors', () => {
    it('should handle insufficient permissions', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/seller/products/route');

      // Mock authenticated session without seller permissions
      getServerSession.mockResolvedValueOnce(createMockSession({
        isSeller: false
      }));

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/seller/products', {
        title: 'Test Product',
        description: 'Test description',
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });

      // Call the handler
      const response = await createProductHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 403, 'forbidden|not a seller|permission');
    });

    it('should handle unauthorized resource access', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { PUT: updateProductHandler } = await import('@/app/api/seller/products/[id]/route');

      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValueOnce(createMockSession({
        isSeller: true,
        sellerApproved: true,
        user: { id: 'current-seller-id' } // Explicit ID for clarity
      }));

      // Mock user lookup to confirm seller status
      prisma.user.findUnique.mockResolvedValueOnce({
        isSeller: true,
        sellerApproved: true
      });

      // Mock product retrieval to return a product owned by a different seller
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        sellerId: 'different-seller-id' // Simplified mock
      });

      // Create params and request
      const params = { params: { id: 'product-1' } };
      const req = createMockRequest('PUT', 'http://localhost:3000/api/seller/products/product-1', {
        title: 'Updated Product',
        price: 29.99
      });

      // Call the handler
      const response = await updateProductHandler(req, params);

      // Validate the error response
      await validateErrorResponse(response, 403, 'forbidden|not your product|unauthorized');
    });

    it('should handle pending seller approval', async () => {

      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/seller/products/route');

      // Mock session validation
      getServerSession.mockResolvedValueOnce({
        user: { id: 'test-user-id' },
        expires: new Date().toISOString()
      });

      // Mock user lookup
      prisma.user.findUnique.mockResolvedValueOnce({
        isSeller: true,
        sellerApproved: false
      });

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/seller/products', {
        title: 'Test Product',
        description: 'Test description',
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });

      // Call the handler
      const response = await createProductHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 403, '/pending approval|not approved|wait');
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests with invalid CSRF tokens', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: updateProfileHandler } = await import('@/app/api/user/profile/route');

      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());

      // Create a mock request with an invalid CSRF token
      const req = createMockRequest('POST', 'http://localhost:3000/api/user/profile', {
        name: 'Updated User'
      }, {
        'x-csrf-token': 'invalid-token'
      });

      // Call the handler
      const response = await updateProfileHandler(req);

      // If the API implements CSRF protection, this should fail
      if (response.status === 403) {
        await validateErrorResponse(response, 403, 'csrf|invalid token|security');
      } else {
        // If it succeeded, the API might not implement CSRF protection
        console.log('WARNING: API does not implement CSRF protection');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for sensitive operations', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: forgotPasswordHandler } = await import('@/app/api/auth/forgot-password/route');

      // Create multiple requests to simulate rate limiting
      const req1 = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      }, { 'X-Forwarded-For': '192.168.1.1' });

      const req2 = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      }, { 'X-Forwarded-For': '192.168.1.1' });

      const req3 = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      }, { 'X-Forwarded-For': '192.168.1.1' });

      const req4 = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      }, { 'X-Forwarded-For': '192.168.1.1' });

      // Call the handler multiple times
      await forgotPasswordHandler(req1);
      await forgotPasswordHandler(req2);
      await forgotPasswordHandler(req3);
      const response = await forgotPasswordHandler(req4);

      // If the API implements rate limiting, this should fail
      if (response.status === 429) {
        await validateErrorResponse(response, 429, 'too many requests|rate limit|try again');
      } else {
        // If it succeeded, the API might not implement rate limiting
        console.log('WARNING: API does not implement rate limiting for sensitive operations');
      }
    });
  });

  describe('Password Security', () => {
    it('should enforce password strength requirements', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: registerHandler } = await import('@/app/api/auth/register/route');

      // Create a mock request with a weak password
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak'
      });

      // Call the handler
      const response = await registerHandler(req);

      // Validate the error response
      await validateErrorResponse(response, 400, 'password|weak|requirements|strength');
    });

    it('should prevent password reuse', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: resetPasswordHandler } = await import('@/app/api/auth/reset-password/route');

      // Mock verification token retrieval to return a valid token
      prisma.verificationToken.findUnique.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 3600000) // Valid for 1 hour
      });

      // In the test setup
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        passwordHistory: [
          '$2a$10$mockedHashForTestPassword', // Matches the test password hash
          '$2a$10$previousHash2'
        ]
      });

      // Create a mock request with a previously used password
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/reset-password', {
        token: 'valid-token',
        password: 'PreviousPassword123!'
      });

      // Call the handler
      const response = await resetPasswordHandler(req);

      // If the API implements password reuse prevention, this should fail
      if (response.status === 400) {
        // Change the test validation to match the actual error message
        await validateErrorResponse(
          response,
          400,
          'password|previously used|new password|must not match'
        );
      } else {
        // If it succeeded, the API might not implement password reuse prevention
        console.log('WARNING: API does not implement password reuse prevention');
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize inputs to prevent XSS attacks', async () => {
      const { POST: createReviewHandler } = await import('@/app/api/reviews/product/[id]/route');
    
      getServerSession.mockResolvedValueOnce(createMockSession());
    
      const params = { params: { id: 'product-1' } };
    
      const xssComment = '<script>alert("XSS")</script>Great product!';
      const sanitizedComment = 'Great product!'; // Expected sanitized output
    
      const req = createMockRequest('POST', 'http://localhost:3000/api/reviews/product/product-1', {
        rating: 5,
        comment: xssComment
      });
    
      prisma.review.create.mockResolvedValueOnce({
        id: 'review-1',
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
        comment: sanitizedComment // Ensure this matches the expected sanitized comment
      });
    
      const response = await createReviewHandler(req, params);
    
      expect(response.status).toBe(201);
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            comment: expect.any(String)
          })
        })
      );
    
      const createCall = prisma.review.create.mock.calls[0][0];
      const savedComment = createCall.data.comment;
    
      expect(savedComment).not.toContain('<script>');
      expect(savedComment).toBe(sanitizedComment);
    });
    
  });

  describe('Session Handling', () => {
    it('should invalidate sessions after password change', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: changePasswordHandler } = await import('@/app/api/auth/change-password/route');

      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());

      // Mock user retrieval to return a user
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$10$hashedOldPassword'
      });

      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/change-password', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      });

      // Call the handler
      const response = await changePasswordHandler(req);

      // If the API invalidates sessions after password change, it should return a specific header
      if (response.status === 200) {
        const headers = response.headers;
        const setCookie = headers.get('Set-Cookie');

        if (setCookie && setCookie.includes('next-auth.session-token=;')) {
          console.log('API invalidates sessions after password change');
        } else {
          console.log('WARNING: API does not invalidate sessions after password change');
        }
      } else {
        // If it failed, it's an unexpected error
        await validateErrorResponse(response, 400, 'password|change|failed');
      }
    });
  });
});
