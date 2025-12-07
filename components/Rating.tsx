import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number; // 0 to 10
  size?: number;
  showText?: boolean;
}

export const Rating: React.FC<RatingProps> = ({ value, size = 16, showText = true }) => {
  // Convert 1-10 scale to 1-5 scale for stars
  const stars = value / 2;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-yellow-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= Math.round(stars) ? "currentColor" : "none"}
            className={star <= Math.round(stars) ? "text-yellow-500" : "text-gray-600"}
          />
        ))}
      </div>
      {showText && (
        <span className="text-sm font-bold ml-1 text-gray-300">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};