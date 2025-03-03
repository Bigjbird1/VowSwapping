import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Stripe } from 'stripe';

// Configure route handler for raw body access
export const dynamic = 'force-dynamic';

async function getBodyAsString(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const concatenated = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );
  
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(concatenated);
}

export async function POST(request: Request) {
  try {
    const body = await getBodyAsString(request);
    const headersList = await headers();
    const signature = headersList.get('stripe-signature') || '';
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      // Add more event handlers as needed
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;
  if (!metadata || !metadata.userId || !metadata.items) {
    console.error('Missing metadata in payment intent');
    return;
  }
  
  try {
    // Parse items from metadata
    const items = JSON.parse(metadata.items);
    
    // Calculate total
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => 
        sum + item.price * item.quantity, 
      0
    );
    
    // Handle address if needed
    let orderAddressId = metadata.addressId;
    
    if (!orderAddressId && metadata.saveAddress === 'true') {
      // Create new address
      const newAddress = await prisma.address.create({
        data: {
          userId: metadata.userId,
          name: metadata.addressName || '',
          street: metadata.addressStreet || '',
          city: metadata.addressCity || '',
          state: metadata.addressState || '',
          postalCode: metadata.addressPostalCode || '',
          country: metadata.addressCountry || '',
          isDefault: false,
        },
      });
      
      orderAddressId = newAddress.id;
    }
    
    // Create order
    await prisma.order.create({
      data: {
        userId: metadata.userId,
        total,
        status: 'PROCESSING', // Payment succeeded, order is now processing
        addressId: orderAddressId || null,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
    
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Log payment failure
  console.error('Payment failed:', paymentIntent.id);
  
  // You could create a failed order record or notify the user
  // For now, we'll just log it
}
