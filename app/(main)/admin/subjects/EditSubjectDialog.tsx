"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { updateSubjectSchema, UpdateSubjectValues } from "@/lib/validation";
import { useUpdateSubjectMutation } from "./mutations";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PaginationResponse } from "@/types";

// Define interfaces
interface Department {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
}

type EditSubjectDialogProps = {
  open: boolean;
  onClose: () => void;
  subject: Subject;
};

export default function EditSubjectDialog({
  open,
  subject,
  onClose,
}: EditSubjectDialogProps) {
  // Fetch departments for the dropdown
  const { data: departments, isLoading: loadingDepartments } = useQuery< PaginationResponse<Department>>({
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

  const form = useForm<UpdateSubjectValues>({
    resolver: zodResolver(updateSubjectSchema),
    defaultValues: {
      id: subject.id,
      name: subject.name,
      description: subject.description || "",
      departmentId: subject.departmentId,
    },
  });

  const { isPending, mutate } = useUpdateSubjectMutation();
  
  useEffect(() => {
    form.reset({
      id: subject.id,
      name: subject.name,
      description: subject.description || "",
      departmentId: subject.departmentId,
    });
  }, [subject, form]);

  const onSubmit = async (values: UpdateSubjectValues) => {
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
          <DialogTitle>Chỉnh sửa môn học</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin cho môn học.
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
                    value={field.value}
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
                {isPending ? "Đang cập nhật..." : "Cập nhật môn học"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 