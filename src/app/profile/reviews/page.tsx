'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Review, useReviewStore } from '@/store/reviewStore';
import ReviewCard from '@/components/review/ReviewCard';
import Link from 'next/link';

const UserReviewsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUserReviews, userReviews, deleteProductReview, deleteSellerReview } = useReviewStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile/reviews');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/reviews/user');
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        setReviews(data);
        setUserReviews(data);
      } catch (err) {
        setError('Failed to load your reviews. Please try again later.');
        console.error('Error fetching reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [status, setUserReviews]);

  const handleDeleteReview = async (review: Review) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      let endpoint = '';
      
      if (review.productId) {
        endpoint = `/api/reviews/product/${review.productId}/${review.id}`;
      } else if (review.sellerId) {
        endpoint = `/api/reviews/seller/${review.sellerId}/${review.id}`;
      } else {
        throw new Error('Invalid review type');
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete review');
      }
      
      // Update local state
      if (review.productId) {
        deleteProductReview(review.productId, review.id);
      } else if (review.sellerId) {
        deleteSellerReview(review.sellerId, review.id);
      }
      
      // Remove from current view
      setReviews(reviews.filter(r => r.id !== review.id));
      
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Reviews</h1>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  const productReviews = reviews.filter(review => review.productId);
  const sellerReviews = reviews.filter(review => review.sellerId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Reviews</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">You haven&apos;t written any reviews yet.</p>
          <p>
            <Link href="/products" className="text-blue-600 hover:underline">
              Browse products
            </Link>{' '}
            to find something to review.
          </p>
        </div>
      ) : (
        <div>
          {productReviews.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Product Reviews</h2>
              <div className="space-y-4">
                {productReviews.map(review => (
                  <div key={review.id} className="relative">
                    <ReviewCard review={review} showProduct={true} />
                    <button
                      onClick={() => handleDeleteReview(review)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
                      aria-label="Delete review"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sellerReviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Seller Reviews</h2>
              <div className="space-y-4">
                {sellerReviews.map(review => (
                  <div key={review.id} className="relative">
                    <ReviewCard review={review} showSeller={true} />
                    <button
                      onClick={() => handleDeleteReview(review)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
                      aria-label="Delete review"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserReviewsPage;
