'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

function OrderSuccessContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  
  const orderId = searchParams.get('orderId');
  
  // Redirect if no order ID is present
  useEffect(() => {
    if (mounted && !orderId) {
      router.push('/');
    }
  }, [mounted, orderId, router]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !orderId || status !== 'authenticated') {
    return <div className="container py-8">Loading...</div>;
  }
  
  return (
    <OrderSuccessDisplay orderId={orderId} />
  );
}

function OrderSuccessDisplay({ orderId }: { orderId: string }) {
  
  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
        
        <p className="text-gray-600 mb-8">
          Your order has been successfully placed. We've sent a confirmation email with all the details.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-2">Order Information</h2>
          <p className="text-gray-600 mb-1">Order ID: {orderId}</p>
          <p className="text-gray-600">
            You can track your order status in your{' '}
            <Link href="/profile/orders" className="text-primary-600 hover:text-primary-700">
              order history
            </Link>
            .
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/products"
            className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
          >
            Continue Shopping
          </Link>
          
          <Link
            href="/profile/orders"
            className="bg-white text-primary-600 border border-primary-600 px-6 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors"
          >
            View Your Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container py-8">Loading order details...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
