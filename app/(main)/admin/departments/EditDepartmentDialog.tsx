"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Department } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDepartmentSchema, UpdateDepartmentValues } from "@/lib/validation";
import { useUpdateDepartmentMutation } from "./mutations";
import Link from "next/link";


type EditDepartmentDialogProps = {
  open: boolean;
  onClose: () => void;
  department: Department;
};

export default function EditDepartmentDialog({
  open,
  department,
  onClose,
}: EditDepartmentDialogProps) {

  const form = useForm<UpdateDepartmentValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      name: department.name,
    },
  });

  const { isPending, mutate } = useUpdateDepartmentMutation();
  useEffect(() => {
    form.reset({
      name: department.name,
    });
  }, [department, form]);

  const onSubmit = async (values: UpdateDepartmentValues) => {
    mutate(values, { onSuccess: onClose});
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
          <DialogTitle>Chỉnh sửa khoa</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin cho khoa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khoa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên khoa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang cập nhật..." : "Cập nhật khoa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 