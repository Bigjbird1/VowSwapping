import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { signIn } from 'next-auth/react';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const validatedData = signInSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Mark email as verified for development purposes
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    // Create a JWT token for the user
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret: process.env.NEXTAUTH_SECRET || 'default-secret',
    });

    // Set the session cookie
    const cookieExpires = new Date();
    cookieExpires.setDate(cookieExpires.getDate() + 30); // 30 days

    cookies().set({
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      value: token,
      expires: cookieExpires,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return NextResponse.json(
      { 
        message: 'Signed in successfully', 
        user: { id: user.id, email: user.email, name: user.name },
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sign-in after register error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'An error occurred during sign-in' },
      { status: 500 }
    );
  }
}
