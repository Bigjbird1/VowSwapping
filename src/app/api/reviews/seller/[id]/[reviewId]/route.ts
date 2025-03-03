import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for review update
const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

// GET /api/reviews/seller/[id]/[reviewId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const { id: sellerId, reviewId } = params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        sellerId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/seller/[id]/[reviewId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update a review' },
        { status: 401 }
      );
    }

    const { id: sellerId, reviewId } = params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        sellerId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author of the review
    if (review.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own reviews' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = reviewUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { rating, comment } = validationResult.data;

    // Update the review
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
    });

    // Update seller rating
    const sellerReviews = await prisma.review.findMany({
      where: {
        sellerId,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / sellerReviews.length;
    const ratingsCount = sellerReviews.length;

    await prisma.user.update({
      where: {
        id: sellerId,
      },
      data: {
        sellerRating: averageRating,
        sellerRatingsCount: ratingsCount,
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/seller/[id]/[reviewId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to delete a review' },
        { status: 401 }
      );
    }

    const { id: sellerId, reviewId } = params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        sellerId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author of the review
    if (review.reviewerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    // Update seller rating
    const sellerReviews = await prisma.review.findMany({
      where: {
        sellerId,
      },
      select: {
        rating: true,
      },
    });

    if (sellerReviews.length > 0) {
      const totalRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / sellerReviews.length;
      const ratingsCount = sellerReviews.length;

      await prisma.user.update({
        where: {
          id: sellerId,
        },
        data: {
          sellerRating: averageRating,
          sellerRatingsCount: ratingsCount,
        },
      });
    } else {
      // If no reviews left, reset rating
      await prisma.user.update({
        where: {
          id: sellerId,
        },
        data: {
          sellerRating: null,
          sellerRatingsCount: 0,
        },
      });
    }

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
