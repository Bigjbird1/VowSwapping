import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductCategory, ProductCondition } from '@/types/product';
import { Prisma } from '@prisma/client';
import { safeParseJson, safeStringifyJson } from '@/lib/json-conversion';

// Helper function to map database product to application product
function mapDatabaseProductToAppProduct(dbProduct: any) {
  return {
    id: dbProduct.id,
    title: dbProduct.title,
    description: dbProduct.description,
    price: dbProduct.price,
    discountPrice: dbProduct.discountPrice || undefined,
    // Parse JSON fields from the database
    images: safeParseJson(dbProduct.images),
    category: dbProduct.category.toLowerCase() as ProductCategory,
    condition: dbProduct.condition.toLowerCase().replace('_', '-') as any,
    // Parse JSON fields from the database
    tags: safeParseJson(dbProduct.tags),
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
    
  } catch (error: any) {
    console.error('Error fetching products:', error);
    
    // Handle database connection errors
    if (error.message?.includes('connection') || error.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' }, 
        { status: 500 }
      );
    }
    
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
    
    // Validate price
    const numericPrice = parseFloat(price.toString());
    if (isNaN(numericPrice)) {
      return NextResponse.json(
        { error: 'Price must be a valid number' },
        { status: 400 }
      );
    }
    
    // Validate price is positive
    if (numericPrice < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }
    
    // Validate price is within reasonable bounds
    const MAX_PRICE = 1000000; // $1 million as a reasonable upper limit
    if (numericPrice > MAX_PRICE) {
      return NextResponse.json(
        { error: `Price cannot exceed ${MAX_PRICE}` },
        { status: 400 }
      );
    }
    
    // Validate discount price if provided
    if (discountPrice !== undefined && discountPrice !== null) {
      const numericDiscountPrice = parseFloat(discountPrice.toString());
      if (isNaN(numericDiscountPrice)) {
        return NextResponse.json(
          { error: 'Discount price must be a valid number' },
          { status: 400 }
        );
      }
      
      if (numericDiscountPrice < 0) {
        return NextResponse.json(
          { error: 'Discount price cannot be negative' },
          { status: 400 }
        );
      }
      
      if (numericDiscountPrice > numericPrice) {
        return NextResponse.json(
          { error: 'Discount price cannot be greater than regular price' },
          { status: 400 }
        );
      }
    }
    
    // Validate title length
    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title is too long (maximum 255 characters)' },
        { status: 400 }
      );
    }
    
    // Sanitize title for potential XSS
    const sanitizedTitle = title.replace(/<[^>]*>?/gm, '');
    if (sanitizedTitle !== title) {
      return NextResponse.json(
        { error: 'Title contains invalid characters' },
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
        title: sanitizedTitle,
        description,
        price: numericPrice,
        discountPrice: discountPrice ? parseFloat(discountPrice.toString()) : null,
        // Pass arrays directly to Prisma
        images: images,
        category: category.toUpperCase() as any,
        condition: condition.toUpperCase().replace('-', '_') as any,
        // Pass arrays directly to Prisma
        tags: tags || [],
        featured: featured === true, // Ensure boolean
        sellerId: user.id,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      product: mapDatabaseProductToAppProduct(product)
    });
    
  } catch (error: any) {
    console.error('Product creation error:', error);
    
    // Handle specific Prisma errors
    if (error.code) {
      switch (error.code) {
        // Unique constraint violation
        case 'P2002':
          return NextResponse.json(
            { error: `A product with this ${error.meta?.target || 'property'} already exists` }, 
            { status: 400 }
          );
          
        // Foreign key constraint violation
        case 'P2003':
          return NextResponse.json(
            { error: `Invalid reference: ${error.meta?.field_name || 'unknown field'}` }, 
            { status: 400 }
          );
          
        // Check constraint violation
        case 'P2004':
          return NextResponse.json(
            { error: `Invalid value: ${error.meta?.constraint || 'constraint violation'}` }, 
            { status: 400 }
          );
          
        // Data type error
        case 'P2006':
          return NextResponse.json(
            { error: `Invalid data type for ${error.meta?.target || 'field'}` }, 
            { status: 400 }
          );
          
        // Required field missing
        case 'P2012':
          return NextResponse.json(
            { error: `Missing required field: ${error.meta?.path || 'unknown'}` }, 
            { status: 400 }
          );
          
        // Invalid enum value
        case 'P2009':
          return NextResponse.json(
            { error: `Invalid value for ${error.meta?.field_name || 'field'}` }, 
            { status: 400 }
          );
          
        // Database timeout
        case 'P2024':
          return NextResponse.json(
            { error: 'Database operation timed out. Please try again.' }, 
            { status: 500 }
          );
          
        // Default case for other Prisma errors
        default:
          return NextResponse.json(
            { error: 'Database error. Please try again later.' }, 
            { status: 500 }
          );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' }, 
      { status: 500 }
    );
  }
}
