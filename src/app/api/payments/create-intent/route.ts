import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe from '@/lib/stripe';
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
    const amount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => 
        sum + item.price * item.quantity, 
      0
    );
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: user.id,
        addressId: addressId || '',
        items: JSON.stringify(items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        }))),
        saveAddress: address?.saveAddress ? 'true' : 'false',
        ...(address ? {
          addressName: address.name,
          addressStreet: address.street,
          addressCity: address.city,
          addressState: address.state,
          addressPostalCode: address.postalCode,
          addressCountry: address.country,
        } : {}),
      },
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
    
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' }, 
      { status: 500 }
    );
  }
}
