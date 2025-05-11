import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/UserAvatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface CourseRatingProps {
  courseId: string;
}

const StarRating = ({ rating, onChange, readOnly = false }: { rating: number; onChange?: (rating: number) => void; readOnly?: boolean }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 ${
            star <= (hover || rating)
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-gray-300'
          } ${!readOnly ? 'cursor-pointer' : ''}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
        />
      ))}
    </div>
  );
};

const CourseRating = ({ courseId }: CourseRatingProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const queryClient = useQueryClient();

  // Fetch course ratings
  const { data, isLoading, error } = useQuery({
    queryKey: ['courseRatings', courseId],
    queryFn: async () => {
      const response = await axios.get(`/api/course-ratings?courseId=${courseId}`);
      return response.data;
    },
  });

  // Fetch course completion status
  const { data: completionData } = useQuery({
    queryKey: ['courseCompletion', courseId],
    queryFn: async () => {
      const response = await axios.get(`/api/course-completions?courseId=${courseId}`);
      return response.data;
    },
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      return axios.post('/api/course-ratings', {
        courseId,
        rating,
        review,
      });
    },
    onSuccess: () => {
      toast.success('Đánh giá thành công');
      setReview('');
      setRating(0);
      queryClient.invalidateQueries({ queryKey: ['courseRatings', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseCompletion', courseId] });
    },
    onError: (error) => {
      toast.error('Đánh giá thất bại');
    },
  });

  // Mark course as completed mutation
  const completeCourseMutation = useMutation({
    mutationFn: async () => {
      return axios.post('/api/course-completions', {
        courseId,
      });
    },
    onSuccess: () => {
      toast.success('Hoàn thành khóa học');
      queryClient.invalidateQueries({ queryKey: ['courseCompletion', courseId] });
    },
    onError: (error) => {
      toast.error('Hoàn thành khóa học thất bại');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao');
      return;
    }
    submitRatingMutation.mutate();
  };

  const handleComplete = () => {
    completeCourseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Không thể tải đánh giá. Vui lòng thử lại sau.
      </div>
    );
  }

  const hasRated = completionData?.hasRated;
  const isFullyCompleted = completionData?.isFullyCompleted;
  const canComplete = completionData?.canComplete;
  const allLessonsCompleted = completionData?.allLessonsCompleted;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Đánh giá khóa học</CardTitle>
        <CardDescription>
          {allLessonsCompleted && !hasRated 
            ? "Vui lòng đánh giá khóa học để hoàn thành" 
            : "Đánh giá của học viên về khóa học"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Rating Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={data?.stats?.averageRating || 0} readOnly />
            <span className="text-lg font-medium">{data?.stats?.averageRating?.toFixed(1) || 0}</span>
            <span className="text-muted-foreground">({data?.stats?.totalRatings || 0} đánh giá)</span>
          </div>
        </div>

        {/* Submit Rating Form */}
        {!hasRated && allLessonsCompleted && (
          <form onSubmit={handleSubmit} className="mb-8 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Đánh giá khóa học</h3>
            <div className="mb-4">
              <label className="block mb-2">Số sao của bạn</label>
              <StarRating rating={rating} onChange={setRating} />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Nhận xét của bạn (tùy chọn)</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                className="min-h-[100px]"
              />
            </div>
            <Button 
              type="submit" 
              disabled={submitRatingMutation.isPending || rating === 0}
              className="w-full"
            >
              {submitRatingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi đánh giá
            </Button>
          </form>
        )}

        {/* Complete Course Button */}
        {hasRated && allLessonsCompleted && !isFullyCompleted && (
          <div className="mb-8 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-medium mb-4">Hoàn thành khóa học</h3>
            <p className="mb-4">Bạn đã đánh giá khóa học. Nhấn nút bên dưới để hoàn thành khóa học.</p>
            <Button 
              onClick={handleComplete}
              disabled={completeCourseMutation.isPending}
              className="w-full"
            >
              {completeCourseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hoàn thành khóa học
            </Button>
          </div>
        )}

        {/* Course Completion Success */}
        {isFullyCompleted && (
          <div className="mb-8 border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="text-lg font-medium mb-2 text-green-800">Khóa học đã hoàn thành</h3>
            <p className="text-green-700">Chúc mừng! Bạn đã hoàn thành khóa học này.</p>
          </div>
        )}

        {/* List of Ratings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-2">Đánh giá từ học viên</h3>
          {data?.ratings && data.ratings.length > 0 ? (
            data.ratings.map((rating: any) => (
              <div key={rating.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <UserAvatar avatarUrl={rating.student.user.avatarUrl} />
                  <div>
                    <p className="font-medium">{rating.student.user.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
                <div className="mb-2">
                  <StarRating rating={rating.rating} readOnly />
                </div>
                {rating.review && <p className="text-gray-700">{rating.review}</p>}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Chưa có đánh giá nào.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseRating; 