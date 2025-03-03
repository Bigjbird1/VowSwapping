import { Product, ProductCategory, ProductFilters } from '@/types/product';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Get all products
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    // Build filter object
    const filter: any = {
      // Only show approved products
      approved: true
    };
    
    if (filters) {
      if (filters.category) {
        filter.category = filters.category.toUpperCase();
      }
      
      if (filters.condition) {
        filter.condition = filters.condition.toUpperCase().replace('-', '_');
      }
      
      // Seller filtering
      if (filters.sellerId) {
        filter.sellerId = filters.sellerId;
      }
      
      // Price filtering
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        filter.OR = [
          // Check regular price
          {
            price: {
              ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
              ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
            },
          },
          // Check discount price if it exists
          {
            discountPrice: {
              ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
              ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
            },
          },
        ];
      }
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filter.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ];
      }
    }
    
    // Get products with filtering
    const products = await prisma.product.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
            sellerLogo: true
          }
        }
      }
    });
    
    // Convert database model to application model
    return products.map(mapDatabaseProductToAppProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Get a single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
            sellerLogo: true
          }
        }
      }
    });
    
    if (!product) {
      return null;
    }
    
    return mapDatabaseProductToAppProduct(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

// Get featured products
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { 
        featured: true,
        approved: true
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
            sellerLogo: true
          }
        }
      }
    });
    
    return products.map(mapDatabaseProductToAppProduct);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Get products by category
export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { 
        category: category.toUpperCase() as any,
        approved: true
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
            sellerLogo: true
          }
        }
      }
    });
    
    return products.map(mapDatabaseProductToAppProduct);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// Get related products (products in the same category, excluding the current product)
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  try {
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!currentProduct) {
      return [];
    }
    
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: currentProduct.category,
        id: { not: productId },
        approved: true
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
            sellerLogo: true
          }
        }
      }
    });
    
    return relatedProducts.map(mapDatabaseProductToAppProduct);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

// Helper function to map database product model to application product model
function mapDatabaseProductToAppProduct(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description,
    price: dbProduct.price,
    discountPrice: dbProduct.discountPrice || undefined,
    images: dbProduct.images,
    category: dbProduct.category.toLowerCase() as ProductCategory,
    condition: dbProduct.condition.toLowerCase().replace('_', '-') as any,
    tags: dbProduct.tags,
    createdAt: dbProduct.createdAt.toISOString(),
    updatedAt: dbProduct.updatedAt.toISOString(),
    featured: dbProduct.featured,
    sellerId: dbProduct.sellerId,
    seller: dbProduct.seller ? {
      id: dbProduct.seller.id,
      name: dbProduct.seller.name,
      shopName: dbProduct.seller.shopName,
      sellerRating: dbProduct.seller.sellerRating,
      sellerRatingsCount: dbProduct.seller.sellerRatingsCount,
      sellerSince: dbProduct.seller.sellerSince ? dbProduct.seller.sellerSince.toISOString() : null,
      sellerLogo: dbProduct.seller.sellerLogo
    } : undefined
  };
}

// Mock data for products - keeping this for reference and seeding
export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Elegant Lace Wedding Dress',
    description: 'A beautiful lace wedding dress with a sweetheart neckline and chapel train. Perfect for a traditional wedding.',
    price: 1200,
    discountPrice: 899,
    images: [
      'https://images.unsplash.com/photo-1594552072238-5c4a26f10bfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      'https://images.unsplash.com/photo-1596451190630-186aff535bf2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['lace', 'white', 'sweetheart', 'chapel train'],
    createdAt: '2023-01-15T12:00:00Z',
    updatedAt: '2023-01-15T12:00:00Z',
    featured: true,
  },
  {
    id: '2',
    title: 'Crystal Bridal Tiara',
    description: 'Stunning crystal tiara that will make you feel like royalty on your special day.',
    price: 250,
    images: [
      'https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['tiara', 'crystal', 'silver'],
    createdAt: '2023-02-10T14:30:00Z',
    updatedAt: '2023-02-10T14:30:00Z',
    featured: true,
  },
  {
    id: '3',
    title: 'Rustic Wedding Centerpieces (Set of 10)',
    description: 'Beautiful rustic centerpieces featuring mason jars, burlap, and artificial flowers. Perfect for a country or barn wedding.',
    price: 350,
    discountPrice: 299,
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['rustic', 'centerpieces', 'mason jars', 'burlap'],
    createdAt: '2023-03-05T09:15:00Z',
    updatedAt: '2023-03-05T09:15:00Z',
    featured: true,
  },
  {
    id: '4',
    title: 'Mermaid Style Wedding Dress',
    description: 'Stunning mermaid style wedding dress with beaded details and a dramatic train.',
    price: 1500,
    discountPrice: 1200,
    images: [
      'https://images.unsplash.com/photo-1585241920473-b472eb9ffbae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'dresses',
    condition: 'like-new',
    tags: ['mermaid', 'beaded', 'train'],
    createdAt: '2023-01-20T10:45:00Z',
    updatedAt: '2023-01-20T10:45:00Z',
    featured: false,
  },
  {
    id: '5',
    title: 'Pearl Bridal Earrings',
    description: 'Elegant pearl drop earrings that add a touch of sophistication to your bridal look.',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    ],
    category: 'accessories',
    condition: 'new',
    tags: ['earrings', 'pearl', 'elegant'],
    createdAt: '2023-02-15T16:20:00Z',
    updatedAt: '2023-02-15T16:20:00Z',
    featured: false,
  },
  {
    id: '6',
    title: 'String Lights (100ft)',
    description: 'Warm white string lights perfect for creating a magical atmosphere at your wedding reception.',
    price: 80,
    images: [
      'https://images.unsplash.com/photo-1547393947-1849a9bc22f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    ],
    category: 'decorations',
    condition: 'good',
    tags: ['lights', 'string lights', 'reception'],
    createdAt: '2023-03-10T11:30:00Z',
    updatedAt: '2023-03-10T11:30:00Z',
    featured: true,
  },
];
