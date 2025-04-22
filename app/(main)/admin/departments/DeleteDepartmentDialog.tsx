"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Department } from "@prisma/client";

// UI Components
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
import { useDeleteDepartmentMutation } from "./mutations";

export default function DeleteDepartmentDialog({
  department,
  open,
  onClose,
}: {
  department: Department;
  open: boolean;
  onClose: () => void;
}) {
  
  const {  isPending, mutate} = useDeleteDepartmentMutation()

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xóa khoa</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa khoa "{department.name}"?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => mutate(department.id, { onSuccess: onClose})}
            disabled={isPending}
          >
            {isPending ? "Đang xóa..." : "Xóa khoa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 