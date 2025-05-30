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
  Award,
  Download,
  Loader2,
  ArrowRight,
  Eye,
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
    type: "FILE_UPLOAD";
    fileType: string | null;
    course: {
      id: string;
      name: string;
      teacher: {
        user: {
          displayName: string;
        };
      };
    };
    submissions: Array<{
      id: string;
      fileUrl: string | null;
      grade: number | null;
      submittedAt: string;
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

          <TabsContent value="details" className="mt-0">
            <CardContent className="pt-6">
              {assignment.description && (
                <div className="mb-6 prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                  />
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Loại bài tập:</span>
                  <span>
                    {assignment.type === "FILE_UPLOAD"
                      ? "Nộp tập tin"
                      : assignment.type === "EXAM"
                      ? "Bài kiểm tra trắc nghiệm"
                      : "Bài tập trắc nghiệm"}
                  </span>
                </div>

                {assignment.type === "FILE_UPLOAD" && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Loại file yêu cầu:</span>
                    <span>{getFileTypeLabel(assignment.fileType)}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="grid gap-2 flex-1 w-full">
                {assignment.type === "FILE_UPLOAD" && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isDueDatePassed}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tải lên...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {hasSubmission ? "Nộp lại bài tập" : "Nộp bài tập"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </TabsContent>

          <TabsContent value="submission" className="mt-0">
            <CardContent className="pt-6">
              {!hasSubmission ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Bạn chưa nộp bài tập này
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Hãy nộp bài trước thời hạn{" "}
                    {format(dueDate, "dd/MM/yyyy HH:mm", { locale: vi })}.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Nộp bài tập
                  </Button>
                </div>
              ) : submission ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Thời gian nộp:</span>
                      <span>
                        {submission &&
                          format(
                            new Date(submission.submittedAt),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: vi,
                            }
                          )}
                      </span>
                    </div>

                    {isGraded && (
                      <div className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Điểm số:</span>
                        <span className="font-bold">{submission.grade}</span>
                      </div>
                    )}
                  </div>

                  {assignment.type === "FILE_UPLOAD" && submission.fileUrl && (
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="border-t border-border p-4 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">File đã nộp</span>
                          </div>
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Tải xuống
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
