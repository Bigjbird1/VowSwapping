import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProductCategory, ProductCondition } from '@/types/product';

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
    approved: dbProduct.approved,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isSeller: true, sellerApproved: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a seller
    if (!user.isSeller) {
      return NextResponse.json(
        { message: 'You are not registered as a seller' },
        { status: 403 }
      );
    }

    // Get seller products
    const products = await prisma.product.findMany({
      where: {
        sellerId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      products: products.map(mapDatabaseProductToAppProduct),
    });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching seller products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isSeller: true, sellerApproved: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is an approved seller
    if (!user.isSeller) {
      return NextResponse.json(
        { message: 'You are not registered as a seller' },
        { status: 403 }
      );
    }

    if (!user.sellerApproved) {
      return NextResponse.json(
        { message: 'Your seller account is pending approval' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      price, 
      discountPrice, 
      images, 
      category, 
      condition, 
      tags 
    } = body;
    
    // Validate required fields
    if (!title || !description || price === undefined || !images || !category || !condition) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create product
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
        sellerId: user.id,
        approved: false, // Products require approval by default
      },
    });

    return NextResponse.json({
      message: 'Product created successfully. It will be reviewed before being published.',
      product: mapDatabaseProductToAppProduct(product),
    });
  } catch (error) {
    console.error('Error creating seller product:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating the product' },
      { status: 500 }
    );
  }
}
