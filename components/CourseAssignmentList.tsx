"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Award } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { vi } from "date-fns/locale";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  type: "EXAM" | "FILE_UPLOAD";
  examId: string | null;
  fileType: string | null;
  submissions: AssignmentSubmission[];
}

interface AssignmentSubmission {
  id: string;
  fileUrl: string | null;
  examAttemptId: string | null;
  grade: number | null;
  submittedAt: string;
}

interface CourseAssignmentListProps {
  courseId: string;
  isEnrolled: boolean;
}

export default function CourseAssignmentList({
  courseId,
  isEnrolled,
}: CourseAssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}/assignments`);

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const data = await response.json();
        setAssignments(data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setError("Không thể tải danh sách bài tập");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bài tập</CardTitle>
          <CardDescription>Đang tải danh sách bài tập...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bài tập</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bài tập</CardTitle>
          <CardDescription>Khóa học chưa có bài tập nào</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Hàm kiểm tra trạng thái bài tập
  const getAssignmentStatus = (assignment: Assignment) => {
    const hasSubmission =
      assignment.submissions && assignment.submissions.length > 0;
    const isDueDatePassed = isPast(new Date(assignment.dueDate));

    if (hasSubmission) {
      if (assignment.submissions[0].grade !== null) {
        return {
          status: "graded",
          label: "Đã chấm điểm",
          color: "bg-green-100 text-green-800",
        };
      }
      return {
        status: "submitted",
        label: "Đã nộp",
        color: "bg-blue-100 text-blue-800",
      };
    }

    if (isDueDatePassed) {
      return {
        status: "late",
        label: "Đã hết hạn",
        color: "bg-red-100 text-red-800",
      };
    }

    return {
      status: "pending",
      label: "Chưa nộp",
      color: "bg-yellow-100 text-yellow-800",
    };
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Bài tập</CardTitle>
        <CardDescription>Danh sách bài tập của khóa học</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const status = getAssignmentStatus(assignment);
            const submission =
              assignment.submissions && assignment.submissions[0];

            return (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg mb-1">
                      {assignment.title}
                    </h3>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={
                            assignment.type === "EXAM"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-cyan-100 text-cyan-800"
                          }
                        >
                          {assignment.type === "EXAM"
                            ? "Trắc nghiệm"
                            : "Nộp file"}
                        </Badge>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>
                          Hạn nộp:{" "}
                          {format(dueDate, "dd/MM/yyyy HH:mm", { locale: vi })}
                        </span>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        <span>
                          {isPast(dueDate)
                            ? `Đã hết hạn ${formatDistanceToNow(dueDate, {
                                addSuffix: true,
                                locale: vi,
                              })}`
                            : `Còn ${formatDistanceToNow(dueDate, {
                                locale: vi,
                              })}`}
                        </span>
                      </div>

                      <Badge className={status.color}>{status.label}</Badge>

                      {submission && submission.grade !== null && (
                        <div className="flex items-center text-xs font-medium">
                          <Award className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                          <span className="text-green-600">
                            {submission.grade} điểm
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    {isEnrolled && (
                      <Link href={`/assignment/${assignment.id}`} passHref>
                        <Button
                          size="sm"
                          variant={
                            status.status === "submitted" ||
                            status.status === "graded"
                              ? "outline"
                              : "default"
                          }
                        >
                          {assignment.type === "EXAM"
                            ? status.status === "submitted" ||
                              status.status === "graded"
                              ? "Xem bài làm"
                              : "Làm bài"
                            : status.status === "submitted" ||
                              status.status === "graded"
                            ? "Xem bài nộp"
                            : "Nộp bài"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
