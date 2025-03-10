import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
          productId: item.id || item.productId,
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
    
    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: amount,
        status: 'PENDING',
        addressId: addressId || null,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.id || item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
    
    // Store the order ID in the payment intent metadata
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...paymentIntent.metadata,
        orderId: order.id
      }
    });
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id
    }, { status: 200 });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    
    // Handle different Stripe error types
    if (error.type) {
      switch (error.type) {
        case 'StripeCardError':
          // Card errors like card declined, insufficient funds, etc.
          return NextResponse.json(
            { error: `Payment failed: ${error.message}` }, 
            { status: 400 }
          );
          
        case 'StripeRateLimitError':
          // Too many requests made to the API too quickly
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' }, 
            { status: 429 }
          );
          
        case 'StripeInvalidRequestError':
          // Invalid parameters were supplied to Stripe's API
          return NextResponse.json(
            { error: `Invalid request: ${error.message}` }, 
            { status: 400 }
          );
          
        case 'StripeAPIError':
          // An error occurred internally with Stripe's API
          return NextResponse.json(
            { error: 'Stripe API error. Please try again later.' }, 
            { status: 500 }
          );
          
        case 'StripeConnectionError':
          // Some kind of error occurred during the HTTPS communication
          return NextResponse.json(
            { error: 'Service unavailable. Please try again later.' }, 
            { status: 503 }
          );
          
        case 'StripeAuthenticationError':
          // Authentication with Stripe's API failed
          return NextResponse.json(
            { error: 'Authentication with payment service failed.' }, 
            { status: 500 }
          );
          
        default:
          // Handle any other Stripe error types
          return NextResponse.json(
            { error: 'Payment service error. Please try again later.' }, 
            { status: 500 }
          );
      }
    }
    
    // Handle non-Stripe errors
    return NextResponse.json(
      { error: 'Failed to create payment intent' }, 
      { status: 500 }
    );
  }
}
