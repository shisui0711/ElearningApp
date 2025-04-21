"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

// Prisma and Validation
import { updateCourseSchema, UpdateCourseValues } from "@/lib/validation";

interface Course {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  departmentId: string;
  teacherId: string;
  department: {
    name: string;
  };
}

type EditCourseDialogProps = {
  children: React.ReactNode;
  course: Course;
  onCourseUpdated?: () => void;
};

export default function EditCourseDialog({
  children,
  course,
  onCourseUpdated,
}: EditCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const form = useForm<UpdateCourseValues>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      id: course.id,
      name: course.name,
      description: course.description || "",
      imageUrl: course.imageUrl || "",
      departmentId: course.departmentId,
    },
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Fetch departments from the server using server action or API route
        const response = await fetch('/api/departments');
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Không thể tải danh mục khóa học");
      }
    };

    fetchDepartments();
  }, []);

  // Update form values when course changes
  useEffect(() => {
    form.reset({
      id: course.id,
      name: course.name,
      description: course.description || "",
      imageUrl: course.imageUrl || "",
      departmentId: course.departmentId,
    });
  }, [course, form]);

  const onSubmit = async (values: UpdateCourseValues) => {
    setIsLoading(true);
    try {
      // Update course using server action or API route
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      toast.success("Cập nhật khóa học thành công");
      setOpen(false);
      form.reset();
      onCourseUpdated && onCourseUpdated();
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("Không thể cập nhật khóa học");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin khóa học của bạn.
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
                    <Input placeholder="Nhập mô tả khóa học" {...field} />
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
                    <Input placeholder="Nhập URL hình ảnh (tùy chọn)" {...field} />
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
                  <FormLabel>Danh mục</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((department) => (
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật..." : "Cập nhật khóa học"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 