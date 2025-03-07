import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * NOTE: This is a temporary implementation using client-side state management.
 * Once the database migration for the Wishlist model is successfully applied,
 * this should be updated to use Prisma for database persistence.
 * 
 * The client-side implementation with Zustand will handle the actual wishlist
 * management for now, and this API endpoint will just return success responses
 * to maintain the API contract.
 */

// GET /api/user/wishlist/[productId] - Check if product is in wishlist
export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { productId } = params;

    // Check if product is in wishlist
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId
      }
    });

    return NextResponse.json(
      { inWishlist: !!wishlistItem },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to check wishlist status' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/wishlist/[productId] - Remove product from wishlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { productId } = params;

    // Find the wishlist item
    const wishlistItem = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId
      }
    });

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 }
      );
    }

    // Remove from wishlist
    await prisma.wishlist.delete({
      where: {
        id: wishlistItem.id
      }
    });

    return NextResponse.json(
      { message: 'Product removed from wishlist' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove product from wishlist' },
      { status: 500 }
    );
  }
}
