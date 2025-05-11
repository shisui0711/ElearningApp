'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import in a client component is fine
const CourseRating = dynamic(() => import('@/components/CourseRating'), {
  loading: () => <div className="animate-pulse h-[300px] w-full bg-gray-200 rounded-lg"></div>
});

interface CourseRatingWrapperProps {
  courseId: string;
}

const CourseRatingWrapper = ({ courseId }: CourseRatingWrapperProps) => {
  return <CourseRating courseId={courseId} />;
};

export default CourseRatingWrapper; 