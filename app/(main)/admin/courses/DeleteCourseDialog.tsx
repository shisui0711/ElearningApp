"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteCourseDialogProps {
  open: boolean;
  onClose: () => void;
  course: any;
  onSuccess?: () => void;
}

export default function DeleteCourseDialog({
  open,
  onClose,
  course,
  onSuccess,
}: DeleteCourseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/courses/${course.id}`);
      toast.success("Khóa học đã được xóa thành công");
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Đã xảy ra lỗi khi xóa khóa học");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Xác nhận xóa khóa học
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa khóa học "{course.name}"?
            <br />
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium">
            Thông tin khóa học:
          </p>
          <ul className="mt-2 text-sm text-muted-foreground">
            <li><span className="font-medium">Tên:</span> {course.name}</li>
            {course.description && (
              <li className="truncate">
                <span className="font-medium">Mô tả:</span> {course.description}
              </li>
            )}
            {course.department?.name && (
              <li>
                <span className="font-medium">Khoa:</span> {course.department.name}
              </li>
            )}
            {course.teacher?.user?.displayName && (
              <li>
                <span className="font-medium">Giáo viên:</span> {course.teacher.user.displayName}
              </li>
            )}
          </ul>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 