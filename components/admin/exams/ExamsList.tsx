"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import PaginationControls from "@/components/PaginationControls";
import AssignExamButton from "./AssignExamButton";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ExamWithDetail, PaginationResponse } from "@/types";
import CreateExamButton from "./CreateExamButton";
import { useRouter } from "next/navigation";

export default function ExamsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  const { data, isLoading, error } = useQuery<
    PaginationResponse<ExamWithDetail>
  >({
    queryKey: ["departments", pageNumber, pageSize],
    queryFn: async () => {
      const response = await axios.get(
        `/api/exams?page=${pageNumber}&pageSize=${pageSize}&search=${searchQuery}`
      );
      return response.data;
    },
  });

  if (error)
    return (
      <div>
        <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
        <Button variant="destructive" onClick={() => router.refresh()}>
          Tải lại
        </Button>
      </div>
    );

  const exams = data?.data || [];
  const pagination = data?.pagination || {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1); // Reset to first page when changing page size
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete exam");

      toast.success("Exam deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete exam");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Đang tải...</p>
        </div>
      ) : !exams.length ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">
            Chưa có bài kiểm tra nào được tạo
          </p>
          <CreateExamButton />
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{exam.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        <span className="hidden md:block">Chỉnh sửa</span>
                      </Link>
                    </Button>
                    <AssignExamButton examId={exam.id} examTitle={exam.title} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden md:block">Xóa</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                          <AlertDialogDescription>
                          Thao tác này sẽ xóa vĩnh viễn bài kiểm tra này và tất cả các câu hỏi liên quan. Không thể hoàn tác hành động này.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(exam.id)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {exam.questions.length} câu hỏi
                </div>
              </CardContent>
            </Card>
          ))}

          <PaginationControls
            pagination={pagination}
            onPageChange={setPageNumber}
            onPageSizeChange={handlePageSizeChange}
            itemCount={exams.length}
            itemName="bài kiểm tra"
          />
        </div>
      )}
    </div>
  );
}
