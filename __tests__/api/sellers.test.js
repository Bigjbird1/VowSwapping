import { NextRequest, NextResponse } from 'next/server';
import { POST as registerSellerHandler } from '@/app/api/seller/register/route';
import { GET as getSellerStatusHandler } from '@/app/api/seller/status/route';
import { GET as getSellerStatsHandler } from '@/app/api/seller/stats/route';
import { GET as getSellersHandler } from '@/app/api/sellers/route';
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
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Seller API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/seller/register', () => {
    it('should register a user as seller when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user update
      prisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: false,
        shopName: 'Test Shop',
        shopDescription: 'This is a test shop with enough characters to pass validation',
        sellerBio: 'I am a test seller with enough characters to pass the validation requirements',
        sellerSince: new Date()
      });
      
      // Create request with seller registration data
      const registrationData = {
        shopName: 'Test Shop',
        shopDescription: 'This is a test shop with enough characters to pass validation',
        sellerBio: 'I am a test seller with enough characters to pass the validation requirements',
        sellerLogo: 'logo.jpg',
        sellerBanner: 'banner.jpg',
        sellerSocial: {
          website: 'https://example.com',
          instagram: 'testshop',
          facebook: 'testshop',
          twitter: 'testshop'
        }
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', registrationData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('Seller registration successful');
      expect(responseData.success).toBe(true);
      
      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            isSeller: true,
            sellerApproved: false,
            shopName: 'Test Shop',
            shopDescription: 'This is a test shop with enough characters to pass validation',
            sellerBio: 'I am a test seller with enough characters to pass the validation requirements',
            sellerLogo: 'logo.jpg',
            sellerBanner: 'banner.jpg',
            sellerSocial: expect.any(String), // JSON string
            sellerSince: expect.any(Date)
          })
        })
      );
    });
    
    it('should reject seller registration when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with seller registration data
      const registrationData = {
        shopName: 'Test Shop',
        shopDescription: 'This is a test shop with enough characters to pass validation',
        sellerBio: 'I am a test seller with enough characters to pass the validation requirements'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', registrationData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should validate seller registration data', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Create request with invalid registration data (shop description too short)
      const invalidRegistrationData = {
        shopName: 'Test Shop',
        shopDescription: 'Too short', // Minimum is 20 characters
        sellerBio: 'I am a test seller with enough characters to pass the validation requirements'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', invalidRegistrationData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.message).toContain('at least 20 characters');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should reject registration if user is already a seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock existing seller
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: false
      });
      
      // Create request with seller registration data
      const registrationData = {
        shopName: 'Test Shop',
        shopDescription: 'This is a test shop with enough characters to pass validation',
        sellerBio: 'I am a test seller with enough characters to pass the validation requirements'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', registrationData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.message).toContain('already pending approval');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/seller/status', () => {
    it('should return seller status when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: true,
        shopName: 'Test Shop',
        sellerSince: new Date('2025-01-01')
      });
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/status');
      
      // Call the handler
      const response = await getSellerStatusHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.isSeller).toBe(true);
      expect(responseData.sellerApproved).toBe(true);
      expect(responseData.shopName).toBe('Test Shop');
      
      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
    });
    
    it('should reject status retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/status');
      
      // Call the handler
      const response = await getSellerStatusHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma findUnique was not called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/seller/stats', () => {
    it('should return seller stats when authenticated as seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data (approved seller)
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: true,
        shopName: 'Test Shop'
      });
      
      // Mock product count
      prisma.product.count.mockResolvedValueOnce(10);
      
      // Mock orderItem data for sales calculation
      prisma.orderItem.findMany.mockResolvedValueOnce([
        {
          id: 'orderItem-1',
          orderId: 'order-1',
          productId: 'product-1',
          quantity: 1,
          price: 99.99,
          order: {
            id: 'order-1',
            total: 99.99,
            status: 'COMPLETED',
            createdAt: new Date()
          },
          product: {
            id: 'product-1',
            title: 'Product 1',
            price: 99.99
          }
        },
        {
          id: 'orderItem-2',
          orderId: 'order-2',
          productId: 'product-2',
          quantity: 2,
          price: 149.99,
          order: {
            id: 'order-2',
            total: 299.98,
            status: 'COMPLETED',
            createdAt: new Date()
          },
          product: {
            id: 'product-2',
            title: 'Product 2',
            price: 149.99
          }
        }
      ]);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/stats');
      
      // Call the handler
      const response = await getSellerStatsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.totalProducts).toBe(10);
      expect(responseData.totalOrders).toBe(2);
      expect(responseData.totalSales).toBe(399.97);
      
      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
      expect(prisma.product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sellerId: 'user-1' }
        })
      );
      expect(prisma.orderItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            product: {
              sellerId: 'user-1'
            }
          },
          include: {
            order: true,
            product: true
          }
        })
      );
    });
    
    it('should reject stats retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/stats');
      
      // Call the handler
      const response = await getSellerStatsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma findUnique was not called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
    
    it('should reject stats retrieval when not a seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data (not a seller)
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: false
      });
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/stats');
      
      // Call the handler
      const response = await getSellerStatsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(responseData.error).toContain('not a seller');
      
      // Verify product count was not called
      expect(prisma.product.count).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/sellers', () => {
    it('should return list of approved sellers', async () => {
      // Mock sellers data
      const mockSellers = [
        {
          id: 'seller-1',
          name: 'Seller 1',
          shopName: 'Shop 1',
          shopDescription: 'Description for Shop 1',
          sellerBio: 'Bio for Seller 1',
          sellerLogo: 'logo1.jpg',
          sellerBanner: 'banner1.jpg',
          sellerRating: 4.5,
          sellerRatingsCount: 10,
          sellerSince: new Date('2025-01-01'),
          _count: {
            products: 5
          }
        },
        {
          id: 'seller-2',
          name: 'Seller 2',
          shopName: 'Shop 2',
          shopDescription: 'Description for Shop 2',
          sellerBio: 'Bio for Seller 2',
          sellerLogo: 'logo2.jpg',
          sellerBanner: 'banner2.jpg',
          sellerRating: 4.8,
          sellerRatingsCount: 15,
          sellerSince: new Date('2025-01-15'),
          _count: {
            products: 10
          }
        }
      ];
      
      // Mock Prisma response
      prisma.user.findMany.mockResolvedValueOnce(mockSellers);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/sellers');
      
      // Call the handler
      const response = await getSellersHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.sellers).toHaveLength(2);
      expect(responseData.sellers[0].id).toBe('seller-1');
      expect(responseData.sellers[1].id).toBe('seller-2');
      
      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isSeller: true,
            sellerApproved: true
          },
          select: expect.objectContaining({
            id: true,
            name: true,
            shopName: true,
            shopDescription: true,
            sellerBio: true,
            sellerLogo: true,
            sellerBanner: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true
          })
        })
      );
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      prisma.user.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/sellers');
      
      // Call the handler
      const response = await getSellersHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.error).toContain('Failed to fetch sellers');
    });
  });
});
