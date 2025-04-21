"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Course } from "@prisma/client";
import { toast } from "sonner";
import { CreateCourseValues, UpdateCourseValues } from "@/lib/validation";

export function useCreateCourseMutation(teacherId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCourseValues) => {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          teacherId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create course");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Khóa học đã được tạo thành công");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tạo khóa học");
    },
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCourseValues) => {
      const response = await fetch("/api/courses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update course");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Khóa học đã được cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật khóa học");
    },
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete course");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Khóa học đã được xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Lỗi khi xóa khóa học");
    },
  });
} 