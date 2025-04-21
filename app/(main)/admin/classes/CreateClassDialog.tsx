"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClassSchema, CreateClassValues } from "@/lib/validation";
import { useCreateClassMutation } from "./mutations";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Define department interface
interface Department {
  id: string;
  name: string;
}

type CreateClassDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateClassDialog({
  open,
  onClose,
}: CreateClassDialogProps) {
  const { isPending, mutate } = useCreateClassMutation();

  // Fetch departments for the dropdown
  const { data: departments, isLoading: loadingDepartments } = useQuery<Department[]>({
    queryKey: ["departments-all"],
    queryFn: async () => {
      const response = await axios.get("/api/departments/all");
      return response.data;
    },
  });

  const form = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      departmentId: "",
    },
  });

  const onSubmit = async (values: CreateClassValues) => {
    mutate(values, { onSuccess: onClose });
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
          <DialogTitle>Tạo lớp mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết cho lớp mới.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên lớp</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên lớp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khoa</FormLabel>
                  <Select
                    disabled={loadingDepartments}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khoa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo lớp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
