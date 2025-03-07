import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import StarRating from './StarRating';
import { useReviewStore } from '@/store/reviewStore';

interface ReviewFormProps {
  productId?: string;
  sellerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  sellerId,
  onSuccess,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addProductReview, addSellerReview } = useReviewStore();

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <p className="text-center">
          Please{' '}
          <a href="/auth/signin" className="text-blue-600 hover:underline">
            sign in
          </a>{' '}
          to leave a review.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!productId && !sellerId) {
      setError('Invalid review target');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        rating,
        comment: comment.trim() || undefined,
      };

      let response;

      if (productId) {
        response = await fetch(`/api/reviews/product/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        });
      } else if (sellerId) {
        response = await fetch(`/api/reviews/seller/${sellerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData),
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || 'Failed to submit review');
      }

      const newReview = await response.json();

      // Update local state
      if (productId) {
        addProductReview(productId, newReview);
      } else if (sellerId) {
        addSellerReview(sellerId, newReview);
      }

      // Reset form
      setRating(0);
      setComment('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {productId ? 'Review this product' : 'Review this seller'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div data-testid="star-rating">
            <input
              type="range"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              data-testid="star-rating-input"
            />
            <span>Current rating: {rating}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Review (optional)
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
