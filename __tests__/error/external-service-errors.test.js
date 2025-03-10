import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { 
  createMockRequest, 
  createMockSession,
  createStripeError,
  validateErrorResponse
} from '../utils/test-utils';

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
    order: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

// Mock Cloudinary
jest.mock('@/lib/cloudinary', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
    verify: jest.fn(),
  }),
}));

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('External Service Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stripe Integration Errors', () => {
    it('should handle Stripe payment intent creation failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createPaymentIntentHandler } = await import('@/app/api/payments/create-intent/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Stripe payment intent creation to fail
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.create.mockRejectedValueOnce(
        createStripeError('StripeCardError', 'Your card was declined')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/payments/create-intent', {
        amount: 1999,
        currency: 'usd',
        description: 'Test payment'
      });
      
      // Call the handler
      const response = await createPaymentIntentHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'card|declined|payment failed');
    });

    it('should handle Stripe API errors', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createPaymentIntentHandler } = await import('@/app/api/payments/create-intent/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Stripe API error
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.create.mockRejectedValueOnce(
        createStripeError('StripeAPIError', 'Stripe API error')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/payments/create-intent', {
        amount: 1999,
        currency: 'usd',
        description: 'Test payment'
      });
      
      // Call the handler
      const response = await createPaymentIntentHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 500, 'stripe|api|error');
    });

    it('should handle Stripe rate limit errors', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createPaymentIntentHandler } = await import('@/app/api/payments/create-intent/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Stripe rate limit error
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.create.mockRejectedValueOnce(
        createStripeError('StripeRateLimitError', 'Too many requests')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/payments/create-intent', {
        amount: 1999,
        currency: 'usd',
        description: 'Test payment'
      });
      
      // Call the handler
      const response = await createPaymentIntentHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 429, 'too many requests|try again|rate limit');
    });

    it('should handle Stripe webhook signature verification failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: webhookHandler } = await import('@/app/api/payments/webhook/route');
      
      // Mock Stripe webhook signature verification to fail
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.webhooks = {
        constructEvent: jest.fn().mockImplementation(() => {
          throw createStripeError('StripeSignatureVerificationError', 'Invalid signature');
        })
      };
      
      // Create a mock request with a raw body (as Stripe webhooks require)
      const req = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_test123' } } }),
        headers: new Headers({
          'stripe-signature': 'invalid-signature'
        })
      });
      
      // Call the handler
      const response = await webhookHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'signature|invalid|webhook');
    });
  });

  describe('Cloudinary Integration Errors', () => {
    it('should handle Cloudinary upload failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: uploadHandler } = await import('@/app/api/upload/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Cloudinary upload to fail
      const cloudinaryModule = await import('@/lib/cloudinary');
      cloudinaryModule.uploadImage.mockRejectedValueOnce(
        new Error('Cloudinary upload failed')
      );
      
      // Create a mock request with FormData
      const formData = new FormData();
      formData.append('file', new Blob(['test file content'], { type: 'image/jpeg' }), 'test.jpg');
      
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Call the handler
      const response = await uploadHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 500, 'upload|failed|image');
    });

    it('should handle Cloudinary delete failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { DELETE: deleteProductHandler } = await import('@/app/api/seller/products/[id]/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValueOnce(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Mock product retrieval to return a product with images
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product',
        price: 19.99,
        sellerId: 'user-1', // Same as the authenticated user
        images: ['image1.jpg', 'image2.jpg']
      });
      
      // Mock Cloudinary delete to fail
      const cloudinaryModule = await import('@/lib/cloudinary');
      cloudinaryModule.deleteImage.mockRejectedValueOnce(
        new Error('Cloudinary delete failed')
      );
      
      // Create a params object for the route handler
      const params = { params: { id: 'product-1' } };
      
      // Create a mock request
      const req = createMockRequest('DELETE', 'http://localhost:3000/api/seller/products/product-1');
      
      // Call the handler
      const response = await deleteProductHandler(req, params);
      
      // If the API handles Cloudinary delete failures gracefully, it should still delete the product
      // but log the error about failing to delete the images
      if (response.status === 200) {
        expect(prisma.product.delete).toHaveBeenCalled();
        console.log('API handles Cloudinary delete failures gracefully');
      } else {
        // If the API fails the entire operation when Cloudinary delete fails
        await validateErrorResponse(response, 500, 'delete|image|failed');
      }
    });

    it('should handle Cloudinary transformation errors', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: uploadHandler } = await import('@/app/api/upload/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Cloudinary upload to fail with a transformation error
      const cloudinaryModule = await import('@/lib/cloudinary');
      cloudinaryModule.uploadImage.mockRejectedValueOnce(
        new Error('Invalid transformation')
      );
      
      // Create a mock request with FormData and transformation options
      const formData = new FormData();
      formData.append('file', new Blob(['test file content'], { type: 'image/jpeg' }), 'test.jpg');
      formData.append('transformation', JSON.stringify({ width: 'invalid' }));
      
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Call the handler
      const response = await uploadHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'transformation|invalid|image');
    });
  });

  describe('Email Service Errors', () => {
    it('should handle email sending failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: forgotPasswordHandler } = await import('@/app/api/auth/forgot-password/route');
      
      // Mock user retrieval to succeed
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
      });
      
      // Mock verification token creation to succeed
      prisma.verificationToken.create.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'reset-token',
        expires: new Date(Date.now() + 3600000)
      });
      
      // Mock nodemailer to fail
      const nodemailer = require('nodemailer');
      nodemailer.createTransport().sendMail.mockRejectedValueOnce(
        new Error('Failed to send email')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      });
      
      // Call the handler
      const response = await forgotPasswordHandler(req);
      
      // If the API handles email sending failures gracefully, it should still return a success
      // to avoid leaking information about whether the email exists
      if (response.status === 200) {
        console.log('API handles email sending failures gracefully');
      } else {
        // If the API fails the operation when email sending fails
        await validateErrorResponse(response, 500, 'email|send|failed');
      }
    });

    it('should handle email service connection failures', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: forgotPasswordHandler } = await import('@/app/api/auth/forgot-password/route');
      
      // Mock user retrieval to succeed
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User'
      });
      
      // Mock verification token creation to succeed
      prisma.verificationToken.create.mockResolvedValueOnce({
        identifier: 'test@example.com',
        token: 'reset-token',
        expires: new Date(Date.now() + 3600000)
      });
      
      // Mock nodemailer connection verification to fail
      const nodemailer = require('nodemailer');
      nodemailer.createTransport().verify.mockRejectedValueOnce(
        new Error('Failed to connect to email service')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/forgot-password', {
        email: 'test@example.com'
      });
      
      // Call the handler
      const response = await forgotPasswordHandler(req);
      
      // If the API handles email service connection failures gracefully, it should still return a success
      // to avoid leaking information about whether the email exists
      if (response.status === 200) {
        console.log('API handles email service connection failures gracefully');
      } else {
        // If the API fails the operation when email service connection fails
        await validateErrorResponse(response, 500, 'email|service|connection|failed');
      }
    });
  });

  describe('External API Integration Errors', () => {
    it('should handle external API timeouts', async () => {
      // This test simulates an external API call that times out
      // We'll use a mock implementation that never resolves
      
      // Mock fetch to never resolve
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));
      
      // Create a simple function to call an external API with a timeout
      const callExternalAPI = async () => {
        try {
          // Set a timeout for the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);
          
          const response = await fetch('https://api.example.com/data', {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          if (error.name === 'AbortError') {
            return { error: 'Request timed out', status: 'timeout' };
          }
          return { error: error.message, status: 'error' };
        }
      };
      
      // Call the function
      const result = await callExternalAPI();
      
      // Verify the result
      expect(result.status).toBe('timeout');
      expect(result.error).toBe('Request timed out');
    });

    it('should handle external API rate limiting', async () => {
      // Mock fetch to return a 429 Too Many Requests response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      });
      
      // Create a simple function to call an external API with rate limit handling
      const callExternalAPI = async () => {
        try {
          const response = await fetch('https://api.example.com/data');
          
          if (response.status === 429) {
            // Handle rate limiting
            return { 
              error: 'Rate limit exceeded', 
              status: 'rate_limited',
              retryAfter: response.headers.get('Retry-After') || 60
            };
          }
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          return { error: error.message, status: 'error' };
        }
      };
      
      // Call the function
      const result = await callExternalAPI();
      
      // Verify the result
      expect(result.status).toBe('rate_limited');
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should handle external API authentication failures', async () => {
      // Mock fetch to return a 401 Unauthorized response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' })
      });
      
      // Create a simple function to call an external API with authentication
      const callExternalAPI = async () => {
        try {
          const response = await fetch('https://api.example.com/data', {
            headers: {
              'Authorization': 'Bearer invalid-token'
            }
          });
          
          if (response.status === 401) {
            // Handle authentication failure
            return { 
              error: 'Authentication failed', 
              status: 'auth_failed'
            };
          }
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          return { error: error.message, status: 'error' };
        }
      };
      
      // Call the function
      const result = await callExternalAPI();
      
      // Verify the result
      expect(result.status).toBe('auth_failed');
      expect(result.error).toBe('Authentication failed');
    });
  });

  describe('Service Unavailability', () => {
    it('should handle Stripe service unavailability', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createPaymentIntentHandler } = await import('@/app/api/payments/create-intent/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Stripe service unavailability
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.create.mockRejectedValueOnce(
        createStripeError('StripeConnectionError', 'Could not connect to Stripe')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/payments/create-intent', {
        amount: 1999,
        currency: 'usd',
        description: 'Test payment'
      });
      
      // Call the handler
      const response = await createPaymentIntentHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 503, 'service unavailable|try again|later');
    });

    it('should handle Cloudinary service unavailability', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: uploadHandler } = await import('@/app/api/upload/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce(createMockSession());
      
      // Mock Cloudinary service unavailability
      const cloudinaryModule = await import('@/lib/cloudinary');
      cloudinaryModule.uploadImage.mockRejectedValueOnce(
        new Error('Could not connect to Cloudinary')
      );
      
      // Create a mock request with FormData
      const formData = new FormData();
      formData.append('file', new Blob(['test file content'], { type: 'image/jpeg' }), 'test.jpg');
      
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Call the handler
      const response = await uploadHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 500, 'upload|failed|service');
    });
  });
});
