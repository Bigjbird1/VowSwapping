import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        isSeller: true,
        sellerApproved: true,
        shopName: true,
        sellerSince: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isSeller: user.isSeller || false,
      sellerApproved: user.sellerApproved || false,
      shopName: user.shopName || null,
      sellerSince: user.sellerSince || null,
    });
  } catch (error) {
    console.error('Error fetching seller status:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching seller status' },
      { status: 500 }
    );
  }
}
