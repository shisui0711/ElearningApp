"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  ArrowLeft,
  Clock,
  FileText,
  Upload,
  ChevronRight,
  Award,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface AssignmentDetailProps {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    type: "EXAM" | "FILE_UPLOAD";
    fileType: string | null;
    examId: string | null;
    course: {
      id: string;
      name: string;
      teacher: {
        user: {
          displayName: string;
        };
      };
    };
    exam?: {
      id: string;
      title: string;
      duration: number;
    } | null;
    submissions: Array<{
      id: string;
      fileUrl: string | null;
      examAttemptId: string | null;
      grade: number | null;
      submittedAt: string;
      examAttempt?: {
        id: string;
        score: number | null;
        startedAt: string | null;
        finishedAt: string | null;
      } | null;
    }>;
  };
  studentId: string;
}

export default function AssignmentDetail({
  assignment,
  studentId,
}: AssignmentDetailProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"details" | "submission">("details");

  const dueDate = new Date(assignment.dueDate);
  const isDueDatePassed = isPast(dueDate);
  const hasSubmission = assignment.submissions.some((x) => x.fileUrl);
  const submission = hasSubmission ? assignment.submissions[0] : null;
  const isGraded = submission && submission.grade !== null;

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra thời hạn nộp bài
    if (isDueDatePassed) {
      toast.error("Bài tập đã hết hạn nộp");
      return;
    }

    // Kiểm tra loại file (nếu có yêu cầu)
    if (
      assignment.fileType &&
      assignment.fileType !== "*" &&
      !file.type.includes(assignment.fileType)
    ) {
      toast.error(
        `Loại file không hợp lệ. Yêu cầu: ${
          assignment.fileType === "application/pdf"
            ? "PDF"
            : assignment.fileType === "image/"
            ? "Hình ảnh"
            : assignment.fileType
        }`
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra khi nộp bài");
      }

      toast.success("Nộp bài thành công");
      router.refresh();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi nộp bài"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const startExam = async () => {
    if (!assignment.examId) {
      toast.error("Không tìm thấy bài kiểm tra");
      return;
    }

    try {
      // Tạo lần thi mới và liên kết với bài tập
      const response = await fetch(`/api/exams/${assignment.examId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra khi bắt đầu làm bài");
      }

      const data = await response.json();

      // Liên kết lần thi với bài tập
      await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examAttemptId: data.id,
        }),
      });

      // Chuyển hướng đến trang làm bài
      router.push(`/assignment/${assignment.id}/take/${data.id}`);
    } catch (error) {
      console.error("Error starting exam:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi bắt đầu làm bài"
      );
    }
  };

  const getFileTypeLabel = (fileType: string | null) => {
    if (!fileType || fileType === "*") return "Tất cả các loại file";
    if (fileType === "application/pdf") return "PDF";
    if (fileType === "image/") return "Hình ảnh";
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "Word Document";
    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
      return "Excel";
    if (fileType === "application/zip") return "ZIP";
    return fileType;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/course/${assignment.course.id}`}
          className="text-sm flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại khóa học: {assignment.course.name}
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{assignment.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center text-sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Hạn nộp: {format(dueDate, "dd/MM/yyyy HH:mm", { locale: vi })}
            </div>
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4" />
              {isDueDatePassed
                ? `Đã hết hạn ${formatDistanceToNow(dueDate, {
                    addSuffix: true,
                    locale: vi,
                  })}`
                : `Còn ${formatDistanceToNow(dueDate, { locale: vi })}`}
            </div>
          </CardDescription>
        </CardHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "details" | "submission")}
        >
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="submission">Bài nộp</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="p-6 pt-4">
            <div className="space-y-4">
              {assignment.description && (
                <div className="prose max-w-none">
                  <p>{assignment.description}</p>
                </div>
              )}

              <div className="bg-muted/40 rounded-lg p-4">
                <h3 className="font-medium mb-2">Thông tin bài tập</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <span className="font-medium mr-2">Loại bài tập:</span>
                    {assignment.type === "EXAM"
                      ? "Bài tập trắc nghiệm"
                      : "Bài tập nộp file"}
                  </li>

                  {assignment.type === "EXAM" && assignment.exam && (
                    <>
                      <li className="flex items-center text-sm">
                        <span className="font-medium mr-2">Bài kiểm tra:</span>
                        {assignment.exam.title}
                      </li>
                      <li className="flex items-center text-sm">
                        <span className="font-medium mr-2">
                          Thời gian làm bài:
                        </span>
                        {assignment.exam.duration} phút
                      </li>
                    </>
                  )}

                  {assignment.type === "FILE_UPLOAD" && (
                    <li className="flex items-center text-sm">
                      <span className="font-medium mr-2">
                        Loại file chấp nhận:
                      </span>
                      {getFileTypeLabel(assignment.fileType)}
                    </li>
                  )}

                  <li className="flex items-center text-sm">
                    <span className="font-medium mr-2">Giáo viên:</span>
                    {assignment.course.teacher.user.displayName}
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submission" className="p-6 pt-4">
            {hasSubmission ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Bài đã nộp</h3>
                    <p className="text-sm text-muted-foreground">
                      Nộp lúc:{" "}
                      {format(
                        new Date(submission!.submittedAt),
                        "dd/MM/yyyy HH:mm",
                        { locale: vi }
                      )}
                    </p>
                  </div>

                  {isGraded && (
                    <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                      <Award className="mr-2 h-5 w-5" />
                      <span className="font-medium">
                        {submission!.grade} điểm
                      </span>
                    </div>
                  )}
                </div>

                {assignment.type === "FILE_UPLOAD" && submission!.fileUrl && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-3 h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">File đã nộp</h4>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {submission!.fileUrl.split("/").pop()}
                          </p>
                        </div>
                      </div>

                      <Link href={submission!.fileUrl} target="_blank">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Tải xuống
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {assignment.type === "EXAM" && submission!.examAttempt && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="mr-3 h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">Bài kiểm tra đã nộp</h4>
                          <p className="text-sm text-muted-foreground">
                            {submission!.examAttempt.finishedAt
                              ? `Hoàn thành lúc: ${format(
                                  new Date(submission!.examAttempt.finishedAt),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: vi }
                                )}`
                              : "Chưa hoàn thành"}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/assignment/${assignment.id}/view/${
                          submission!.examAttemptId
                        }`}
                      >
                        <Button variant="outline" size="sm">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Xem kết quả
                        </Button>
                      </Link>
                    </div>

                    {submission!.examAttempt.score !== null && (
                      <div className="mt-4 flex items-center text-green-700">
                        <Award className="mr-2 h-5 w-5" />
                        <span className="font-medium">
                          Điểm số: {submission!.examAttempt.score}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!isDueDatePassed && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Bạn có thể nộp lại bài tập trước khi hết hạn
                    </p>

                    {assignment.type === "FILE_UPLOAD" ? (
                      <div className="flex items-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Đang tải lên...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Nộp lại
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={startExam}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Làm lại bài kiểm tra
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                {isDueDatePassed ? (
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-medium mb-1">
                      Bạn chưa nộp bài và đã hết hạn
                    </h3>
                    <p className="text-muted-foreground">
                      Bài tập đã hết hạn vào{" "}
                      {format(dueDate, "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bạn chưa nộp bài</h3>

                    {assignment.type === "FILE_UPLOAD" ? (
                      <div className="border-2 border-dashed rounded-lg p-8 max-w-md mx-auto">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">
                              Đang tải lên...
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-6">
                              Kéo và thả file vào đây, hoặc
                            </p>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Chọn file
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto">
                        <div className="border rounded-lg p-6 text-center mb-4">
                          <h4 className="font-medium mb-2">
                            {assignment.exam?.title || "Bài kiểm tra"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            Thời gian làm bài: {assignment.exam?.duration} phút
                          </p>
                          <Button onClick={startExam}>
                            Bắt đầu làm bài
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Lưu ý: Sau khi bắt đầu làm bài, bạn phải hoàn thành
                          trong thời gian quy định.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
