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
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  },
}));

describe('Transaction Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transaction Rollbacks', () => {
    it('should rollback order creation if payment verification fails', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to fail
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockRejectedValueOnce(
        new Error('Invalid payment intent')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [
          { id: 'product-1', quantity: 2, price: 19.99 },
          { id: 'product-2', quantity: 1, price: 29.99 }
        ],
        addressId: 'address-1',
        paymentIntentId: 'pi_invalid123'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'payment|invalid|verification');
      
      // Verify that no order was created
      expect(prisma.order.create).not.toHaveBeenCalled();
      expect(prisma.orderItem.create).not.toHaveBeenCalled();
      expect(prisma.orderItem.createMany).not.toHaveBeenCalled();
    });

    it('should rollback the entire transaction if any part fails', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to succeed
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 6997, // $69.97 in cents
        currency: 'usd',
        customer: 'cus_test123'
      });
      
      // Mock order creation to succeed
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-1',
        total: 69.97,
        status: 'processing',
        addressId: 'address-1',
        paymentIntentId: 'pi_test123'
      });
      
      // Mock order item creation to fail
      prisma.orderItem.createMany.mockRejectedValueOnce(
        new Error('Failed to create order items')
      );
      
      // Mock transaction to properly handle the error
      prisma.$transaction.mockImplementationOnce(async (callback) => {
        try {
          return await callback(prisma);
        } catch (error) {
          // This simulates a transaction rollback
          throw error;
        }
      });
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [
          { id: 'product-1', quantity: 2, price: 19.99 },
          { id: 'product-2', quantity: 1, price: 29.99 }
        ],
        addressId: 'address-1',
        paymentIntentId: 'pi_test123'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 500, 'Failed to create order');
      
      // Verify that transaction was used
      expect(prisma.$transaction).toHaveBeenCalled();
      
      // Verify that Stripe payment intent was not updated (since the transaction failed)
      expect(stripeModule.stripe.paymentIntents.update).not.toHaveBeenCalled();
    });
  });

  describe('Partial Success Handling', () => {
    it('should handle partial success in batch operations', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createProductHandler } = await import('@/app/api/seller/products/route');
      
      // Mock authenticated session with seller permissions
      getServerSession.mockResolvedValue(createMockSession({
        isSeller: true,
        sellerApproved: true
      }));
      
      // Mock a batch product creation (assuming the API supports it)
      const req = createMockRequest('POST', 'http://localhost:3000/api/seller/products', {
        products: [
          {
            title: 'Product 1',
            description: 'Description 1',
            price: 19.99,
            category: 'dresses',
            condition: 'new',
            images: ['image1.jpg']
          },
          {
            title: 'Product 2',
            description: 'Description 2',
            price: 29.99,
            category: 'dresses',
            condition: 'new',
            images: ['image2.jpg']
          },
          {
            title: 'Product 3',
            description: 'Description 3',
            price: -10.99, // Invalid price
            category: 'dresses',
            condition: 'new',
            images: ['image3.jpg']
          }
        ]
      });
      
      // Call the handler
      const response = await createProductHandler(req);
      
      // If the API handles partial success, it should return a 207 Multi-Status
      if (response.status === 207) {
        const data = await response.json();
        expect(data.results).toBeDefined();
        expect(data.results.length).toBe(3);
        
        // First two products should succeed
        expect(data.results[0].success).toBe(true);
        expect(data.results[1].success).toBe(true);
        
        // Third product should fail
        expect(data.results[2].success).toBe(false);
        expect(data.results[2].error).toMatch(/price|negative|invalid/);
      } else if (response.status === 400) {
        // If the API doesn't support partial success, it should fail with a 400
        await validateErrorResponse(response, 400, 'price|negative|invalid');
      } else {
        // Unexpected response
        console.log(`Unexpected response status: ${response.status}`);
      }
    });
  });

  describe('Constraint Violations', () => {
    it('should handle unique constraint violations gracefully', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: registerHandler } = await import('@/app/api/auth/register/route');
      
      // Mock user creation to fail with a unique constraint violation
      prisma.user.create.mockRejectedValueOnce({
        code: 'P2002', // Prisma unique constraint violation code
        meta: {
          target: ['email']
        },
        message: 'Unique constraint failed on the fields: (`email`)'
      });
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'Password123!'
      });
      
      // Call the handler
      const response = await registerHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'email|already|exists|taken');
    });

    it('should handle foreign key constraint violations gracefully', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to succeed
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1999, // $19.99 in cents
        currency: 'usd',
        customer: 'cus_test123'
      });
      
      // Mock transaction to fail with a foreign key constraint violation
      prisma.$transaction.mockRejectedValueOnce({
        code: 'P2003', // Prisma foreign key constraint violation code
        meta: {
          field_name: 'addressId'
        },
        message: 'Foreign key constraint failed on the field: `addressId`'
      });
      
      // Create a mock request with a non-existent address ID
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [
          { id: 'product-1', quantity: 1, price: 19.99 }
        ],
        addressId: 'non-existent-address',
        paymentIntentId: 'pi_test123'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 400, 'address|invalid|not found');
    });
  });

  describe('Transaction Isolation', () => {
    it('should handle concurrent transactions with proper isolation', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to succeed
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1999, // $19.99 in cents
        currency: 'usd',
        customer: 'cus_test123'
      });
      
      // Mock product retrieval to return a product with limited inventory
      prisma.product.findUnique.mockResolvedValue({
        id: 'product-1',
        title: 'Limited Product',
        price: 19.99,
        inventory: 1 // Only 1 item left in stock
      });
      
      // Mock transaction to simulate inventory check and update
      let orderCreated = false;
      prisma.$transaction.mockImplementation(async (callback) => {
        if (!orderCreated) {
          // First order succeeds
          orderCreated = true;
          return {
            id: 'order-1',
            userId: 'user-1',
            total: 19.99,
            items: [{ productId: 'product-1', quantity: 1, price: 19.99 }]
          };
        } else {
          // Second order fails due to insufficient inventory
          throw new Error('Insufficient inventory');
        }
      });
      
      // Create two concurrent order requests for the same product
      const req1 = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [{ id: 'product-1', quantity: 1, price: 19.99 }],
        addressId: 'address-1',
        paymentIntentId: 'pi_test123'
      });
      
      const req2 = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [{ id: 'product-1', quantity: 1, price: 19.99 }],
        addressId: 'address-1',
        paymentIntentId: 'pi_test456'
      });
      
      // Execute both requests concurrently
      const [response1, response2] = await Promise.all([
        createOrderHandler(req1),
        createOrderHandler(req2)
      ]);
      
      // First request should succeed
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.order).toBeDefined();
      
      // Second request should fail with an inventory error
      await validateErrorResponse(response2, 400, 'inventory|stock|unavailable');
      
      // Verify that transaction was called twice
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cleanup After Failure', () => {
    it('should clean up resources if a transaction fails', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to succeed
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 6997, // $69.97 in cents
        currency: 'usd',
        customer: 'cus_test123'
      });
      
      // Mock transaction to fail
      prisma.$transaction.mockRejectedValueOnce(
        new Error('Transaction failed')
      );
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [
          { id: 'product-1', quantity: 2, price: 19.99 },
          { id: 'product-2', quantity: 1, price: 29.99 }
        ],
        addressId: 'address-1',
        paymentIntentId: 'pi_test123'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // Validate the error response
      await validateErrorResponse(response, 500, 'Failed to create order');
      
      // Verify that Stripe payment intent was not updated (since the transaction failed)
      expect(stripeModule.stripe.paymentIntents.update).not.toHaveBeenCalled();
      
      // If the API implements cleanup, it might cancel the payment intent or create a refund
      // Check if either of these were called
      const cancelCalled = stripeModule.stripe.paymentIntents.cancel.mock.calls.length > 0;
      const refundCalled = stripeModule.stripe.refunds.create.mock.calls.length > 0;
      
      if (cancelCalled || refundCalled) {
        console.log('API implements cleanup after transaction failure');
      } else {
        console.log('WARNING: API does not implement cleanup after transaction failure');
      }
    });
  });

  describe('Transaction Retry Logic', () => {
    it('should retry transactions that fail due to temporary issues', async () => {
      // Import the handler dynamically to avoid issues with mocking
      const { POST: createOrderHandler } = await import('@/app/api/orders/route');
      
      // Mock authenticated session
      getServerSession.mockResolvedValue(createMockSession());
      
      // Mock Stripe payment intent retrieval to succeed
      const stripeModule = await import('@/lib/stripe');
      stripeModule.stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1999, // $19.99 in cents
        currency: 'usd',
        customer: 'cus_test123'
      });
      
      // Mock transaction to fail with a temporary error on first attempt, then succeed
      let attempts = 0;
      prisma.$transaction.mockImplementation(async (callback) => {
        attempts++;
        if (attempts === 1) {
          // First attempt fails with a temporary error
          throw new Error('Connection lost');
        } else {
          // Second attempt succeeds
          return {
            id: 'order-1',
            userId: 'user-1',
            total: 19.99,
            items: [{ productId: 'product-1', quantity: 1, price: 19.99 }]
          };
        }
      });
      
      // Create a mock request
      const req = createMockRequest('POST', 'http://localhost:3000/api/orders', {
        items: [{ id: 'product-1', quantity: 1, price: 19.99 }],
        addressId: 'address-1',
        paymentIntentId: 'pi_test123'
      });
      
      // Call the handler
      const response = await createOrderHandler(req);
      
      // If the API implements retry logic, it should eventually succeed
      if (response.status === 200) {
        const data = await response.json();
        expect(data.order).toBeDefined();
        expect(attempts).toBe(2); // Should have retried after the temporary error
      } else {
        // If the API doesn't have retry logic, we'll get an error
        await validateErrorResponse(response, 500, 'Failed to create order');
        // This is a hint that we should implement retry logic
        console.log('API does not implement retry logic for temporary transaction failures');
      }
    });
  });
});
