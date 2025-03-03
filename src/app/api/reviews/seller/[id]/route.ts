import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for review creation
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// GET /api/reviews/seller/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;

    // Check if seller exists
    const seller = await prisma.user.findUnique({
      where: { 
        id: sellerId,
        isSeller: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get all reviews for the seller
    const reviews = await prisma.review.findMany({
      where: {
        sellerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews/seller/[id]
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to leave a review' },
        { status: 401 }
      );
    }

    const sellerId = params.id;

    // Check if seller exists
    const seller = await prisma.user.findUnique({
      where: { 
        id: sellerId,
        isSeller: true,
        sellerApproved: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Prevent users from reviewing themselves
    if (sellerId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot review yourself' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = reviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { rating, comment } = validationResult.data;

    // Check if user has already reviewed this seller
    const existingReview = await prisma.review.findFirst({
      where: {
        sellerId,
        reviewerId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this seller' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        sellerId,
        reviewerId: session.user.id,
        reviewerName: session.user.name || 'Anonymous',
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

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating seller review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
