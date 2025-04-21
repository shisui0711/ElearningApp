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
import { useDeleteClassMutation } from "./mutations";

interface Class {
  id: string;
  name: string;
  departmentId: string;
}

export default function DeleteClassDialog({
  classItem,
  open,
  onClose,
}: {
  classItem: Class;
  open: boolean;
  onClose: () => void;
}) {
  const { isPending, mutate } = useDeleteClassMutation(classItem);

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa lớp</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa lớp "{classItem.name}"?
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
            onClick={() => mutate(classItem.id, { onSuccess: onClose })}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa lớp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
