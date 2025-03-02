import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isSeller: true, sellerApproved: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a seller
    if (!user.isSeller) {
      return NextResponse.json(
        { message: 'You are not registered as a seller' },
        { status: 403 }
      );
    }

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: {
        sellerId: user.id,
      },
    });

    // Get all order items for seller's products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          sellerId: user.id,
        },
      },
      include: {
        order: true,
        product: true,
      },
    });

    // Calculate stats
    const orderIds = new Set();
    let totalRevenue = 0;
    let pendingOrders = 0;

    orderItems.forEach(item => {
      orderIds.add(item.orderId);
      totalRevenue += item.price * item.quantity;
      
      if (item.order.status === OrderStatus.PENDING || item.order.status === OrderStatus.PROCESSING) {
        pendingOrders++;
      }
    });

    return NextResponse.json({
      totalProducts,
      totalOrders: orderIds.size,
      pendingOrders,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching seller stats' },
      { status: 500 }
    );
  }
}
