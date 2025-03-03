import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import StarRating from './StarRating';
import { Review } from '@/store/reviewStore';

interface ReviewCardProps {
  review: Review;
  showProduct?: boolean;
  showSeller?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showProduct = false,
  showSeller = false,
}) => {
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <div className="mr-3">
            <StarRating rating={review.rating} size={16} />
          </div>
          <div>
            <p className="font-semibold">{review.reviewerName}</p>
            <p className="text-gray-500 text-sm">{formattedDate}</p>
          </div>
        </div>
      </div>

      {review.comment && (
        <div className="mt-2 mb-3">
          <p className="text-gray-700">{review.comment}</p>
        </div>
      )}

      {showProduct && review.productId && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Product reviewed:</p>
          <div className="flex items-center">
            {review.product?.images?.[0] && (
              <div className="relative w-12 h-12 mr-3 rounded overflow-hidden">
                <Image
                  src={review.product.images[0]}
                  alt={review.product.title || 'Product image'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="font-medium">{review.product?.title || 'Product'}</p>
          </div>
        </div>
      )}

      {showSeller && review.sellerId && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Seller reviewed:</p>
          <div className="flex items-center">
            {review.seller?.image && (
              <div className="relative w-10 h-10 mr-3 rounded-full overflow-hidden">
                <Image
                  src={review.seller.image}
                  alt={review.seller.name || 'Seller'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="font-medium">
              {review.seller?.shopName || review.seller?.name || 'Seller'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
