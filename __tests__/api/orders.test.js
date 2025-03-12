import { NextRequest, NextResponse } from 'next/server';
import { GET as getOrdersHandler, POST as createOrderHandler } from '@/app/api/orders/route';
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
    order: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    address: {
      create: jest.fn(),
    },
    $transaction: jest.fn(), // Ensure this line exists
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Order API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/orders', () => {
    it('should return user orders when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      });
      
      // Mock orders data
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-1',
          total: 199.98,
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
          addressId: 'address-1',
          orderItems: [
            {
              id: 'item-1',
              orderId: 'order-1',
              productId: 'product-1',
              quantity: 2,
              price: 99.99
            }
          ]
        },
        {
          id: 'order-2',
          userId: 'user-1',
          total: 149.99,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          addressId: 'address-1',
          orderItems: [
            {
              id: 'item-2',
              orderId: 'order-2',
              productId: 'product-2',
              quantity: 1,
              price: 149.99
            }
          ]
        }
      ];
      
      // Mock Prisma response
      prisma.order.findMany.mockResolvedValueOnce(mockOrders);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/orders');
      
      // Call the handler
      const response = await getOrdersHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.orders).toHaveLength(2);
      expect(responseData.orders[0].id).toBe('order-1');
      expect(responseData.orders[1].id).toBe('order-2');
      
      // Verify Prisma was called correctly
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          include: {
            orderItems: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      );
    });
    
    it('should reject order retrieval when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/orders');
      
      // Call the handler
      const response = await getOrdersHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma findMany was not called
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });
    
    it('should handle user not found error', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock user not found
      prisma.user.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/orders');
      
      // Call the handler
      const response = await getOrdersHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('User not found');
      
      // Verify Prisma findMany was not called
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/orders', () => {
    it('should create a new order with existing address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
    
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      });
    
      // Mock products with sufficient inventory
      const mockProducts = {
        'product-1': { id: 'product-1', inventory: 10, title: 'Product 1' },
        'product-2': { id: 'product-2', inventory: 5, title: 'Product 2' }
      };
    
      // Create external mock functions
      const mockProductFindUnique = jest.fn(({ where }) => 
        Promise.resolve(mockProducts[where.id])
      );
      const mockProductUpdate = jest.fn().mockResolvedValue({});
      const mockOrderCreate = jest.fn().mockResolvedValue({
        id: 'new-order',
        userId: 'user-1',
        total: 249.98,
        status: 'PENDING',
        addressId: 'address-1',
        orderItems: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            price: 99.99
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 1,
            price: 50.00
          }
        ]
      });
    
      // Mock transaction implementation
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: mockProductFindUnique,
            update: mockProductUpdate
          },
          order: {
            create: mockOrderCreate
          }
        };
        return callback(tx);
      });
    
      // Create request with order data
      const orderData = {
        items: [
          { productId: 'product-1', quantity: 2, price: 99.99 },
          { productId: 'product-2', quantity: 1, price: 50.00 }
        ],
        addressId: 'address-1'
      };
    
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/orders', orderData);
    
      // Call the handler
      const response = await createOrderHandler(req);
      const responseData = await response.json();
    
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.order.id).toBe('new-order');
      expect(responseData.order.total).toBe(249.98);
    
      // Verify inventory checks
      expect(mockProductFindUnique).toHaveBeenCalledTimes(2);
      expect(mockProductFindUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        select: { id: true, inventory: true, title: true }
      });
      expect(mockProductFindUnique).toHaveBeenCalledWith({
        where: { id: 'product-2' },
        select: { id: true, inventory: true, title: true }
      });
    
      // Verify inventory updates
      expect(mockProductUpdate).toHaveBeenCalledTimes(2);
      expect(mockProductUpdate).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { 
          inventory: { decrement: 2 },
          version: { increment: 1 }
        }
      });
      expect(mockProductUpdate).toHaveBeenCalledWith({
        where: { id: 'product-2' },
        data: { 
          inventory: { decrement: 1 },
          version: { increment: 1 }
        }
      });
    
      // Verify order creation
      expect(mockOrderCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          total: 249.98,
          status: 'PENDING',
          addressId: 'address-1',
          orderItems: {
            create: expect.arrayContaining([
              expect.objectContaining({
                productId: 'product-1',
                quantity: 2,
                price: 99.99
              }),
              expect.objectContaining({
                productId: 'product-2',
                quantity: 1,
                price: 50.00
              })
            ])
          }
        },
        include: {
          orderItems: true
        }
      });
    
      // Verify address creation was not called
      expect(prisma.address.create).not.toHaveBeenCalled();
    });
    
    it('should create a new order with new address when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
    
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      });
    
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
        isDefault: false
      };
      prisma.address.create.mockResolvedValueOnce(mockCreatedAddress);
    
      // Mock products and transaction
      const mockProducts = {
        'product-1': { id: 'product-1', inventory: 10, title: 'Product 1' },
        'product-2': { id: 'product-2', inventory: 5, title: 'Product 2' }
      };
    
      // Create external mock functions
      const mockProductFindUnique = jest.fn(({ where }) => 
        Promise.resolve(mockProducts[where.id])
      );
      const mockProductUpdate = jest.fn().mockResolvedValue({});
      const mockOrderCreate = jest.fn().mockResolvedValue({
        id: 'new-order',
        userId: 'user-1',
        total: 249.98,
        status: 'PENDING',
        addressId: 'new-address',
        orderItems: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            price: 99.99
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 1,
            price: 50.00
          }
        ]
      });
    
      // Mock transaction implementation
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          product: {
            findUnique: mockProductFindUnique,
            update: mockProductUpdate
          },
          order: {
            create: mockOrderCreate
          }
        };
        return callback(tx);
      });
    
      // Create request with order data and new address
      const orderData = {
        items: [
          { productId: 'product-1', quantity: 2, price: 99.99 },
          { productId: 'product-2', quantity: 1, price: 50.00 }
        ],
        address: {
          name: 'Home',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
          saveAddress: true
        }
      };
    
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/orders', orderData);
    
      // Call the handler
      const response = await createOrderHandler(req);
      const responseData = await response.json();
    
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.order.id).toBe('new-order');
    
      // Verify address creation
      expect(prisma.address.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'Home',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
          isDefault: false
        }
      });
    
      // Verify transaction operations
      expect(mockProductFindUnique).toHaveBeenCalledTimes(2);
      expect(mockOrderCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          total: 249.98,
          status: 'PENDING',
          addressId: 'new-address',
          orderItems: {
            create: expect.arrayContaining([
              expect.objectContaining({
                productId: 'product-1',
                quantity: 2,
                price: 99.99
              }),
              expect.objectContaining({
                productId: 'product-2',
                quantity: 1,
                price: 50.00
              })
            ])
          }
        },
        include: {
          orderItems: true
        }
      });
    
      // Verify inventory updates
      expect(mockProductUpdate).toHaveBeenCalledTimes(2);
      expect(mockProductUpdate).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { 
          inventory: { decrement: 2 },
          version: { increment: 1 }
        }
      });
    });
    
    it('should reject order creation when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with order data
      const orderData = {
        items: [
          { productId: 'product-1', quantity: 2, price: 99.99 }
        ],
        addressId: 'address-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/orders', orderData);
      
      // Call the handler
      const response = await createOrderHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify Prisma create was not called
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
    
    it('should reject order creation with empty items', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create request with empty items
      const orderData = {
        items: [],
        addressId: 'address-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/orders', orderData);
      
      // Call the handler
      const response = await createOrderHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('No items in order');
      
      // Verify Prisma create was not called
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
    
    it('should handle database errors during order creation', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      });
      
      // Correctly mock transaction to reject with database error
      prisma.$transaction.mockImplementationOnce(() => 
        Promise.reject(new Error('Database error'))
      );
      
      // Create request with order data
      const orderData = {
        items: [
          { productId: 'product-1', quantity: 2, price: 99.99 }
        ],
        addressId: 'address-1'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/orders', orderData);
      
      // Call the handler
      const response = await createOrderHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Database connection failed. Please try again later.');
    });
  });
});
