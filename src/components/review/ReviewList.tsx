import React from 'react';
import { Review } from '@/store/reviewStore';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: Review[];
  showProduct?: boolean;
  showSeller?: boolean;
  emptyMessage?: string;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  showProduct = false,
  showSeller = false,
  emptyMessage = 'No reviews yet',
}) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  // Count ratings by star
  const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
  reviews.forEach((review) => {
    const index = Math.min(Math.max(Math.floor(review.rating) - 1, 0), 4);
    ratingCounts[index]++;
  });

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <StarRating rating={averageRating} size={24} />
              <span className="ml-2 text-xl font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="ml-2 text-gray-500">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-xs">
            {ratingCounts.map((count, index) => {
              const stars = 5 - index;
              const percentage = (count / reviews.length) * 100;
              return (
                <div key={stars} className="flex items-center text-sm mb-1">
                  <span className="w-8 text-right mr-2">{stars}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right ml-2">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showProduct={showProduct}
            showSeller={showSeller}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
