import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, Clock, XCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

interface CourseCompletionStatusProps {
  courseId: string;
}

const CourseCompletionStatus = ({ courseId }: CourseCompletionStatusProps) => {
  const router = useRouter();
  
  // Fetch completion status
  const { data, isLoading } = useQuery({
    queryKey: ['courseCompletion', courseId],
    queryFn: async () => {
      const response = await axios.get(`/api/course-completions?courseId=${courseId}`);
      return response.data;
    },
  });
  
  if (isLoading) {
    return <Progress value={0} className="w-full h-2" />;
  }
  
  const { allLessonsCompleted, hasRated, isFullyCompleted } = data || {};
  
  // Calculate completion percentage
  let completionPercentage = 0;
  if (allLessonsCompleted && hasRated) {
    completionPercentage = 100;
  } else if (allLessonsCompleted) {
    completionPercentage = 75;
  } else {
    // If we had lesson count data we could calculate more precisely
    completionPercentage = 50;
  }
  
  const handleGoToCourse = () => {
    router.push(`/course/${courseId}`);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-sm font-medium">
          Tiến độ hoàn thành
        </div>
        <div className="text-sm text-muted-foreground">
          {completionPercentage}%
        </div>
      </div>
      
      <Progress value={completionPercentage} className="h-2 mb-3" />
      
      <div className="flex flex-wrap gap-2 text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full 
                ${allLessonsCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Bài học</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {allLessonsCompleted 
                ? 'Đã hoàn thành tất cả bài học' 
                : 'Chưa hoàn thành tất cả bài học'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full 
                ${hasRated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <Star className="h-3.5 w-3.5" />
                <span>Đánh giá</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasRated 
                ? 'Đã đánh giá khóa học' 
                : allLessonsCompleted 
                  ? 'Vui lòng đánh giá khóa học để hoàn thành' 
                  : 'Hoàn thành tất cả bài học trước khi đánh giá'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full 
                ${isFullyCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Hoàn thành</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isFullyCompleted 
                ? 'Khóa học đã hoàn thành' 
                : 'Khóa học chưa hoàn thành'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {!isFullyCompleted && allLessonsCompleted && !hasRated && (
        <Button onClick={handleGoToCourse} size="sm" className="w-full mt-2">
          Đánh giá để hoàn thành
        </Button>
      )}
    </div>
  );
};

export default CourseCompletionStatus; 