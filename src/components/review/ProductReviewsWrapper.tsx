'use client';

import dynamic from 'next/dynamic';

// Import the ProductReviews component dynamically
const ProductReviews = dynamic(() => import('@/components/review/ProductReviews'));

interface ProductReviewsWrapperProps {
  productId: string;
}

export default function ProductReviewsWrapper({ productId }: ProductReviewsWrapperProps) {
  return <ProductReviews productId={productId} />;
}
