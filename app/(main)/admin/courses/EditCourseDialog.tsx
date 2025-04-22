"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateCourseSchema } from "@/lib/validation";

interface EditCourseDialogProps {
  open: boolean;
  onClose: () => void;
  course: any;
  onSuccess?: () => void;
}

export default function EditCourseDialog({
  open,
  onClose,
  course,
  onSuccess,
}: EditCourseDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get department and teacher data for dropdowns
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await axios.get("/api/departments");
      return response.data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await axios.get("/api/teachers");
      return response.data;
    },
  });

  const form = useForm({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      id: course.id,
      name: course.name || "",
      description: course.description || "",
      imageUrl: course.imageUrl || "",
      departmentId: course.departmentId || "",
    },
  });

  useEffect(() => {
    if (course) {
      form.reset({
        id: course.id,
        name: course.name || "",
        description: course.description || "",
        imageUrl: course.imageUrl || "",
        departmentId: course.departmentId || "",
      });
    }
  }, [course, form]);

  const onSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      await axios.put("/api/courses", values);
      toast.success("Khóa học đã được cập nhật thành công");
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data || "Đã xảy ra lỗi");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho khóa học.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khóa học</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên khóa học" {...field} />
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
                      placeholder="Nhập mô tả khóa học"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL hình ảnh</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập URL hình ảnh khóa học"
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
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      {...field}
                    >
                      <option value="">Chọn khoa</option>
                      {departments?.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 