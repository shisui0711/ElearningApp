import React from 'react';
import { Star } from 'lucide-react';

interface CourseRatingDisplayProps {
  rating: number;
  totalRatings: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CourseRatingDisplay = ({ 
  rating, 
  totalRatings, 
  showCount = true,
  size = 'md'
}: CourseRatingDisplayProps) => {
  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSizes[size]} ${
              star <= Math.round(rating)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className={`ml-2 ${textSizes[size]} text-muted-foreground`}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
};

export default CourseRatingDisplay; 