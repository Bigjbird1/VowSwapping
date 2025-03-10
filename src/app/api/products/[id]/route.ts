import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductCategory } from '@/types/product';
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

// GET /api/products/[id] - Get a single product by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      product: mapDatabaseProductToAppProduct(product) 
    });
    
  } catch (error: any) {
    console.error('Error fetching product:', error);
    
    // Handle specific Prisma errors
    if (error.code) {
      switch (error.code) {
        // Invalid ID format
        case 'P2023':
          return NextResponse.json(
            { error: 'Invalid product ID format' }, 
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
      { error: 'Failed to fetch product' }, 
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product (admin/seller only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const id = params.id;
  
  try {
    const data = await request.json();
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Only allow the seller to update their own products
    // In a real app, you might have admin roles that can update any product
    if (existingProduct.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Prepare update data
    const {
      title,
      description,
      price,
      discountPrice,
      images,
      category,
      condition,
      tags,
      featured,
    } = data;
    
    // Build update data object
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price.toString());
    if (discountPrice !== undefined) {
      updateData.discountPrice = discountPrice ? parseFloat(discountPrice.toString()) : null;
    }
    if (images !== undefined) updateData.images = images;
    if (category !== undefined) updateData.category = category.toUpperCase();
    if (condition !== undefined) updateData.condition = condition.toUpperCase().replace('-', '_');
    if (tags !== undefined) updateData.tags = tags;
    if (featured !== undefined) updateData.featured = featured;
    
    // Update product using Prisma
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({ 
      success: true, 
      product: mapDatabaseProductToAppProduct(updatedProduct) 
    });
    
  } catch (error: any) {
    console.error('Product update error:', error);
    
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
      { error: 'Failed to update product' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product (admin/seller only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const id = params.id;
  
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Only allow the seller to delete their own products
    // In a real app, you might have admin roles that can delete any product
    if (existingProduct.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete product using Prisma
    await prisma.product.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
    
  } catch (error: any) {
    console.error('Product deletion error:', error);
    
    // Handle specific Prisma errors
    if (error.code) {
      switch (error.code) {
        // Foreign key constraint violation (e.g., product has related records)
        case 'P2003':
          return NextResponse.json(
            { error: `Cannot delete product with existing ${error.meta?.field_name || 'related records'}` }, 
            { status: 400 }
          );
          
        // Record not found
        case 'P2001':
          return NextResponse.json(
            { error: 'Product not found' }, 
            { status: 404 }
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
      { error: 'Failed to delete product' }, 
      { status: 500 }
    );
  }
}
