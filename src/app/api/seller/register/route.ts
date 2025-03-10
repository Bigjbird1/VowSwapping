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
        { error: 'Unauthorized', message: 'You must be logged in to register as a seller' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format. Please provide valid JSON.', message: 'Invalid request format. Please provide valid JSON.' },
        { status: 400 }
      );
    }

    // Validate data against schema
    try {
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
        const message = existingUser.sellerApproved 
          ? 'You are already registered as an approved seller' 
          : 'You are already pending approval';
        
        return NextResponse.json(
          { 
            error: `already registered`,
            message: message
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
          sellerLogo: validatedData.sellerLogo || null,
          sellerBanner: validatedData.sellerBanner || null,
          sellerSocial: sellerSocial as any, // Prisma expects JSON as any
          sellerSince: new Date(), // Set the registration date
        },
      });

      return NextResponse.json(
        {
          message: 'Seller registration successful',
          success: true,
          user: {
            id: updatedUser.id,
            isSeller: updatedUser.isSeller,
            sellerApproved: updatedUser.sellerApproved,
            shopName: updatedUser.shopName,
          }
        },
        { status: 200 }
      );
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = validationError.errors[0].message;
        return NextResponse.json({ error: `validation: ${errorMessage}`, message: `validation: ${errorMessage}` }, { status: 400 });
      }
      return NextResponse.json(
        { error: 'Invalid seller registration data', message: 'Invalid seller registration data' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message, message: error.errors[0].message }, { status: 400 });
    }

    console.error('Seller registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during seller registration', message: 'An error occurred during seller registration' },
      { status: 500 }
    );
  }
}
