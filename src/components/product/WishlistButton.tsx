'use client';

import { useState } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  product: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function WishlistButton({
  product,
  className = '',
  size = 'md',
  showText = false,
}: WishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const inWishlist = isInWishlist(product.id);
  
  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  return (
    <button
      className={`rounded-full transition-all duration-200 ${
        inWishlist 
          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${sizeClasses[size]} ${className}`}
      onClick={handleToggleWishlist}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <div className="flex items-center">
        <Heart
          size={iconSizes[size]}
          className={`transition-all duration-200 ${inWishlist ? 'fill-rose-600' : isHovered ? 'fill-gray-300' : ''}`}
        />
        {showText && (
          <span className="ml-2 text-sm font-medium">
            {inWishlist ? 'Saved' : 'Save'}
          </span>
        )}
      </div>
    </button>
  );
}
