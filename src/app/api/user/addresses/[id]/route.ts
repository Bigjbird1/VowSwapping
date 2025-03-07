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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to view address details' },
        { status: 401 }
      );
    }

    const addressId = params.id;

    // Fetch the address
    const address = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    if (!address) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    // Check if the address belongs to the user
    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to view this address' },
        { status: 403 }
      );
    }

    return NextResponse.json({ address }, { status: 200 });
  } catch (error) {
    console.error('Get address error:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the address' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to update an address' },
        { status: 401 }
      );
    }

    const addressId = params.id;
    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // Check if address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to update this address' },
        { status: 403 }
      );
    }

    // If this is the default address, unset any existing default
    if (validatedData.isDefault && !existingAddress.isDefault) {
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

    const updatedAddress = await prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        name: validatedData.name,
        street: validatedData.street,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json(
      {
        message: 'Address updated successfully',
        address: updatedAddress,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }

    console.error('Update address error:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating your address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'You must be logged in to delete an address' },
        { status: 401 }
      );
    }

    const addressId = params.id;

    // Check if address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: {
        id: addressId,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this address' },
        { status: 403 }
      );
    }

    // Delete the address
    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    // If this was the default address and there are other addresses, make another one default
    if (existingAddress.isDefault) {
      const anotherAddress = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (anotherAddress) {
        await prisma.address.update({
          where: {
            id: anotherAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return NextResponse.json(
      { message: 'Address deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting your address' },
      { status: 500 }
    );
  }
}
