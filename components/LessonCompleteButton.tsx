"use client";
import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LessonWithDetails } from "@/types";
import { useRouter } from "next/navigation";
import { revalidatePath } from "next/cache";

interface LessonCompleteButtonProps {
  courseId: string;
  lessonId: string;
  studentId: string;
  progress: number;
  isCompleted: boolean;
}

const LessonCompleteButton = ({
  courseId,
  lessonId,
  studentId,
  progress,
  isCompleted,
}: LessonCompleteButtonProps) => {
  const router = useRouter();
  const { isPending, isError , mutate } = useMutation({
    mutationFn: async () => {
      await axios.post(
        `/api/lessons/completed`,
        {
          studentId,
          lessonId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
  });

  const { data: nextLesson, isLoading } = useQuery({
    queryKey: ["lesson","next",lessonId],
    queryFn: async () => {
      const response = await axios.get(`/api/lessons/${lessonId}/next`)
      return response.data as LessonWithDetails;
    }
  })

  const handleCompletedButton = () => {
    mutate();
    if(isError || !nextLesson) return;
    router.push(`/dashboard/courses/${courseId}/lessons/${nextLesson.id}`)
    router.refresh()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 hidden lg:block">
          <p>Tiến trình bài học</p>
        </div>
        <Progress value={progress} className="w-[60%] [&>div]:bg-emerald-600" />
        <Button
          onClick={handleCompletedButton}
          // disabled={isPending || progress < 80}
          disabled={isLoading || isPending || isCompleted}
          size="lg"
          variant="default"
          className={cn(
            "min-w-[200px] transition-all duration-200 ease-in-out",
            isCompleted
              ? "bg-slate-600 hover:bg-slate-500 text-black"
              : "bg-green-600 hover::bg-green-700 text-white"
          )}
        >
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          <CheckCircle className="size-4 mr-2" />
          {isCompleted ? "Đã hoàn thành" : "Hoàn thành"}
        </Button>
      </div>
    </div>
  );
};

export default LessonCompleteButton;
