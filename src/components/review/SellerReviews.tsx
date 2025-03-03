'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useReviewStore, Review } from '@/store/reviewStore';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface SellerReviewsProps {
  sellerId: string;
}

const SellerReviews: React.FC<SellerReviewsProps> = ({ sellerId }) => {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { setSellerReviews, getSellerReviews } = useReviewStore();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews/seller/${sellerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        setReviews(data);
        setSellerReviews(sellerId, data);
      } catch (err) {
        setError('Failed to load reviews. Please try again later.');
        console.error('Error fetching reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [sellerId, setSellerReviews]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    // Refresh reviews
    fetch(`/api/reviews/seller/${sellerId}`)
      .then(response => response.json())
      .then(data => {
        setReviews(data);
        setSellerReviews(sellerId, data);
      })
      .catch(err => {
        console.error('Error refreshing reviews:', err);
      });
  };

  // Check if user has already reviewed this seller
  const hasUserReviewed = session?.user?.id && reviews.some(review => review.reviewerId === session.user.id);
  
  // Prevent seller from reviewing themselves
  const isCurrentUserSeller = session?.user?.id === sellerId;

  return (
    <div className="mt-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Seller Reviews</h2>
        
        {session?.user && !hasUserReviewed && !isCurrentUserSeller && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Review this Seller
          </button>
        )}
      </div>
      
      {showReviewForm && (
        <ReviewForm
          sellerId={sellerId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      ) : (
        <ReviewList reviews={reviews} emptyMessage="Be the first to review this seller!" />
      )}
    </div>
  );
};

export default SellerReviews;
