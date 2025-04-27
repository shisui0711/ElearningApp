"use client";

import { useState } from "react";
import { toast } from "sonner";

// UI Components
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
}

export default function DeleteSubjectDialog({
  subject,
  open,
  onClose,
}: {
  subject: Subject;
  open: boolean;
  onClose: () => void;
}) {
  const { isPending, mutate } = useDeleteSubjectMutation(subject);

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa môn học</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa môn học "{subject.name}"?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => mutate(subject.id, { onSuccess: onClose })}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa môn học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 