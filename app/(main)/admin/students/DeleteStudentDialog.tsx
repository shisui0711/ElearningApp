"use client";

import { Student } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteStudentMutation } from "./mutations";

type DeleteStudentDialogProps = {
  open: boolean;
  onClose: () => void;
  student: Student & { user: any; class?: any };
};

export default function DeleteStudentDialog({
  open,
  onClose,
  student,
}: DeleteStudentDialogProps) {
  const { isPending, mutate } = useDeleteStudentMutation(student);

  const handleDelete = () => {
    mutate(student.id, { onSuccess: onClose });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa sinh viên</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa sinh viên này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Họ tên
              </p>
              <p className="text-sm">{student.user.displayName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tên đăng nhập
              </p>
              <p className="text-sm">{student.user.username}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{student.user.email || "N/A"}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Đang xóa..." : "Xóa sinh viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 