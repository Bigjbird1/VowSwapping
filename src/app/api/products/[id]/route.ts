import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProductCategory } from '@/types/product';

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
    
  } catch (error) {
    console.error('Error fetching product:', error);
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
    
  } catch (error) {
    console.error('Product update error:', error);
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
    
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' }, 
      { status: 500 }
    );
  }
}
