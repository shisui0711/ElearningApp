"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteCourseMutation } from "./mutations";
import { CourseWithDetails } from "@/types";

interface DeleteCourseDialogProps {
  open: boolean;
  onClose: () => void;
  course: CourseWithDetails;
}

export default function DeleteCourseDialog({
  open,
  onClose,
  course,
}: DeleteCourseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const deleteCourseMutation = useDeleteCourseMutation();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteCourseMutation.mutateAsync(course.id);
      onClose();
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa khóa học</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa khóa học &quot;{course.name}&quot;? Thao tác này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 