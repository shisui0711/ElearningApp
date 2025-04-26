"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteSubjectMutation } from "./mutations";

interface Subject {
  id: string;
  name: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
}

type DeleteSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  subject: Subject;
};

export default function DeleteSubjectDialog({
  open,
  onClose,
  subject,
}: DeleteSubjectDialogProps) {
  const { isPending, mutate } = useDeleteSubjectMutation(subject);

  const handleDelete = () => {
    mutate(subject.id, {
      onSuccess: () => {
        onClose();
      },
    });
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
          <DialogTitle>Xác nhận xóa môn học</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa môn học{" "}
            <span className="font-medium text-foreground">"{subject.name}"</span>?
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa môn học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 