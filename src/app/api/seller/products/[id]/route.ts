import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/seller/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true, sellerApproved: true },
    });
    
    if (!user?.isSeller) {
      return NextResponse.json({ error: 'User is not a seller' }, { status: 403 });
    }
    
    // Check if product exists and belongs to the seller
    const product = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    if (product.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to delete this product' }, { status: 403 });
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// GET /api/seller/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true },
    });
    
    if (!user?.isSeller) {
      return NextResponse.json({ error: 'User is not a seller' }, { status: 403 });
    }
    
    // Get product
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Check if product belongs to the seller
    if (product.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to view this product' }, { status: 403 });
    }
    
    // Map product to application model
    const mappedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || undefined,
      images: product.images,
      category: product.category.toLowerCase(),
      condition: product.condition.toLowerCase().replace('_', '-'),
      tags: product.tags,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      featured: product.featured,
      approved: product.approved,
    };
    
    return NextResponse.json({ product: mappedProduct });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/seller/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Check if user is a seller and is approved
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSeller: true, sellerApproved: true },
    });
    
    if (!user?.isSeller) {
      return NextResponse.json({ error: 'User is not a seller' }, { status: 403 });
    }
    
    if (!user.sellerApproved) {
      return NextResponse.json({ error: 'Seller is not approved yet' }, { status: 403 });
    }
    
    // Check if product exists and belongs to the seller
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    if (existingProduct.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'You do not have permission to update this product' }, { status: 403 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice || null,
        images: data.images,
        category: data.category.toUpperCase() as any,
        condition: data.condition.toUpperCase().replace('-', '_') as any,
        tags: data.tags,
        approved: false, // Reset approval status when product is updated
      },
    });
    
    // Map product to application model
    const mappedProduct = {
      id: updatedProduct.id,
      title: updatedProduct.title,
      description: updatedProduct.description,
      price: updatedProduct.price,
      discountPrice: updatedProduct.discountPrice || undefined,
      images: updatedProduct.images,
      category: updatedProduct.category.toLowerCase(),
      condition: updatedProduct.condition.toLowerCase().replace('_', '-'),
      tags: updatedProduct.tags,
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString(),
      featured: updatedProduct.featured,
      approved: updatedProduct.approved,
    };
    
    return NextResponse.json({ success: true, product: mappedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
