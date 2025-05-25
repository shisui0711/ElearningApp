"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Search, Trash2, Users, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  AnimatedCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/animated-card";
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
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ExamWithDetail, PaginationResponse } from "@/types";
import CreateExamButton from "./CreateExamButton";
import { useRouter } from "next/navigation";
import { useAnimation } from "@/provider/AnimationProvider";

export default function ExamsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();
  const { gsap, isReady } = useAnimation();
  const searchInputRef = useRef<HTMLDivElement>(null);
  const examListRef = useRef<HTMLDivElement>(null);

  // Animation for the list when it loads
  useEffect(() => {
    if (!isReady || !examListRef.current) return;

    const examCards = examListRef.current.querySelectorAll(".exam-card");

    gsap.fromTo(
      examCards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      }
    );

    return () => {
      gsap.killTweensOf(examCards);
    };
  }, [isReady, gsap, examListRef.current]);

  const { data, isLoading, error } = useQuery<
    PaginationResponse<ExamWithDetail>
  >({
    queryKey: ["exams", pageNumber, pageSize, searchQuery],
    queryFn: async () => {
      const response = await axios.get(
        `/api/exams?page=${pageNumber}&pageSize=${pageSize}&search=${searchQuery}`
      );
      return response.data;
    },
  });

  if (error)
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20 text-center">
        <p className="text-destructive font-medium mb-4">
          Có lỗi xảy ra khi tải dữ liệu
        </p>
        <AnimatedButton
          variant="destructive"
          onClick={() => router.refresh()}
          animationVariant="hover"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Tải lại dữ liệu
        </AnimatedButton>
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

      if (!res.ok) throw new Error("Không thể xóa bài kiểm tra");

      toast.success("Đã xóa thành công bài kiểm tra");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa bài kiểm tra");
    }
  };

  return (
    <div className="space-y-6">
      <div
        ref={searchInputRef}
        className="flex justify-between items-center bg-card/60 p-4 rounded-lg backdrop-blur-sm border"
      >
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài kiểm tra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/60 border-input/60 focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-60 bg-card/60 rounded-lg backdrop-blur-sm border p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      ) : !exams.length ? (
        <div className="flex flex-col items-center justify-center h-60 bg-card/60 rounded-lg backdrop-blur-sm border p-6">
          <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Chưa có bài kiểm tra nào được tạo. Tạo bài kiểm tra mới để bắt đầu.
          </p>
          <CreateExamButton />
        </div>
      ) : (
        <div ref={examListRef} className="space-y-4">
          {exams.map((exam) => (
            <AnimatedCard
              key={exam.id}
              className="exam-card border hover:border-primary/50 transition-colors duration-300"
              animationVariant="none"
              gradientBorder={false}
            >
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">
                      {exam.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {exam.questions.length} câu hỏi
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end">
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      asChild
                      animationVariant="hover"
                    >
                      <Link href={`/admin/exams/${exam.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        <span className="hidden md:block">Chỉnh sửa</span>
                      </Link>
                    </AnimatedButton>
                    <AssignExamButton examId={exam.id} examTitle={exam.title} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <AnimatedButton
                          variant="destructive"
                          size="sm"
                          animationVariant="hover"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="hidden md:block">Xóa</span>
                        </AnimatedButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl text-gradient-3">
                            Bạn có chắc chắn?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Thao tác này sẽ xóa vĩnh viễn bài kiểm tra này và
                            tất cả các câu hỏi liên quan. Không thể hoàn tác
                            hành động này.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <AnimatedButton
                              variant="destructive"
                              onClick={() => handleDelete(exam.id)}
                              animationVariant="hover"
                            >
                              Xóa
                            </AnimatedButton>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {exam.questions.length > 0 ? (
                    <p>Bài kiểm tra có {exam.questions.length} câu hỏi</p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      Bài kiểm tra chưa có câu hỏi nào
                    </p>
                  )}
                </div>
              </CardContent>
            </AnimatedCard>
          ))}

          <div className="mt-8 bg-card/60 p-4 rounded-lg backdrop-blur-sm border">
            <PaginationControls
              pagination={pagination}
              onPageChange={setPageNumber}
              onPageSizeChange={handlePageSizeChange}
              itemCount={exams.length}
              itemName="bài kiểm tra"
            />
          </div>
        </div>
      )}
    </div>
  );
}
