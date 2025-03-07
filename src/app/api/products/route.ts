import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductCategory, ProductCondition } from '@/types/product';
import { Prisma } from '@prisma/client';

// Helper function to map database product to application product
function mapDatabaseProductToAppProduct(dbProduct: any) {
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

// GET /api/products - Get all products with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const category = searchParams.get('category') as string | null;
    const condition = searchParams.get('condition') as string | null;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const searchQuery = searchParams.get('q');
    const sellerId = searchParams.get('sellerId');
    
    // Build Prisma where clause
    const where: Prisma.ProductWhereInput = {
      // Only show approved products in public API
      approved: true
    };
    
    if (category) {
      where.category = category.toUpperCase() as any;
    }
    
    if (condition) {
      where.condition = condition.toUpperCase().replace('-', '_') as any;
    }
    
    // Seller filtering
    if (sellerId) {
      where.sellerId = sellerId;
    }
    
    // Price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      // If we don't already have an OR condition
      if (!where.OR) {
        where.OR = [];
      } else if (!Array.isArray(where.OR)) {
        // If OR exists but is not an array, convert it to an array
        where.OR = [where.OR];
      }
      
      // Add price conditions to the OR array
      (where.OR as Prisma.ProductWhereInput[]).push(
        // Check regular price
        {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        },
        // Check discount price if it exists
        {
          discountPrice: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      );
    }
    
    // Search query
    if (searchQuery) {
      // Create search conditions
      const searchConditions = [
        { title: { contains: searchQuery.toLowerCase() } },
        { description: { contains: searchQuery.toLowerCase() } },
        // Tags search removed due to Prisma compatibility issues
      ];
      
      // Add search conditions to AND clause
      where.AND = where.AND || [];
      (where.AND as Prisma.ProductWhereInput[]).push({ OR: searchConditions });
    }
    
    // Execute query with Prisma
    const products = await prisma.product.findMany({
      where,
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
    
    return NextResponse.json({ 
      products: products.map(mapDatabaseProductToAppProduct) 
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (admin/seller only)
export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { 
      title, 
      description, 
      price, 
      discountPrice, 
      images, 
      category, 
      condition, 
      tags,
      featured 
    } = data;
    
    // Validate required fields
    if (!title || !description || price === undefined || !images || !category || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create product using Prisma
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price.toString()),
        discountPrice: discountPrice ? parseFloat(discountPrice.toString()) : null,
        images,
        category: category.toUpperCase() as any,
        condition: condition.toUpperCase().replace('-', '_') as any,
        tags: tags || [],
        featured: featured || false,
        sellerId: user.id,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      product: mapDatabaseProductToAppProduct(product)
    });
    
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' }, 
      { status: 500 }
    );
  }
}
