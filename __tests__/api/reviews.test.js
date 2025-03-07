import { NextRequest, NextResponse } from 'next/server';
import { GET as getProductReviewsHandler, POST as createProductReviewHandler } from '@/app/api/reviews/product/[id]/route';
import { GET as getProductReviewHandler, PUT as updateProductReviewHandler, DELETE as deleteProductReviewHandler } from '@/app/api/reviews/product/[id]/[reviewId]/route';
import { GET as getSellerReviewsHandler, POST as createSellerReviewHandler } from '@/app/api/reviews/seller/[id]/route';
import { GET as getSellerReviewHandler, PUT as updateSellerReviewHandler, DELETE as deleteSellerReviewHandler } from '@/app/api/reviews/seller/[id]/[reviewId]/route';
import { GET as getUserReviewsHandler } from '@/app/api/reviews/user/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock Next.js request/response
const mockRequestResponse = (method, url, body = null) => {
  const req = new NextRequest(url, {
    method,
    ...(body && { body: JSON.stringify(body) })
  });
  
  return { req };
};

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Review API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/reviews/product/[id]', () => {
    it('should return product reviews', async () => {
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product'
      });
      
      // Mock reviews data
      const mockReviews = [
        {
          id: 'review-1',
          productId: 'product-1',
          reviewerId: 'user-1',
          reviewerName: 'User 1',
          rating: 5,
          comment: 'Great product!',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'review-2',
          productId: 'product-1',
          reviewerId: 'user-2',
          reviewerName: 'User 2',
          rating: 4,
          comment: 'Good product',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Mock Prisma response
      prisma.review.findMany.mockResolvedValueOnce(mockReviews);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/product/product-1');
      
      // Call the handler with params
      const response = await getProductReviewsHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(2);
      expect(responseData[0].id).toBe('review-1');
      expect(responseData[1].id).toBe('review-2');
      
      // Verify Prisma was called correctly
      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' }
        })
      );
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'product-1' },
          orderBy: { createdAt: 'desc' }
        })
      );
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock Prisma response for non-existent product
      prisma.product.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/product/non-existent');
      
      // Call the handler with params
      const response = await getProductReviewsHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Product not found');
      
      // Verify review findMany was not called
      expect(prisma.review.findMany).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/reviews/product/[id]', () => {
    it('should create a product review when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product'
      });
      
      // Mock no existing review
      prisma.review.findFirst.mockResolvedValueOnce(null);
      
      // Mock review creation
      const mockCreatedReview = {
        id: 'new-review',
        productId: 'product-1',
        reviewerId: 'user-1',
        reviewerName: 'Test User',
        rating: 5,
        comment: 'Great product!',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      prisma.review.create.mockResolvedValueOnce(mockCreatedReview);
      
      // Create request with review data
      const reviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/reviews/product/product-1', reviewData);
      
      // Call the handler with params
      const response = await createProductReviewHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(responseData.id).toBe('new-review');
      expect(responseData.rating).toBe(5);
      expect(responseData.comment).toBe('Great product!');
      
      // Verify Prisma was called correctly
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rating: 5,
            comment: 'Great product!',
            productId: 'product-1',
            reviewerId: 'user-1',
            reviewerName: 'Test User'
          })
        })
      );
    });
    
    it('should reject review creation when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with review data
      const reviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/reviews/product/product-1', reviewData);
      
      // Call the handler with params
      const response = await createProductReviewHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('must be logged in');
      
      // Verify Prisma create was not called
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
    
    it('should reject review creation for non-existent product', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock Prisma response for non-existent product
      prisma.product.findUnique.mockResolvedValueOnce(null);
      
      // Create request with review data
      const reviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/reviews/product/non-existent', reviewData);
      
      // Call the handler with params
      const response = await createProductReviewHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Product not found');
      
      // Verify Prisma create was not called
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
    
    it('should reject review creation if user already reviewed the product', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product'
      });
      
      // Mock existing review
      prisma.review.findFirst.mockResolvedValueOnce({
        id: 'existing-review',
        productId: 'product-1',
        reviewerId: 'user-1'
      });
      
      // Create request with review data
      const reviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/reviews/product/product-1', reviewData);
      
      // Call the handler with params
      const response = await createProductReviewHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('already reviewed');
      
      // Verify Prisma create was not called
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
    
    it('should validate review data', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Test Product'
      });
      
      // Create request with invalid review data (rating out of range)
      const invalidReviewData = {
        rating: 6, // Maximum is 5
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/reviews/product/product-1', invalidReviewData);
      
      // Call the handler with params
      const response = await createProductReviewHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Invalid review data');
      
      // Verify Prisma create was not called
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/reviews/product/[id]/[reviewId]', () => {
    it('should return a specific product review', async () => {
      // Mock review data
      const mockReview = {
        id: 'review-1',
        productId: 'product-1',
        reviewerId: 'user-1',
        reviewerName: 'User 1',
        rating: 5,
        comment: 'Great product!',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock Prisma response
      prisma.review.findUnique.mockResolvedValueOnce(mockReview);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/product/product-1/review-1');
      
      // Call the handler with params
      const response = await getProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.id).toBe('review-1');
      expect(responseData.rating).toBe(5);
      expect(responseData.comment).toBe('Great product!');
      
      // Verify Prisma was called correctly
      expect(prisma.review.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            id: 'review-1',
            productId: 'product-1'
          }
        })
      );
    });
    
    it('should return 404 for non-existent review', async () => {
      // Mock Prisma response for non-existent review
      prisma.review.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/product/product-1/non-existent');
      
      // Call the handler with params
      const response = await getProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Review not found');
    });
  });
  
  describe('PUT /api/reviews/product/[id]/[reviewId]', () => {
    it('should update a review when authenticated as the reviewer', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock existing review
      const mockExistingReview = {
        id: 'review-1',
        productId: 'product-1',
        reviewerId: 'user-1', // Same as authenticated user
        reviewerName: 'Test User',
        rating: 4,
        comment: 'Good product',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock updated review
      const mockUpdatedReview = {
        ...mockExistingReview,
        rating: 5,
        comment: 'Great product!',
        updatedAt: new Date()
      };
      
      // Mock Prisma responses
      prisma.review.findUnique.mockResolvedValueOnce(mockExistingReview);
      prisma.review.update.mockResolvedValueOnce(mockUpdatedReview);
      
      // Create request with updated review data
      const updatedReviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/reviews/product/product-1/review-1', updatedReviewData);
      
      // Call the handler with params
      const response = await updateProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.id).toBe('review-1');
      expect(responseData.rating).toBe(5);
      expect(responseData.comment).toBe('Great product!');
      
      // Verify Prisma was called correctly
      expect(prisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' },
          data: expect.objectContaining({
            rating: 5,
            comment: 'Great product!'
          })
        })
      );
    });
    
    it('should reject update when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with updated review data
      const updatedReviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/reviews/product/product-1/review-1', updatedReviewData);
      
      // Call the handler with params
      const response = await updateProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma update was not called
      expect(prisma.review.update).not.toHaveBeenCalled();
    });
    
    it('should reject update when not the reviewer', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock existing review with different reviewer
      const mockExistingReview = {
        id: 'review-1',
        productId: 'product-1',
        reviewerId: 'user-2', // Different from authenticated user
        reviewerName: 'Another User',
        rating: 4,
        comment: 'Good product',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock Prisma response
      prisma.review.findUnique.mockResolvedValueOnce(mockExistingReview);
      
      // Create request with updated review data
      const updatedReviewData = {
        rating: 5,
        comment: 'Great product!'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/reviews/product/product-1/review-1', updatedReviewData);
      
      // Call the handler with params
      const response = await updateProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(responseData.error).toContain('Forbidden');
      
      // Verify Prisma update was not called
      expect(prisma.review.update).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/reviews/product/[id]/[reviewId]', () => {
    it('should delete a review when authenticated as the reviewer', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock existing review
      const mockExistingReview = {
        id: 'review-1',
        productId: 'product-1',
        reviewerId: 'user-1', // Same as authenticated user
        reviewerName: 'Test User',
        rating: 4,
        comment: 'Good product',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock Prisma responses
      prisma.review.findUnique.mockResolvedValueOnce(mockExistingReview);
      prisma.review.delete.mockResolvedValueOnce(mockExistingReview);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/reviews/product/product-1/review-1');
      
      // Call the handler with params
      const response = await deleteProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('deleted successfully');
      
      // Verify Prisma was called correctly
      expect(prisma.review.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' }
        })
      );
    });
    
    it('should reject deletion when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/reviews/product/product-1/review-1');
      
      // Call the handler with params
      const response = await deleteProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma delete was not called
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });
    
    it('should reject deletion when not the reviewer', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock existing review with different reviewer
      const mockExistingReview = {
        id: 'review-1',
        productId: 'product-1',
        reviewerId: 'user-2', // Different from authenticated user
        reviewerName: 'Another User',
        rating: 4,
        comment: 'Good product',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock Prisma response
      prisma.review.findUnique.mockResolvedValueOnce(mockExistingReview);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/reviews/product/product-1/review-1');
      
      // Call the handler with params
      const response = await deleteProductReviewHandler(req, { params: { id: 'product-1', reviewId: 'review-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(responseData.error).toContain('Forbidden');
      
      // Verify Prisma delete was not called
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/reviews/user', () => {
    it('should return user reviews when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock reviews data
      const mockReviews = [
        {
          id: 'review-1',
          productId: 'product-1',
          reviewerId: 'user-1',
          reviewerName: 'Test User',
          rating: 5,
          comment: 'Great product!',
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 'product-1',
            title: 'Product 1',
            images: ['image1.jpg']
          }
        },
        {
          id: 'review-2',
          sellerId: 'seller-1',
          reviewerId: 'user-1',
          reviewerName: 'Test User',
          rating: 4,
          comment: 'Good seller',
          createdAt: new Date(),
          updatedAt: new Date(),
          seller: {
            id: 'seller-1',
            name: 'Seller 1',
            shopName: 'Shop 1'
          }
        }
      ];
      
      // Mock Prisma response
      prisma.review.findMany.mockResolvedValueOnce(mockReviews);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/user');
      
      // Call the handler
      const response = await getUserReviewsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(2);
      expect(responseData[0].id).toBe('review-1');
      expect(responseData[1].id).toBe('review-2');
      
      // Verify Prisma was called correctly
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { reviewerId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          include: expect.objectContaining({
            product: expect.any(Object),
            seller: expect.any(Object)
          })
        })
      );
    });
    
    it('should reject review retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/user');
      
      // Call the handler
      const response = await getUserReviewsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma findMany was not called
      expect(prisma.review.findMany).not.toHaveBeenCalled();
    });
  });
  
  // Similar tests for seller reviews endpoints
  describe('GET /api/reviews/seller/[id]', () => {
    it('should return seller reviews', async () => {
      // Mock seller data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'seller-1',
        name: 'Test Seller',
        isSeller: true,
        sellerApproved: true
      });
      
      // Mock reviews data
      const mockReviews = [
        {
          id: 'review-1',
          sellerId: 'seller-1',
          reviewerId: 'user-1',
          reviewerName: 'User 1',
          rating: 5,
          comment: 'Great seller!',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'review-2',
          sellerId: 'seller-1',
          reviewerId: 'user-2',
          reviewerName: 'User 2',
          rating: 4,
          comment: 'Good seller',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Mock Prisma response
      prisma.review.findMany.mockResolvedValueOnce(mockReviews);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/seller/seller-1');
      
      // Call the handler with params
      const response = await getSellerReviewsHandler(req, { params: { id: 'seller-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toHaveLength(2);
      expect(responseData[0].id).toBe('review-1');
      expect(responseData[1].id).toBe('review-2');
      
      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            id: 'seller-1',
            isSeller: true
          }
        })
      );
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerId: 'seller-1' },
          orderBy: { createdAt: 'desc' }
        })
      );
    });
    
    it('should return 404 for non-existent seller', async () => {
      // Mock Prisma response for non-existent seller
      prisma.user.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/reviews/seller/non-existent');
      
      // Call the handler with params
      const response = await getSellerReviewsHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Seller not found');
      
      // Verify review findMany was not called
      expect(prisma.review.findMany).not.toHaveBeenCalled();
    });
  });
});
