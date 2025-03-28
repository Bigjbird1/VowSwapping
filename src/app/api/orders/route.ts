import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { items, addressId, address } = data;
    
    if (!items || !items.length) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate total
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => 
        sum + item.price * item.quantity, 
      0
    );
    
    // Handle address
    let orderAddressId = addressId;
    
    // If a new address is provided and should be saved
    if (!addressId && address && address.saveAddress) {
      // Create new address
      const newAddress = await prisma.address.create({
        data: {
          userId: user.id,
          name: address.name,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: false, // Don't make it default automatically
        },
      });
      
      orderAddressId = newAddress.id;
    }
    
    // Use a transaction to ensure all operations succeed or fail together
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          status: 'PENDING',
          addressId: orderAddressId,
        },
      });
      
      // Create order items
      await tx.orderItem.createMany({
        data: items.map((item: { productId: string; quantity: number; price: number }) => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      
      // Get the complete order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          orderItems: true,
        },
      });
    });
    
    // Check if order was created successfully
    if (!order) {
      return NextResponse.json({ 
        error: 'Failed to create order' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      }
    });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Handle different error types with appropriate status codes
    if (error && typeof error === 'object') {
      // Prisma errors
      if (error.code) {
        switch (error.code) {
          // Unique constraint violation
          case 'P2002':
            return NextResponse.json(
              { error: 'Duplicate order detected' }, 
              { status: 400 }
            );
            
          // Foreign key constraint violation
          case 'P2003':
            const field = error.meta?.field_name || '';
            if (field.includes('addressId')) {
              return NextResponse.json(
                { error: 'Invalid address. The specified address does not exist.' }, 
                { status: 400 }
              );
            } else if (field.includes('productId')) {
              return NextResponse.json(
                { error: 'Invalid product. One or more products in your order do not exist.' }, 
                { status: 400 }
              );
            }
            return NextResponse.json(
              { error: 'Invalid reference in order data' }, 
              { status: 400 }
            );
            
          // Record not found
          case 'P2025':
            return NextResponse.json(
              { error: 'Required record not found' }, 
              { status: 400 }
            );
            
          // Database timeout
          case 'P2024':
            return NextResponse.json(
              { error: 'Database operation timed out. Please try again.' }, 
              { status: 500 }
            );
            
          // Default case for other Prisma errors
          default:
            return NextResponse.json(
              { error: 'Database error. Please try again later.' }, 
              { status: 500 }
            );
        }
      }
      
      // Message-based errors
      if (typeof error.message === 'string') {
        if (error.message.includes('payment') && error.message.includes('verification')) {
          // Payment verification failure
          return NextResponse.json(
            { error: 'Payment verification failed' }, 
            { status: 400 }
          );
        } else if (error.message.includes('inventory') || error.message.includes('stock')) {
          // Inventory issues
          return NextResponse.json(
            { error: 'Product is out of stock or unavailable in the requested quantity' }, 
            { status: 400 }
          );
        } else if (error.message.includes('transaction') || error.message.includes('rollback')) {
          // Transaction failures
          return NextResponse.json(
            { error: 'Transaction failed. Please try again.' }, 
            { status: 500 }
          );
        }
      }
    }
    
    // Default to 500 for unexpected errors
    return NextResponse.json(
      { error: 'Failed to create order' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user's orders
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ orders });
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    
    // Handle different error types with appropriate status codes
    if (error && typeof error === 'object') {
      // Prisma errors
      if (error.code === 'P2025') {
        // Record not found
        return NextResponse.json(
          { error: 'Required record not found' }, 
          { status: 404 }
        );
      }
      
      // Message-based errors
      if (typeof error.message === 'string') {
        if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          return NextResponse.json(
            { error: 'You do not have permission to access these orders' }, 
            { status: 403 }
          );
        }
      }
    }
    
    // Default to 500 for unexpected errors
    return NextResponse.json(
      { error: 'Failed to fetch orders' }, 
      { status: 500 }
    );
  }
}
