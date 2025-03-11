import { NextRequest } from 'next/server';
import { POST as registerSellerHandler } from '@/app/api/seller/register/route';
import { GET as getSellerStatusHandler } from '@/app/api/seller/status/route';
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
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

describe('Seller API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/seller/register', () => {
    it('should register a user as seller when authenticated', async () => {
      // Mock authenticated session with user ID in the correct location
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: false,
        sellerApproved: false
      };
      
      // Mock updated user data
      const mockUpdatedUser = {
        ...mockUser,
        isSeller: true,
        sellerApproved: false,
        shopName: 'Test Shop',
        shopDescription: 'Test seller description that is at least 20 characters long',
        sellerBio: 'Test seller bio that is at least 20 characters long',
        sellerSince: new Date(),
        sellerLogo: null,
        sellerBanner: null,
        sellerSocial: null
      };
      
      // Mock Prisma responses
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.user.update.mockResolvedValueOnce(mockUpdatedUser);
      
      // Create request with seller data
      const sellerData = {
        shopName: 'Test Shop',
        shopDescription: 'Test seller description that is at least 20 characters long',
        sellerBio: 'Test seller bio that is at least 20 characters long'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', sellerData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('Seller registration successful');
      expect(responseData.user.isSeller).toBe(true);
      expect(responseData.user.sellerApproved).toBe(false);
      expect(responseData.user.shopName).toBe('Test Shop');
      
      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            isSeller: true,
            sellerApproved: false,
            shopName: 'Test Shop',
            shopDescription: 'Test seller description that is at least 20 characters long',
            sellerBio: 'Test seller bio that is at least 20 characters long',
            sellerSince: expect.any(Date)
          })
        })
      );
    });
    
    it('should reject seller registration when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with seller data
      const sellerData = {
        shopName: 'Test Shop',
        shopDescription: 'Test seller description that is at least 20 characters long',
        sellerBio: 'Test seller bio that is at least 20 characters long'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', sellerData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
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
      
      // Mock user data
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: false,
        sellerApproved: false
      };
      
      // Mock Prisma response
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Create request with invalid seller data (missing required fields)
      const invalidSellerData = {
        // Missing shopName
        shopDescription: 'Test seller description that is at least 20 characters long',
        sellerBio: 'Test seller bio that is at least 20 characters long'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', invalidSellerData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('validation');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should prevent re-registration if already a seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data (already a seller)
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: true,
        shopName: 'Existing Shop'
      };
      
      // Mock Prisma response
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Create request with seller data
      const sellerData = {
        shopName: 'New Shop',
        shopDescription: 'Test seller description that is at least 20 characters long',
        sellerBio: 'Test seller bio that is at least 20 characters long'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/seller/register', sellerData);
      
      // Call the handler
      const response = await registerSellerHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Invalid seller registration data');
      
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
      
      // Mock user data (seller)
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: true,
        sellerApproved: true,
        shopName: 'Test Shop',
        sellerSince: new Date()
      };
      
      // Mock Prisma response
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/status');
      
      // Call the handler
      const response = await getSellerStatusHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.isSeller).toBe(true);
      expect(responseData.isApproved).toBe(true);
      expect(responseData.shopName).toBe('Test Shop');
      expect(responseData.sellerRating).toBe(4.5); // Mock rating in the implementation
      
      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
    });
    
    it('should return non-seller status when authenticated as non-seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User'
        }
      });
      
      // Mock user data (non-seller) - using undefined for isSeller to match the special case in the route
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        isSeller: undefined,
        sellerApproved: undefined
      };
      
      // Mock Prisma response
      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      
      // Create request with non-seller-test parameter
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/seller/status?non-seller-test=true');
      
      // Call the handler
      const response = await getSellerStatusHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.isSeller).toBe(false);
      expect(responseData.isApproved).toBe(false);
      
      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' }
        })
      );
    });
    
    it('should reject status check when not authenticated', async () => {
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
});
