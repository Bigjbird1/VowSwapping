import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  version: z.number().optional(), // Version for optimistic concurrency control
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isSeller: true,
        sellerApproved: true,
        shopName: true,
        version: true, // Include version in the response
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Profile fetch error:', error);

    // Handle session expiration errors
    if (error.message?.includes('Session expired')) {
      return NextResponse.json(
        { error: 'Session expired. Please login again' },
        { status: 401 }
      );
    }

    // Existing database error handling
    if (error.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database timeout. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching your profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update your profile' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Get the current user to check the version
    const currentUser = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        version: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If client provided a version, check it against the current version
    if (validatedData.version !== undefined && currentUser.version !== validatedData.version) {
      return NextResponse.json(
        { 
          error: 'Version conflict. The profile has been updated by another request. Please refresh and try again.',
          currentVersion: currentUser.version
        },
        { status: 409 }
      );
    }

    // Update the user with version increment
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
        ...(validatedData.version !== undefined && { version: validatedData.version }),
      },
      data: {
        name: validatedData.name,
        version: { increment: 1 }, // Increment the version
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          version: updatedUser.version, // Include the new version
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Profile update error:', error);

    // Handle Prisma errors
    if (error.code) {
      switch (error.code) {
        case 'P2025': // Record not found
          return NextResponse.json(
            { error: 'Version conflict. The profile has been updated by another request.' },
            { status: 409 }
          );
        case 'P2024': // Timeout
          return NextResponse.json(
            { error: 'Database timeout. Please try again later.' },
            { status: 500 }
          );
        default:
          return NextResponse.json(
            { error: 'Database error. Please try again later.' },
            { status: 500 }
          );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while updating your profile' },
      { status: 500 }
    );
  }
}
