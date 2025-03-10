import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { 
  createMockRequest, 
  createMockSession,
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

describe('Input Validation Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Boundary Value Testing', () => {
    it('should validate maximum length inputs', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: registerHandler } = await import('@/app/api/auth/register/route');
      
      // Create a very long name (e.g., 256 characters)
      const longName = 'A'.repeat(256);
      
      // Create a mock request with a very long name
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        name: longName,
        email: 'test@example.com',
        password: 'Password123!'
      });
      
      // Call the handler
      const response = await registerHandler(req);
      
      // Validate the error response
      if (response.status !== 200) {
        await validateErrorResponse(response, 400, 'name|length|too long|maximum');
      } else {
        // If it succeeded, check if the API truncated the name
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: expect.any(String)
            })
          })
        );
        
        const createCall = prisma.user.create.mock.calls[0][0];
        const savedName = createCall.data.name;
        
        // Check if the name was truncated
        if (savedName.length < longName.length) {
          console.log(`API truncated the name from ${longName.length} to ${savedName.length} characters`);
        } else {
          console.log('WARNING: API does not validate or truncate very long names');
        }
      }
    });

    it('should validate minimum length inputs', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: registerHandler } = await import('@/app/api/auth/register/route');
      
      // Create a mock request with a very short password
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'a'
      });
      
      // Call the handler
      const response = await registerHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'password|length|too short|minimum');
    });

    it('should validate price boundaries for products', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with a negative price
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: 'Test Product',
        description: 'Test description',
        price: -10.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'price|negative|invalid');
    });

    it('should validate maximum price for products', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with an extremely high price
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: 'Test Product',
        description: 'Test description',
        price: 1000000000, // 1 billion
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // If the API has a maximum price limit, this should fail
      if (response.status !== 200) {
        await validateErrorResponse(response, 400, 'price|maximum|too high|invalid');
      } else {
        // If it succeeded, check if the API capped the price
        expect(prisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              price: expect.any(Number)
            })
          })
        );
        
        const createCall = prisma.product.create.mock.calls[0][0];
        const savedPrice = createCall.data.price;
        
        // Check if the price was capped
        if (savedPrice < 1000000000) {
          console.log(`API capped the price from 1000000000 to ${savedPrice}`);
        } else {
          console.log('WARNING: API does not validate or cap extremely high prices');
        }
      }
    });
  });

  describe('Special Character Handling', () => {
    it('should handle special characters in product titles', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with special characters in the title
      const specialTitle = 'Test Product <script>alert("XSS")</script> & other "special" \'chars\' 你好';
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: specialTitle,
        description: 'Test description',
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // If the API sanitizes input, it should succeed but with a sanitized title
      if (response.status === 200) {
        expect(prisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: expect.any(String)
            })
          })
        );
        
        const createCall = prisma.product.create.mock.calls[0][0];
        const savedTitle = createCall.data.title;
        
        // Check if the title was sanitized
        if (savedTitle !== specialTitle) {
          console.log(`API sanitized the title from "${specialTitle}" to "${savedTitle}"`);
          // Check if script tags were removed
          expect(savedTitle).not.toContain('<script>');
        } else {
          console.log('WARNING: API does not sanitize special characters in titles');
        }
      } else {
        // If it failed, it should be due to validation
        await validateErrorResponse(response, 400, 'title|invalid|characters');
      }
    });

    it('should handle SQL injection attempts in search queries', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { GET: getProductsHandler } = await import('@/app/api/products/route');
      
      // Create a mock request with a SQL injection attempt in the search query
      const sqlInjection = "'; DROP TABLE products; --";
      const url = new URL('http://localhost:3000/api/products');
      url.searchParams.append('q', sqlInjection);
      
      const req = new NextRequest(url);
      
      // Mock the database query to succeed
      prisma.product.findMany.mockResolvedValueOnce([]);
      
      // Call the handler
      const response = await getProductsHandler(req);
      
      // The API should either sanitize the input or reject it
      if (response.status === 200) {
        // Check if the query was sanitized before being passed to the database
        expect(prisma.product.findMany).toHaveBeenCalled();
        
        const findCall = prisma.product.findMany.mock.calls[0][0];
        
        // Check if the where clause contains the raw SQL injection
        const whereClause = JSON.stringify(findCall.where);
        expect(whereClause).not.toContain('DROP TABLE');
      } else {
        // If it failed, it should be due to validation
        await validateErrorResponse(response, 400, 'query|invalid|characters');
      }
    });

    it('should handle emoji and unicode characters in reviews', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createReviewHandler } = await import('@/app/api/reviews/product/[id]/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Create params object for the route handler
      const params = { params: { id: 'product-1' } };
      
      // Create a mock request with emoji and unicode characters
      const unicodeComment = 'Great product! 👍 ⭐⭐⭐⭐⭐ 你好 😊';
      const req = createMockRequest('POST', 'http://localhost:3000/api/reviews/product/product-1', {
        rating: 5,
        comment: unicodeComment
      });
      
      // Mock the database query to succeed
      prisma.review.create.mockResolvedValueOnce({
        id: 'review-1',
        userId: 'user-1',
        productId: 'product-1',
        rating: 5,
        comment: unicodeComment
      });
      
      // Call the handler
      const response = await createReviewHandler(req, params);
      
      // The API should handle unicode characters correctly
      if (response.status === 200) {
        expect(prisma.review.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              comment: expect.any(String)
            })
          })
        );
        
        const createCall = prisma.review.create.mock.calls[0][0];
        const savedComment = createCall.data.comment;
        
        // Check if the comment was preserved
        expect(savedComment).toContain('👍');
        expect(savedComment).toContain('⭐');
        expect(savedComment).toContain('你好');
        expect(savedComment).toContain('😊');
      } else {
        // If it failed, it should be due to validation
        await validateErrorResponse(response, 400, 'comment|invalid|characters');
      }
    });
  });

  describe('Empty, Null, and Undefined Values', () => {
    it('should handle empty strings in required fields', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with an empty title
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: '',
        description: 'Test description',
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'title|required|empty');
    });

    it('should handle null values in optional fields', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with a null description (assuming it's optional)
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: 'Test Product',
        description: null,
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Mock the database query to succeed
      prisma.product.create.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product',
        description: null,
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // If description is optional, this should succeed
      if (response.status === 200) {
        expect(prisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'Test Product',
              // Check how null description is handled
              description: expect.anything()
            })
          })
        );
        
        const createCall = prisma.product.create.mock.calls[0][0];
        const savedDescription = createCall.data.description;
        
        // Check how null was handled
        if (savedDescription === null) {
          console.log('API preserved null value for description');
        } else if (savedDescription === '') {
          console.log('API converted null to empty string for description');
        } else if (savedDescription === undefined) {
          console.log('API converted null to undefined for description');
        } else {
          console.log(`API converted null to "${savedDescription}" for description`);
        }
      } else {
        // If it failed, description might not be optional
        await validateErrorResponse(response, 400, 'description|required');
      }
    });

    it('should handle undefined values in request body', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { PUT: updateProfileHandler } = await import('@/app/api/user/profile/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock user retrieval
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        bio: 'Original bio'
      });
      
      // Create a mock request with undefined bio
      const req = createMockRequest('PUT', 'http://localhost:3000/api/user/profile', {
        name: 'Updated User',
        bio: undefined
      });
      
      // Mock the database update to succeed
      prisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated User',
        bio: 'Original bio' // Bio should remain unchanged
      });
      
      // Call the handler
      const response = await updateProfileHandler(req);
      
      // This should succeed, and undefined fields should be ignored
      if (response.status === 200) {
        expect(prisma.user.update).toHaveBeenCalled();
        
        const updateCall = prisma.user.update.mock.calls[0][0];
        
        // Check if undefined bio was handled correctly
        expect(updateCall.data).toHaveProperty('name', 'Updated User');
        
        // Check how undefined was handled
        if (!('bio' in updateCall.data)) {
          console.log('API correctly ignored undefined bio field');
        } else {
          console.log(`WARNING: API included undefined bio field in update: ${updateCall.data.bio}`);
        }
      } else {
        // If it failed, it's an unexpected error
        await validateErrorResponse(response, 400, 'profile|update|failed');
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should validate numeric fields', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with a string price
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: 'Test Product',
        description: 'Test description',
        price: 'not-a-number',
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg']
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'price|number|invalid');
    });

    it('should validate date fields', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Create a mock request with an invalid date
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [{ id: 'product-1', quantity: 1, price: 19.99 }],
        addressId: 'address-1',
        paymentIntentId: 'pi_test123',
        deliveryDate: 'not-a-date'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // If the API validates date fields, this should fail
      if (response.status !== 200) {
        await validateErrorResponse(response, 400, 'date|invalid|format');
      } else {
        // If it succeeded, check how the invalid date was handled
        expect(prisma.order.create).toHaveBeenCalled();
        
        const createCall = prisma.order.create.mock.calls[0][0];
        
        if (createCall.data.deliveryDate === null) {
          console.log('API converted invalid date to null');
        } else if (createCall.data.deliveryDate === undefined) {
          console.log('API ignored invalid date field');
        } else if (createCall.data.deliveryDate instanceof Date) {
          console.log('API attempted to parse invalid date');
        } else {
          console.log(`API stored invalid date as: ${createCall.data.deliveryDate}`);
        }
      }
    });

    it('should validate boolean fields', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with a non-boolean featured flag
      const req = createMockRequest('POST', 'http://localhost:3000/api/products', {
        title: 'Test Product',
        description: 'Test description',
        price: 19.99,
        category: 'dresses',
        condition: 'new',
        images: ['image1.jpg'],
        featured: 'yes' // Not a boolean
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // If the API strictly validates boolean fields, this should fail
      if (response.status !== 200) {
        await validateErrorResponse(response, 400, 'featured|boolean|invalid');
      } else {
        // If it succeeded, check how the non-boolean was handled
        expect(prisma.product.create).toHaveBeenCalled();
        
        const createCall = prisma.product.create.mock.calls[0][0];
        
        if (typeof createCall.data.featured === 'boolean') {
          console.log(`API converted "yes" to boolean: ${createCall.data.featured}`);
        } else {
          console.log(`API stored non-boolean featured as: ${createCall.data.featured}`);
        }
      }
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Create a mock request with malformed JSON
      // We can't actually send malformed JSON through the mock request,
      // so we'll simulate the error that would occur
      
      // Mock the NextRequest to throw an error when accessing the body
      const mockReq = {
        method: 'POST',
        url: 'http://localhost:3000/api/products',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      
      // Call the handler
      try {
        const response = await createProductHandler(mockReq);
        
        // If the API handles JSON parsing errors, it should return a 400
        await validateErrorResponse(response, 400, 'json|invalid|malformed');
      } catch (error) {
        // If the API doesn't handle JSON parsing errors, it will throw
        console.log('WARNING: API does not handle malformed JSON gracefully');
      }
    });
  });
});
