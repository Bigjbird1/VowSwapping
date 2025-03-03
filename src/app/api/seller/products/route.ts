import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for product creation
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().positive('Price must be positive'),
  discountPrice: z.number().positive('Discount price must be positive').optional(),
  category: z.enum(['dresses', 'accessories', 'decorations', 'other']),
  condition: z.enum(['new', 'like-new', 'good', 'fair']),
  tags: z.array(z.string()),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

// GET /api/seller/products - Get seller's products
export async function GET(request: NextRequest) {
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
    
    // Get seller's products
    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    // Map products to application model
    const mappedProducts = products.map(product => ({
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
    }));
    
    return NextResponse.json({ products: mappedProducts });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/seller/products - Create a new product
export async function POST(request: NextRequest) {
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
    
    // Parse and validate request body
    const data = await request.json();
    const validationResult = productSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid product data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      title, 
      description, 
      price, 
      discountPrice, 
      images, 
      category, 
      condition, 
      tags 
    } = validationResult.data;
    
    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        discountPrice: discountPrice || null,
        images,
        category: category.toUpperCase() as any,
        condition: condition.toUpperCase().replace('-', '_') as any,
        tags,
        sellerId: session.user.id,
        approved: false, // Products need admin approval
      },
    });
    
    return NextResponse.json({
      success: true,
      product: {
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
        approved: product.approved,
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
