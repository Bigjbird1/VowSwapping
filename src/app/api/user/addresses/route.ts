import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(5, 'Postal code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to view your addresses' },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching your addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to add an address' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // If this is the default address, unset any existing default
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If this is the first address, make it default regardless
    const addressCount = await prisma.address.count({
      where: {
        userId: session.user.id,
      },
    });

    const isDefault = addressCount === 0 ? true : validatedData.isDefault || false;

    // Create the address with the user ID
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        street: validatedData.street,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isDefault,
      },
    });

    // Return the created address with status 201
    return NextResponse.json(
      {
        message: 'Address added successfully',
        address,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }

    // Log the error for debugging
    console.error('Add address error:', error);
    
    // Return a more detailed error message for testing
    return NextResponse.json(
      { 
        message: 'An error occurred while adding your address',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
