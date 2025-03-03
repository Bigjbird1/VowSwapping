'use client';

import dynamic from 'next/dynamic';

// Import the SellerReviews component dynamically
const SellerReviews = dynamic(() => import('@/components/review/SellerReviews'));

interface SellerReviewsWrapperProps {
  sellerId: string;
}

export default function SellerReviewsWrapper({ sellerId }: SellerReviewsWrapperProps) {
  return <SellerReviews sellerId={sellerId} />;
}
