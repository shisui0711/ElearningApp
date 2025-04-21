"use client";

import React, { useState } from "react";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LessonWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface DeleteLessonDialogProps {
  lesson: LessonWithDetails;
  courseId: string;
}

export const DeleteLessonDialog = ({
  lesson,
  courseId,
}: DeleteLessonDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Đã xảy ra lỗi khi xóa bài học");
      }

      toast.success("Đã xóa bài học thành công!");
      router.push(`/manage-courses/${courseId}`);
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi xóa bài học");
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button>
          <Trash className="h-4 w-4" />
          Xóa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
          <AlertDialogDescription>
            Hành động này không thể hoàn tác. Bài học{" "}
            <span className="font-semibold">{lesson.title}</span> và tất cả tài
            liệu trong bài học này sẽ bị xóa vĩnh viễn khỏi hệ thống.
            <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Lưu ý:</strong> Bài học này có {lesson.documents.length}{" "}
              tài liệu sẽ bị xóa cùng.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading ? "Đang xóa..." : "Xóa bài học"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
