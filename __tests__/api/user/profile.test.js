import { NextRequest } from 'next/server';
import { PUT as updateProfileHandler } from '@/app/api/user/profile/route';
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

describe('User Profile API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('PUT /api/user/profile', () => {
    it('should update user profile when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Original Name'
        }
      });
      
      // Mock user update
      prisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Updated Name'
      });
      
      // Create request with profile data
      const profileData = {
        name: 'Updated Name'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/profile', profileData);
      
      // Call the handler
      const response = await updateProfileHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('Profile updated successfully');
      expect(responseData.user.name).toBe('Updated Name');
      
      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { name: 'Updated Name' }
        })
      );
    });
    
    it('should reject profile update when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with profile data
      const profileData = {
        name: 'Updated Name'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/profile', profileData);
      
      // Call the handler
      const response = await updateProfileHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should validate profile data', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Original Name'
        }
      });
      
      // Create request with invalid profile data (name too short)
      const invalidProfileData = {
        name: 'A' // Too short, minimum is 2 characters
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/profile', invalidProfileData);
      
      // Call the handler
      const response = await updateProfileHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.message).toContain('at least 2 characters');
      
      // Verify Prisma update was not called
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should handle server errors during update', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Original Name'
        }
      });
      
      // Mock Prisma error
      prisma.user.update.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request with profile data
      const profileData = {
        name: 'Updated Name'
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/profile', profileData);
      
      // Call the handler
      const response = await updateProfileHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.message).toContain('An error occurred');
      
      // Verify Prisma was called
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
