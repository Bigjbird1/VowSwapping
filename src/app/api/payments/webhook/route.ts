import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
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
    const headersList = headers();
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
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      
      // Specific error message for signature verification failures
      if (err.type === 'StripeSignatureVerificationError') {
        return NextResponse.json(
          { error: 'Invalid webhook signature. Check Stripe webhook configuration.' },
          { status: 400 }
        );
      }
      
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
    
    return NextResponse.json({ received: true }, { status: 200 });
    
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
  if (!metadata || !metadata.orderId) {
    console.error('Missing orderId in payment intent metadata');
    return;
  }
  
  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: metadata.orderId },
    });
    
    if (!order) {
      console.error(`Order not found: ${metadata.orderId}`);
      return;
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { status: 'PAID' },
    });
    
  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;
  if (!metadata || !metadata.orderId) {
    console.error('Missing orderId in payment intent metadata');
    return;
  }
  
  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: metadata.orderId },
    });
    
    if (!order) {
      console.error(`Order not found: ${metadata.orderId}`);
      return;
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: { status: 'PAYMENT_FAILED' },
    });
    
    console.error('Payment failed for order:', metadata.orderId);
  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}
