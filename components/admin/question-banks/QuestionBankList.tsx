"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { QuestionBankWithDetail, PaginationResponse } from "@/types";
import CreateQuestionBankButton from "./CreateQuestionBankButton";
import { useRouter } from "next/navigation";

export default function QuestionBankList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const router = useRouter();

  const { data, isLoading, error } = useQuery<
    PaginationResponse<QuestionBankWithDetail>
  >({
    queryKey: ["question-banks", pageNumber, pageSize, searchQuery],
    queryFn: async () => {
      const response = await axios.get(
        `/api/question-banks?page=${pageNumber}&pageSize=${pageSize}&search=${searchQuery}`
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

  const questionBanks = data?.data || [];
  console.log(questionBanks);
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
      const res = await fetch(`/api/question-banks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Không thể xóa ngân hàng câu hỏi");

      toast.success("Ngân hàng câu hỏi đã được xóa thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa ngân hàng câu hỏi");
    }
  };

  console.log(questionBanks);

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
      ) : !questionBanks.length ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">
            Không tìm thấy ngân hàng câu hỏi nào
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questionBanks.map((questionBank) => (
            <Card key={questionBank.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{questionBank.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/question-banks/${questionBank.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        <span className="hidden md:block">Chỉnh sửa</span>
                      </Link>
                    </Button>
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
                            onClick={() => handleDelete(questionBank.id)}
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
                  {questionBank.questions?.length || 0} câu hỏi
                </div>
              </CardContent>
            </Card>
          ))}

          <PaginationControls
            pagination={pagination}
            onPageChange={setPageNumber}
            onPageSizeChange={handlePageSizeChange}
            itemCount={questionBanks.length}
            itemName="bài kiểm tra"
          />
        </div>
      )}
    </div>
  );
}
