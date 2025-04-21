"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Eye, FileCheck, TimerIcon } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface ExamAttempt {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  score: number | null;
  exam: {
    id: string;
    title: string;
    description: string;
    duration: number;
  };
  answers: {
    question: {
      points: number;
    }
  }[];
}

export default function AssignmentPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch("/api/student/assignments");
        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }
        const data = await response.json();
        setAssignments(data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  const getExamStatus = (attempt: ExamAttempt) => {
    if (attempt.finishedAt) {
      return {
        label: "Đã hoàn thành",
        color: "bg-green-100 text-green-800",
      };
    } else if (attempt.startedAt && !attempt.finishedAt) {
      return {
        label: "Đang thi",
        color: "bg-blue-100 text-blue-800",
      };
    } else {
      return {
        label: "Chưa bắt đầu",
        color: "bg-gray-100 text-gray-800",
      };
    }
  };

  const { mutate } = useMutation({
    mutationFn: async (attemptId: string) => {
      await axios.post(`/api/student/exams/${attemptId}/start`);
      return attemptId;
    },
    onSuccess(attemptId: string){
      router.push(`/assignment/${attemptId}/take`);
    },
    onError(){
      toast.error("Có lỗi xảy ra. Vui lòng thử lại");
    }
  })

  const handleViewExam = (attemptId: string) => {
    router.push(`/assignment/${attemptId}/view`);
  };

  const handleStartExam = (attemptId: string) => {
    mutate(attemptId)
  };

  const handleContinueExam = (attemptId: string) => {
    router.push(`/assignment/${attemptId}/take`);
  };

  return (
    <div className="container py-6 space-y-6 mx-auto px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bài kiểm tra được giao</h1>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Không có bài kiểm tra nào được giao.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const status = getExamStatus(assignment);
            const totalScore = assignment.answers.reduce((sum,item) => sum + item.question.points,0)
            return (
              <Card key={assignment.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    {assignment.exam.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-sm">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      <span className="text-muted-foreground">
                        {assignment.startedAt
                          ? `Đã bắt đầu ${formatTimeAgo(new Date(assignment.startedAt))}`
                          : "Chưa bắt đầu"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <TimerIcon className="mr-2 h-4 w-4" />
                      <span className="text-muted-foreground">
                        Thời gian: {assignment.exam.duration} phút
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Badge className={status.color}>{status.label}</Badge>
                      {assignment.score !== null && (
                        <Badge className="ml-2 bg-purple-100 text-purple-800">
                          Điểm: {parseFloat(((assignment.score / totalScore) * 10).toFixed(1))}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    {assignment.finishedAt ? (
                      <Button variant="outline" onClick={() => handleViewExam(assignment.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Xem kết quả
                      </Button>
                    ) : assignment.startedAt && !assignment.finishedAt ? (
                      <Button onClick={() => handleContinueExam(assignment.id)}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Tiếp tục
                      </Button>
                    ) : (
                      <Button onClick={() => handleStartExam(assignment.id)}>
                        Bắt đầu làm bài
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
