"use client";

import { Teacher } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTeacherMutation } from "./mutations";

type DeleteTeacherDialogProps = {
  open: boolean;
  onClose: () => void;
  teacher: Teacher & { user: any };
};

export default function DeleteTeacherDialog({
  open,
  onClose,
  teacher,
}: DeleteTeacherDialogProps) {
  const { isPending, mutate } = useDeleteTeacherMutation(teacher);

  const handleDelete = () => {
    mutate(teacher.id, { onSuccess: onClose });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa giảng viên</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa giảng viên {teacher.user.displayName}?
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          Lưu ý: Không thể xóa giảng viên đã có khóa học. Vui lòng xóa tất cả các khóa học trước.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Hành động này không thể hoàn tác. Xóa giảng viên đồng thời cũng sẽ xóa tài khoản người dùng tương ứng.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 