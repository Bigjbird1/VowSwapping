'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the ProductReviews component dynamically
const ProductReviews = dynamic(() => import('@/components/review/ProductReviews'), {
  ssr: false,
  loading: () => (
    <div className="mt-16" data-testid="product-reviews">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4">Loading reviews...</p>
      </div>
    </div>
  )
});

interface ProductReviewsWrapperProps {
  productId: string;
}

export default function ProductReviewsWrapper({ productId }: ProductReviewsWrapperProps) {
  return (
    <Suspense fallback={
      <div className="mt-16" data-testid="product-reviews">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading reviews...</p>
        </div>
      </div>
    }>
      <ProductReviews productId={productId} />
    </Suspense>
  );
}
