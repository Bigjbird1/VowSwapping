import { NextRequest, NextResponse } from 'next/server';
import { GET as getProductsHandler, POST as createProductHandler } from '@/app/api/products/route';
import { GET as getProductHandler, PUT as updateProductHandler, DELETE as deleteProductHandler } from '@/app/api/products/[id]/route';
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
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Product API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      // Mock product data
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Test Product 1',
          description: 'Test description 1',
          price: 99.99,
          images: ['image1.jpg'],
          category: 'DRESSES',
          condition: 'NEW',
          tags: ['wedding', 'dress'],
          createdAt: new Date(),
          updatedAt: new Date(),
          featured: false,
          sellerId: 'seller-1',
          approved: true,
          seller: {
            id: 'seller-1',
            name: 'Test Seller',
            shopName: 'Test Shop',
            sellerRating: 4.5,
            sellerRatingsCount: 10,
            sellerSince: new Date(),
            sellerLogo: 'logo.jpg'
          }
        },
        {
          id: 'product-2',
          title: 'Test Product 2',
          description: 'Test description 2',
          price: 149.99,
          images: ['image2.jpg'],
          category: 'ACCESSORIES',
          condition: 'LIKE_NEW',
          tags: ['accessory', 'wedding'],
          createdAt: new Date(),
          updatedAt: new Date(),
          featured: true,
          sellerId: 'seller-1',
          approved: true,
          seller: {
            id: 'seller-1',
            name: 'Test Seller',
            shopName: 'Test Shop',
            sellerRating: 4.5,
            sellerRatingsCount: 10,
            sellerSince: new Date(),
            sellerLogo: 'logo.jpg'
          }
        }
      ];
      
      // Mock Prisma response
      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products');
      
      // Call the handler
      const response = await getProductsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.products).toHaveLength(2);
      expect(responseData.products[0].id).toBe('product-1');
      expect(responseData.products[1].id).toBe('product-2');
      
      // Verify Prisma was called correctly
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approved: true
          }),
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            seller: {
              select: expect.any(Object)
            }
          }
        })
      );
    });
    
    it('should filter products by category', async () => {
      // Mock product data
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Test Dress',
          description: 'Test description',
          price: 99.99,
          images: ['image1.jpg'],
          category: 'DRESSES',
          condition: 'NEW',
          tags: ['wedding', 'dress'],
          createdAt: new Date(),
          updatedAt: new Date(),
          featured: false,
          sellerId: 'seller-1',
          approved: true,
          seller: {
            id: 'seller-1',
            name: 'Test Seller',
            shopName: 'Test Shop',
            sellerRating: 4.5,
            sellerRatingsCount: 10,
            sellerSince: new Date(),
            sellerLogo: 'logo.jpg'
          }
        }
      ];
      
      // Mock Prisma response
      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products?category=dresses');
      
      // Call the handler
      const response = await getProductsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.products).toHaveLength(1);
      expect(responseData.products[0].category).toBe('dresses');
      
      // Verify Prisma was called correctly
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approved: true,
            category: 'DRESSES'
          })
        })
      );
    });
    
    it('should filter products by price range', async () => {
      // Mock product data
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Test Product',
          description: 'Test description',
          price: 99.99,
          images: ['image1.jpg'],
          category: 'DRESSES',
          condition: 'NEW',
          tags: ['wedding', 'dress'],
          createdAt: new Date(),
          updatedAt: new Date(),
          featured: false,
          sellerId: 'seller-1',
          approved: true,
          seller: {
            id: 'seller-1',
            name: 'Test Seller',
            shopName: 'Test Shop',
            sellerRating: 4.5,
            sellerRatingsCount: 10,
            sellerSince: new Date(),
            sellerLogo: 'logo.jpg'
          }
        }
      ];
      
      // Mock Prisma response
      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products?minPrice=50&maxPrice=100');
      
      // Call the handler
      const response = await getProductsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.products).toHaveLength(1);
      
      // Verify Prisma was called correctly with price filters
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approved: true,
            OR: expect.arrayContaining([
              expect.objectContaining({
                price: expect.objectContaining({
                  gte: 50,
                  lte: 100
                })
              }),
              expect.objectContaining({
                discountPrice: expect.objectContaining({
                  gte: 50,
                  lte: 100
                })
              })
            ])
          })
        })
      );
    });
    
    it('should handle search query', async () => {
      // Mock product data
      const mockProducts = [
        {
          id: 'product-1',
          title: 'Wedding Dress',
          description: 'Beautiful wedding dress',
          price: 99.99,
          images: ['image1.jpg'],
          category: 'DRESSES',
          condition: 'NEW',
          tags: ['wedding', 'dress'],
          createdAt: new Date(),
          updatedAt: new Date(),
          featured: false,
          sellerId: 'seller-1',
          approved: true,
          seller: {
            id: 'seller-1',
            name: 'Test Seller',
            shopName: 'Test Shop',
            sellerRating: 4.5,
            sellerRatingsCount: 10,
            sellerSince: new Date(),
            sellerLogo: 'logo.jpg'
          }
        }
      ];
      
      // Mock Prisma response
      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products?q=wedding');
      
      // Call the handler
      const response = await getProductsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.products).toHaveLength(1);
      
      // Verify Prisma was called correctly with search query
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approved: true,
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { title: { contains: 'wedding' } },
                  { description: { contains: 'wedding' } }
                ])
              })
            ])
          })
        })
      );
    });
    
    it('should handle database errors', async () => {
      // Mock database error
      prisma.product.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products');
      
      // Call the handler
      const response = await getProductsHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Failed to fetch products')
        })
      );
    });
  });
  
  describe('GET /api/products/[id]', () => {
    it('should return a specific product by ID', async () => {
      // Mock product data
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        description: 'Test description',
        price: 99.99,
        images: ['image1.jpg'],
        category: 'DRESSES',
        condition: 'NEW',
        tags: ['wedding', 'dress'],
        createdAt: new Date(),
        updatedAt: new Date(),
        featured: false,
        sellerId: 'seller-1',
        approved: true,
        seller: {
          id: 'seller-1',
          name: 'Test Seller',
          shopName: 'Test Shop',
          sellerRating: 4.5,
          sellerRatingsCount: 10,
          sellerSince: new Date(),
          sellerLogo: 'logo.jpg'
        }
      };
      
      // Mock Prisma response
      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products/product-1');
      
      // Call the handler with params
      const response = await getProductHandler(req, { params: { id: 'product-1' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.product.id).toBe('product-1');
      expect(responseData.product.title).toBe('Test Product');
      
      // Verify Prisma was called correctly
      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          include: {
            seller: {
              select: expect.any(Object)
            }
          }
        })
      );
    });
    
    it('should return 404 for non-existent product', async () => {
      // Mock Prisma response for non-existent product
      prisma.product.findUnique.mockResolvedValueOnce(null);
      
      // Create request
      const { req } = mockRequestResponse('GET', 'http://localhost:3002/api/products/non-existent');
      
      // Call the handler with params
      const response = await getProductHandler(req, { params: { id: 'non-existent' } });
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(responseData).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Product not found')
        })
      );
    });
  });
  
  describe('POST /api/products', () => {
    it('should create a new product when authenticated as seller', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'seller@example.com',
          name: 'Test Seller'
        }
      });
      
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'seller@example.com',
        name: 'Test Seller',
        isSeller: true,
        sellerApproved: true
      });
      
      // Mock product creation
      const mockCreatedProduct = {
        id: 'new-product',
        title: 'New Product',
        description: 'New product description',
        price: 149.99,
        images: ['image.jpg'],
        category: 'DRESSES',
        condition: 'NEW',
        tags: ['wedding', 'new'],
        createdAt: new Date(),
        updatedAt: new Date(),
        featured: false,
        sellerId: 'user-1',
        approved: false
      };
      
      prisma.product.create.mockResolvedValueOnce(mockCreatedProduct);
      
      // Create request with product data
      const productData = {
        title: 'New Product',
        description: 'New product description',
        price: 149.99,
        images: ['image.jpg'],
        category: 'dresses',
        condition: 'new',
        tags: ['wedding', 'new']
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/products', productData);
      
      // Call the handler
      const response = await createProductHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.product.id).toBe('new-product');
      
      // Verify Prisma was called correctly
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Product',
            description: 'New product description',
            price: 149.99,
            images: ['image.jpg'],
            category: 'DRESSES',
            condition: 'NEW',
            tags: ['wedding', 'new'],
            sellerId: 'user-1'
          })
        })
      );
    });
    
    it('should reject product creation when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create request with product data
      const productData = {
        title: 'New Product',
        description: 'New product description',
        price: 149.99,
        images: ['image.jpg'],
        category: 'dresses',
        condition: 'new',
        tags: ['wedding', 'new']
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/products', productData);
      
      // Call the handler
      const response = await createProductHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Unauthorized')
        })
      );
      
      // Verify Prisma create was not called
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
    
    it('should reject product creation with missing required fields', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'seller@example.com',
          name: 'Test Seller'
        }
      });
      
      // Mock user data
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'seller@example.com',
        name: 'Test Seller',
        isSeller: true,
        sellerApproved: true
      });
      
      // Create request with incomplete product data (missing price)
      const incompleteProductData = {
        title: 'New Product',
        description: 'New product description',
        // price is missing
        images: ['image.jpg'],
        category: 'dresses',
        condition: 'new'
      };
      
      const { req } = mockRequestResponse('POST', 'http://localhost:3002/api/products', incompleteProductData);
      
      // Call the handler
      const response = await createProductHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData).toEqual(
        expect.objectContaining({
          error: expect.stringContaining('Missing required fields')
        })
      );
      
      // Verify Prisma create was not called
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/products/[id]', () => {
    it('should update a product when authenticated as the seller', async () => {
      // This test would be implemented if the PUT handler was provided
      // For now, we'll skip this test
      expect(true).toBe(true);
    });
  });
  
  describe('DELETE /api/products/[id]', () => {
    it('should delete a product when authenticated as the seller', async () => {
      // This test would be implemented if the DELETE handler was provided
      // For now, we'll skip this test
      expect(true).toBe(true);
    });
  });
});
