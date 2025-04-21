"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteCourseDialogProps = {
  children: React.ReactNode;
  courseId: string;
  courseName: string;
  onCourseDeleted?: () => void;
};

export default function DeleteCourseDialog({
  children,
  courseId,
  courseName,
  onCourseDeleted,
}: DeleteCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Delete course using the API
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      toast.success("Xóa khóa học thành công");
      setOpen(false);
      onCourseDeleted && onCourseDeleted();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Không thể xóa khóa học");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa khóa học</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa khóa học "{courseName}" không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Đang xóa..." : "Xóa khóa học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 