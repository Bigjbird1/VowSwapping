import { NextRequest, NextResponse } from 'next/server';
import { GET as getWishlistHandler, POST as addToWishlistHandler } from '@/app/api/user/wishlist/route';
import { GET as checkWishlistHandler, DELETE as removeFromWishlistHandler } from '@/app/api/user/wishlist/[productId]/route';
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
    },
    product: {
      findUnique: jest.fn(),
    },
    wishlist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Wishlist API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/user/wishlist', () => {
    it('should return user wishlist when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock wishlist data
      const mockWishlistItems = [
        {
          id: 'wishlist-1',
          userId: 'user-1',
          productId: 'product-1',
          createdAt: new Date(),
          product: {
            id: 'product-1',
            title: 'Product 1',
            description: 'Description 1',
            price: 99.99,
            images: ['image1.jpg'],
            category: 'DRESSES',
            condition: 'NEW',
            sellerId: 'seller-1',
            seller: {
              id: 'seller-1',
              name: 'Seller 1',
              shopName: 'Shop 1'
            }
          }
        },
        {
          id: 'wishlist-2',
          userId: 'user-1',
          productId: 'product-2',
          createdAt: new Date(),
          product: {
            id: 'product-2',
            title: 'Product 2',
            description: 'Description 2',
            price: 149.99,
            images: ['image2.jpg'],
            category: 'ACCESSORIES',
            condition: 'LIKE_NEW',
            sellerId: 'seller-1',
            seller: {
              id: 'seller-1',
              name: 'Seller 1',
              shopName: 'Shop 1'
            }
          }
        }
      ];
      
      // Mock Prisma response
      prisma.wishlist.findMany.mockResolvedValueOnce(mockWishlistItems);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/wishlist');
      
      // Call the handler
      const response = await getWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.wishlistItems).toHaveLength(2);
      expect(responseData.wishlistItems[0].product.id).toBe('product-1');
      expect(responseData.wishlistItems[1].product.id).toBe('product-2');
      
      // Verify Prisma was called correctly
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          include: {
            product: {
              include: {
                seller: {
                  select: expect.any(Object)
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      );
    });
    
    it('should reject wishlist retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/wishlist');
      
      // Call the handler
      const response = await getWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('must be logged in');
      
      // Verify Prisma findMany was not called
      expect(prisma.wishlist.findMany).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/user/wishlist', () => {
    it('should add product to wishlist when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Product 1'
      });
      
      // Mock no existing wishlist item
      prisma.wishlist.findFirst.mockResolvedValueOnce(null);
      
      // Mock wishlist item creation
      const mockCreatedWishlistItem = {
        id: 'new-wishlist-item',
        userId: 'user-1',
        productId: 'product-1',
        createdAt: new Date()
      };
      
      prisma.wishlist.create.mockResolvedValueOnce(mockCreatedWishlistItem);
      
      // Create request with product ID
      const wishlistData = {
        productId: 'product-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/wishlist', wishlistData);
      
      // Call the handler
      const response = await addToWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(responseData.message).toContain('added to wishlist');
      
      // Verify Prisma was called correctly
      expect(prisma.wishlist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 'user-1',
            productId: 'product-1'
          }
        })
      );
    });
    
    it('should reject adding to wishlist when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with product ID
      const wishlistData = {
        productId: 'product-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/wishlist', wishlistData);
      
      // Call the handler
      const response = await addToWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('must be logged in');
      
      // Verify Prisma create was not called
      expect(prisma.wishlist.create).not.toHaveBeenCalled();
    });
    
    it('should reject adding non-existent product to wishlist', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock product not found
      prisma.product.findUnique.mockResolvedValueOnce(null);
      
      // Create request with product ID
      const wishlistData = {
        productId: 'non-existent'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/wishlist', wishlistData);
      
      // Call the handler
      const response = await addToWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Product not found');
      
      // Verify Prisma create was not called
      expect(prisma.wishlist.create).not.toHaveBeenCalled();
    });
    
    it('should not add product to wishlist if already in wishlist', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock product data
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'product-1',
        title: 'Product 1'
      });
      
      // Mock existing wishlist item
      prisma.wishlist.findFirst.mockResolvedValueOnce({
        id: 'existing-wishlist-item',
        userId: 'user-1',
        productId: 'product-1'
      });
      
      // Create request with product ID
      const wishlistData = {
        productId: 'product-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/wishlist', wishlistData);
      
      // Call the handler
      const response = await addToWishlistHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('already in wishlist');
      
      // Verify Prisma create was not called
      expect(prisma.wishlist.create).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/user/wishlist/[productId]', () => {
    it('should check if product is in wishlist when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock existing wishlist item
      prisma.wishlist.findFirst.mockResolvedValueOnce({
        id: 'wishlist-1',
        userId: 'user-1',
        productId: 'product-1'
      });
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await checkWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.inWishlist).toBe(true);
      
      // Verify Prisma was called correctly
      expect(prisma.wishlist.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            productId: 'product-1'
          }
        })
      );
    });
    
    it('should return false if product is not in wishlist', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock no existing wishlist item
      prisma.wishlist.findFirst.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await checkWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.inWishlist).toBe(false);
    });
    
    it('should reject wishlist check when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await checkWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma findFirst was not called
      expect(prisma.wishlist.findFirst).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/user/wishlist/[productId]', () => {
    it('should remove product from wishlist when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock existing wishlist item
      const mockWishlistItem = {
        id: 'wishlist-1',
        userId: 'user-1',
        productId: 'product-1'
      };
      
      prisma.wishlist.findFirst.mockResolvedValueOnce(mockWishlistItem);
      prisma.wishlist.delete.mockResolvedValueOnce(mockWishlistItem);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await removeFromWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('removed from wishlist');
      
      // Verify Prisma was called correctly
      expect(prisma.wishlist.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wishlist-1' }
        })
      );
    });
    
    it('should reject wishlist removal when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await removeFromWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma delete was not called
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });
    
    it('should handle case when product is not in wishlist', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock no existing wishlist item
      prisma.wishlist.findFirst.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/wishlist/product-1');
      
      // Call the handler with params
      const response = await removeFromWishlistHandler(req, { params: { productId: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('not found in wishlist');
      
      // Verify Prisma delete was not called
      expect(prisma.wishlist.delete).not.toHaveBeenCalled();
    });
  });
});
