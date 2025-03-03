import React from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  color = '#FFD700', // Gold color
  interactive = false,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (selectedRating: number) => {
    if (interactive && onChange) {
      onChange(selectedRating);
    }
  };

  const handleMouseEnter = (hoveredRating: number) => {
    if (interactive) {
      setHoverRating(hoveredRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const displayRating = hoverRating > 0 ? hoverRating : rating;
    
    // Full star
    if (starValue <= displayRating) {
      return (
        <FaStar
          key={index}
          size={size}
          color={color}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        />
      );
    }
    
    // Half star
    if (starValue - 0.5 <= displayRating) {
      return (
        <FaStarHalfAlt
          key={index}
          size={size}
          color={color}
          onClick={() => handleClick(starValue - 0.5)}
          onMouseEnter={() => handleMouseEnter(starValue - 0.5)}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        />
      );
    }
    
    // Empty star
    return (
      <FaRegStar
        key={index}
        size={size}
        color={color}
        onClick={() => handleClick(starValue)}
        onMouseEnter={() => handleMouseEnter(starValue)}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: interactive ? 'pointer' : 'default' }}
      />
    );
  };

  return (
    <div className="flex items-center">
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </div>
  );
};

export default StarRating;
