"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  Edit,
  FileText,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import UserAvatar from "@/components/UserAvatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import EditAssignmentDialog from "./EditAssignmentDialog";
import GradeSubmissionDialog from "./GradeSubmissionDialog";
import { toast } from "sonner";
import { SubmissionWithDetails } from "@/types";

export const assignmentTypes = [
  {
    value: "FILE_UPLOAD",
    label: "Bài tập nộp file",
  },
  {
    value: "EXAM",
    label: "Bài kiểm tra trắc nghiệm",
  },
  {
    value: "QUIZ",
    label: "Bài tập trắc nghiệm",
  },
];

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const courseId = params.courseId as string;
  const assignmentId = params.id as string;

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/assignments/${assignmentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch assignment details");
        }

        const data = await response.json();
        setAssignment(data);

        // Fetch submissions
        const submissionsResponse = await fetch(
          `/api/assignments/${assignmentId}/submissions`
        );

        if (submissionsResponse.ok) {
          const submissionsData = await submissionsResponse.json();
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error("Error fetching assignment details:", error);
        toast.error("Không thể tải thông tin bài tập. Vui lòng thử lại sau.")
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, toast]);

  // Handle assignment deletion
  const handleDeleteAssignment = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      toast.success("Đã xóa bài tập thành công");

      // Navigate back to course page
      router.push(`/manage-courses/${courseId}`);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Không thể xóa bài tập. Vui lòng thử lại sau.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài tập</h1>
          <Button asChild>
            <Link href={`/manage-courses/${courseId}`}>Quay lại</Link>
          </Button>
        </div>
      </div>
    );
  }

  console.log(submissions)

  return (
    <div className="container py-8 mx-auto px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/manage-courses" className="hover:text-primary">
          Quản lý khóa học
        </Link>
        <span>/</span>
        <Link
          href={`/manage-courses/${courseId}`}
          className="hover:text-primary"
        >
          {assignment.course.name}
        </Link>
        <span>/</span>
        <span>Bài tập</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge
              variant={assignment.type === "EXAM" ? "destructive" : "secondary"}
            >
              {assignment.type === "EXAM" ? "Trắc nghiệm" : "Nộp file"}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Hạn nộp:{" "}
                {format(new Date(assignment.dueDate), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <EditAssignmentDialog
            assignment={assignment}
            onSuccess={(updatedAssignment) => setAssignment(updatedAssignment)}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa bài tập</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa bài tập này? Hành động này không thể
                  hoàn tác và sẽ xóa tất cả bài nộp của sinh viên.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAssignment}>
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Chi tiết bài tập</TabsTrigger>
          <TabsTrigger value="submissions">
            Bài nộp
            {submissions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {submissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài tập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Mô tả
                </h3>
                <p className="whitespace-pre-line">
                  {assignment.description || "Không có mô tả"}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Loại bài tập
                  </h3>
                  <p className="font-medium">
                    {assignment.type === "EXAM" ? "Trắc nghiệm" : "Nộp file"}
                  </p>
                  {assignment.type === "EXAM" && assignment.exam && (
                    <div className="mt-1">
                      <Badge variant="outline">
                        {assignment.exam.title} ({assignment.exam.duration}{" "}
                        phút)
                      </Badge>
                    </div>
                  )}
                  {assignment.type === "FILE_UPLOAD" && assignment.fileType && (
                    <div className="mt-1">
                      <Badge variant="outline">
                        {assignment.fileType === "application/pdf"
                          ? "PDF"
                          : assignment.fileType ===
                            "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          ? "Word Document"
                          : assignment.fileType}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Giao cho
                  </h3>
                  <div className="font-medium">
                    {assignment.class ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Lớp: {assignment.class.name}</span>
                      </div>
                    ) : (
                      <span>Sinh viên cụ thể</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách bài nộp</CardTitle>
              <CardDescription>
                Xem và chấm điểm các bài nộp của sinh viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có bài nộp</h3>
                  <p className="text-muted-foreground">
                    Hiện chưa có sinh viên nộp bài cho bài tập này.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sinh viên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian nộp</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              size="sm"
                              avatarUrl={submission.student.user.avatarUrl}
                            />
                            <div>
                              <div>{submission.student.user.displayName}</div>
                              <div className="text-xs text-muted-foreground">
                                {submission.student.class?.name || ""}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.fileUrl ? (
                            <Badge variant="default">Đã nộp</Badge>
                          ) : (
                            <Badge variant="outline">Chưa nộp</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.submittedAt
                            ? format(
                                new Date(submission.submittedAt),
                                "dd/MM/yyyy HH:mm",
                                { locale: vi }
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {submission.grade !== null ? (
                            <span className="font-medium">
                              {submission.grade}/10
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {submission.fileUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Tải xuống"
                              >
                                <a
                                  href={submission.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}

                            {submission.fileUrl && (
                              <GradeSubmissionDialog
                                submission={submission}
                                assignmentId={assignmentId}
                                onSuccess={(updatedSubmission) => {
                                  setSubmissions((prev) =>
                                    prev.map((sub) =>
                                      sub.id === updatedSubmission.id
                                        ? updatedSubmission
                                        : sub
                                    )
                                  );
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
