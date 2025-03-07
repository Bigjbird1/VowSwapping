import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * NOTE: This implementation now uses Prisma for database persistence.
 * The Wishlist model has been added to the database schema.
 */

// GET /api/user/wishlist - Get user's wishlist
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to view your wishlist' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch wishlist items from database with product details
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                shopName: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ wishlistItems });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/user/wishlist - Add product to wishlist
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to add items to your wishlist' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is already in wishlist
    const existingWishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId
      }
    });

    if (existingWishlistItem) {
      return NextResponse.json(
        { message: 'Product is already in wishlist' },
        { status: 200 }
      );
    }

    // Add product to wishlist
    await prisma.wishlist.create({
      data: {
        userId,
        productId
      }
    });

    return NextResponse.json(
      { message: 'Product added to wishlist' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add product to wishlist' },
      { status: 500 }
    );
  }
}
