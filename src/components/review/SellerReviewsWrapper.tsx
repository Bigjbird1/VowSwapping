'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the SellerReviews component dynamically
const SellerReviews = dynamic(() => import('@/components/review/SellerReviews'), {
  ssr: false,
  loading: () => (
    <div className="mt-16" data-testid="seller-reviews">
      <h2 className="text-2xl font-bold mb-6">Seller Reviews</h2>
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Loading reviews...</p>
      </div>
    </div>
  )
});

interface SellerReviewsWrapperProps {
  sellerId: string;
}

export default function SellerReviewsWrapper({ sellerId }: SellerReviewsWrapperProps) {
  return (
    <Suspense fallback={
      <div className="mt-16" data-testid="seller-reviews">
        <h2 className="text-2xl font-bold mb-6">Seller Reviews</h2>
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading reviews...</p>
        </div>
      </div>
    }>
      <SellerReviews sellerId={sellerId} />
    </Suspense>
  );
}
