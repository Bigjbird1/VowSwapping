import { NextRequest } from 'next/server';
import { GET as getAddressesHandler, POST as createAddressHandler } from '@/app/api/user/addresses/route';
import { GET as getAddressHandler, PUT as updateAddressHandler, DELETE as deleteAddressHandler } from '@/app/api/user/addresses/[id]/route';
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
    address: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
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

describe('User Addresses API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/user/addresses', () => {
    it('should return user addresses when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock addresses data
      const mockAddresses = [
        {
          id: 'address-1',
          userId: 'user-1',
          name: 'Home',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
          isDefault: true
        },
        {
          id: 'address-2',
          userId: 'user-1',
          name: 'Work',
          street: '456 Office Blvd',
          city: 'Worktown',
          state: 'NY',
          postalCode: '67890',
          country: 'USA',
          isDefault: false
        }
      ];
      
      // Mock Prisma response
      prisma.address.findMany.mockResolvedValueOnce(mockAddresses);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/addresses');
      
      // Call the handler
      const response = await getAddressesHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.addresses).toHaveLength(2);
      expect(responseData.addresses[0].id).toBe('address-1');
      expect(responseData.addresses[1].id).toBe('address-2');
      
      // Verify Prisma was called correctly
      expect(prisma.address.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        })
      );
    });
    
    it('should reject address retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/addresses');
      
      // Call the handler
      const response = await getAddressesHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma findMany was not called
      expect(prisma.address.findMany).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/user/addresses', () => {
    it('should create a new address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock address count (first address)
      prisma.address.count.mockResolvedValueOnce(0);
      
      // Mock address creation
      const mockCreatedAddress = {
        id: 'new-address',
        userId: 'user-1',
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      prisma.address.create.mockResolvedValueOnce(mockCreatedAddress);
      
      // For setting default address
      prisma.address.updateMany.mockResolvedValueOnce({ count: 0 });
      
      // Create request with address data
      const addressData = {
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/addresses', addressData);
      
      // Call the handler
      const response = await createAddressHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(responseData.message).toContain('Address created successfully');
      expect(responseData.address.id).toBe('new-address');
      
      // Verify Prisma was called correctly
      expect(prisma.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            name: 'Home',
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'USA',
            isDefault: true
          })
        })
      );
      
      // Verify updateMany was called to reset other default addresses
      expect(prisma.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            id: { not: 'new-address' }
          },
          data: { isDefault: false }
        })
      );
    });
    
    it('should reject address creation when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with address data
      const addressData = {
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/addresses', addressData);
      
      // Call the handler
      const response = await createAddressHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma create was not called
      expect(prisma.address.create).not.toHaveBeenCalled();
    });
    
    it('should validate address data', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create request with invalid address data (missing required fields)
      const invalidAddressData = {
        name: 'Home',
        // Missing street, city, etc.
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/user/addresses', invalidAddressData);
      
      // Call the handler
      const response = await createAddressHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.message).toContain('validation');
      
      // Verify Prisma create was not called
      expect(prisma.address.create).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/user/addresses/[id]', () => {
    it('should return a specific address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock address data
      const mockAddress = {
        id: 'address-1',
        userId: 'user-1',
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      // Mock Prisma response
      prisma.address.findUnique.mockResolvedValueOnce(mockAddress);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/addresses/address-1');
      
      // Call the handler with params
      const response = await getAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.address.id).toBe('address-1');
      expect(responseData.address.name).toBe('Home');
      
      // Verify Prisma was called correctly
      expect(prisma.address.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            id: 'address-1',
            userId: 'user-1'
          }
        })
      );
    });
    
    it('should reject address retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/addresses/address-1');
      
      // Call the handler with params
      const response = await getAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma findUnique was not called
      expect(prisma.address.findUnique).not.toHaveBeenCalled();
    });
    
    it('should return 404 for non-existent address', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock Prisma response for non-existent address
      prisma.address.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/user/addresses/non-existent');
      
      // Call the handler with params
      const response = await getAddressHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.message).toContain('Address not found');
    });
  });
  
  describe('PUT /api/user/addresses/[id]', () => {
    it('should update an address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock existing address
      const mockExistingAddress = {
        id: 'address-1',
        userId: 'user-1',
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: false
      };
      
      // Mock updated address
      const mockUpdatedAddress = {
        ...mockExistingAddress,
        name: 'New Home',
        street: '456 New St',
        isDefault: true
      };
      
      // Mock Prisma responses
      prisma.address.findUnique.mockResolvedValueOnce(mockExistingAddress);
      prisma.address.update.mockResolvedValueOnce(mockUpdatedAddress);
      prisma.address.updateMany.mockResolvedValueOnce({ count: 1 });
      
      // Create request with updated address data
      const updatedAddressData = {
        name: 'New Home',
        street: '456 New St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/addresses/address-1', updatedAddressData);
      
      // Call the handler with params
      const response = await updateAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('Address updated successfully');
      expect(responseData.address.name).toBe('New Home');
      expect(responseData.address.street).toBe('456 New St');
      
      // Verify Prisma was called correctly
      expect(prisma.address.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'address-1' },
          data: expect.objectContaining({
            name: 'New Home',
            street: '456 New St',
            isDefault: true
          })
        })
      );
      
      // Verify updateMany was called to reset other default addresses
      expect(prisma.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            id: { not: 'address-1' }
          },
          data: { isDefault: false }
        })
      );
    });
    
    it('should reject address update when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with updated address data
      const updatedAddressData = {
        name: 'New Home',
        street: '456 New St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/addresses/address-1', updatedAddressData);
      
      // Call the handler with params
      const response = await updateAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma update was not called
      expect(prisma.address.update).not.toHaveBeenCalled();
    });
    
    it('should return 404 for non-existent address', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock Prisma response for non-existent address
      prisma.address.findUnique.mockResolvedValueOnce(null);
      
      // Create request with updated address data
      const updatedAddressData = {
        name: 'New Home',
        street: '456 New St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      const { req } = mockRequestResponse('PUT', 'http://localhost:3002/api/user/addresses/non-existent', updatedAddressData);
      
      // Call the handler with params
      const response = await updateAddressHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.message).toContain('Address not found');
      
      // Verify Prisma update was not called
      expect(prisma.address.update).not.toHaveBeenCalled();
    });
  });
  
  describe('DELETE /api/user/addresses/[id]', () => {
    it('should delete an address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock existing address
      const mockExistingAddress = {
        id: 'address-1',
        userId: 'user-1',
        name: 'Home',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        isDefault: true
      };
      
      // Mock another address to be set as default
      const mockAnotherAddress = {
        id: 'address-2',
        userId: 'user-1',
        name: 'Work',
        street: '456 Office Blvd',
        city: 'Worktown',
        state: 'NY',
        postalCode: '67890',
        country: 'USA',
        isDefault: false,
        createdAt: new Date()
      };
      
      // Mock Prisma responses
      prisma.address.findUnique.mockResolvedValueOnce(mockExistingAddress);
      prisma.address.delete.mockResolvedValueOnce(mockExistingAddress);
      prisma.address.findFirst.mockResolvedValueOnce(mockAnotherAddress);
      prisma.address.update.mockResolvedValueOnce({
        ...mockAnotherAddress,
        isDefault: true
      });
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/addresses/address-1');
      
      // Call the handler with params
      const response = await deleteAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('Address deleted successfully');
      
      // Verify Prisma was called correctly
      expect(prisma.address.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'address-1' }
        })
      );
      
      // Verify findFirst was called to find another address
      expect(prisma.address.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' }
        })
      );
      
      // Verify update was called to set another address as default
      expect(prisma.address.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'address-2' },
          data: { isDefault: true }
        })
      );
    });
    
    it('should reject address deletion when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/addresses/address-1');
      
      // Call the handler with params
      const response = await deleteAddressHandler(req, { params: { id: 'address-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.message).toContain('must be logged in');
      
      // Verify Prisma delete was not called
      expect(prisma.address.delete).not.toHaveBeenCalled();
    });
    
    it('should return 404 for non-existent address', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock Prisma response for non-existent address
      prisma.address.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('DELETE', 'http://localhost:3002/api/user/addresses/non-existent');
      
      // Call the handler with params
      const response = await deleteAddressHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.message).toContain('Address not found');
      
      // Verify Prisma delete was not called
      expect(prisma.address.delete).not.toHaveBeenCalled();
    });
  });
});
