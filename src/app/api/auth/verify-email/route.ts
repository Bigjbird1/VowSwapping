import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Email verification request received');
    const body = await request.json();
    console.log('Verification request body:', body);
    
    const validatedData = verifyEmailSchema.parse(body);
    console.log('Verification token:', validatedData.token);

    // Find user with the verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: validatedData.token,
      },
    });

    if (!user) {
      console.log('Invalid verification token, no user found');
      return NextResponse.json(
        { message: 'Invalid verification token' },
        { status: 400 }
      );
    }

    console.log('User found for verification:', user.id, user.email);

    // Update user to mark email as verified
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verificationToken: null,
        },
      });
      console.log('User email verified successfully');
    } catch (dbError) {
      console.error('Database error during email verification:', dbError);
      throw dbError;
    }

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }

    console.error('Email verification error:', error);
    const errorMessage = error instanceof Error 
      ? `Verification error: ${error.message}` 
      : 'An error occurred during email verification';
      
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// Also support GET requests for direct link verification
export async function GET(request: NextRequest) {
  try {
    console.log('Email verification GET request received');
    const token = request.nextUrl.searchParams.get('token');
    console.log('Verification token from URL:', token);
    
    if (!token) {
      console.log('No token provided in URL');
      return NextResponse.redirect(new URL('/auth/error?error=missing_token', request.url));
    }

    // Find user with the verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      console.log('Invalid verification token, no user found');
      return NextResponse.redirect(new URL('/auth/error?error=invalid_token', request.url));
    }

    console.log('User found for verification:', user.id, user.email);

    // Update user to mark email as verified
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verificationToken: null,
        },
      });
      console.log('User email verified successfully');
    } catch (dbError) {
      console.error('Database error during email verification:', dbError);
      return NextResponse.redirect(new URL('/auth/error?error=database_error', request.url));
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verify-email?success=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=unknown', request.url));
  }
}
