import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const sellerRegistrationSchema = z.object({
  shopName: z.string().min(3, 'Shop name must be at least 3 characters'),
  shopDescription: z.string().min(20, 'Description must be at least 20 characters'),
  sellerBio: z.string().min(20, 'Bio must be at least 20 characters'),
  sellerLogo: z.string().optional(),
  sellerBanner: z.string().optional(),
  sellerSocial: z.object({
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to register as a seller' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = sellerRegistrationSchema.parse(body);

    // Check if user is already a seller
    const existingUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        isSeller: true,
        sellerApproved: true,
      },
    });

    if (existingUser?.isSeller) {
      return NextResponse.json(
        { 
          message: existingUser.sellerApproved 
            ? 'You are already an approved seller' 
            : 'Your seller application is already pending approval' 
        },
        { status: 400 }
      );
    }

    // Format social media links as JSON
    const sellerSocial = validatedData.sellerSocial 
      ? JSON.stringify(validatedData.sellerSocial)
      : null;

    // Update user with seller information
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        isSeller: true,
        sellerApproved: false, // Requires admin approval
        shopName: validatedData.shopName,
        shopDescription: validatedData.shopDescription,
        sellerBio: validatedData.sellerBio,
        sellerLogo: validatedData.sellerLogo,
        sellerBanner: validatedData.sellerBanner,
        sellerSocial: sellerSocial as any, // Prisma expects JSON as any
        sellerSince: new Date(), // Set the registration date
      },
    });

    return NextResponse.json(
      {
        message: 'Seller registration successful. Your application is pending approval.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }

    console.error('Seller registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during seller registration' },
      { status: 500 }
    );
  }
}
