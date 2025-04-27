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
import { Textarea } from "@/components/ui/textarea";
import { createSubjectSchema, CreateSubjectValues } from "@/lib/validation";
import { useCreateSubjectMutation } from "./mutations";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PaginationResponse } from "@/types";

// Define department interface
interface Department {
  id: string;
  name: string;
}

type CreateSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateSubjectDialog({
  open,
  onClose,
}: CreateSubjectDialogProps) {
  const { isPending, mutate } = useCreateSubjectMutation();

  // Fetch departments for the dropdown
  const { data: departments, isLoading: loadingDepartments } = useQuery<
    PaginationResponse<Department>
  >({
    queryKey: ["departments-all"],
    queryFn: async () => {
      const response = await axios.get("/api/departments", {
        params: {
          pageSize: 100,
          pageNumber: 1,
        },
      });
      return response.data;
    },
  });

  const form = useForm<CreateSubjectValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: "",
    },
  });

  const onSubmit = async (values: CreateSubjectValues) => {
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
          <DialogTitle>Tạo môn học mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết cho môn học mới.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên môn học</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên môn học" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập mô tả môn học" 
                      className="resize-none" 
                      {...field} 
                    />
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
                      {departments?.data && departments?.data?.map((department) => (
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
                {isPending ? "Đang tạo..." : "Tạo môn học"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 