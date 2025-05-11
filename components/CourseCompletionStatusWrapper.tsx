'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import in a client component
const CourseCompletionStatus = dynamic(() => import('@/components/CourseCompletionStatus'), {
  loading: () => <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
});

interface CourseCompletionStatusWrapperProps {
  courseId: string;
}

const CourseCompletionStatusWrapper = ({ courseId }: CourseCompletionStatusWrapperProps) => {
  return <CourseCompletionStatus courseId={courseId} />;
};

export default CourseCompletionStatusWrapper; 