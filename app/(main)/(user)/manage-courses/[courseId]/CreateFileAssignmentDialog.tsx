"use client";

import React, { useState } from "react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/DatePicker";

interface CreateFileAssignmentDialogProps {
  courseId: string;
  classes: {
    id: string;
    name: string;
  }[];
  students: {
    id: string;
    user: {
      displayName: string;
    };
  }[];
}

const formSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề bài tập"),
  description: z.string().optional(),
  dueDate: z.date({
    required_error: "Vui lòng chọn hạn nộp bài",
  }),
  fileType: z.string(),
  assignFor: z.enum(["CLASS", "STUDENTS"], {
    required_error: "Vui lòng chọn đối tượng giao bài",
  }),
  classId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateFileAssignmentDialog({
  courseId,
  classes,
  students,
}: CreateFileAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      fileType: "application/pdf",
      assignFor: "CLASS",
      studentIds: [],
      dueDate: tomorrow
    },
  });

  const assignFor = form.watch("assignFor");

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const payload = {
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        type: "FILE_UPLOAD", // Hardcoded for file assignments
        fileType: values.fileType,
        classId: values.assignFor === "CLASS" ? values.classId : null,
        studentIds: values.assignFor === "STUDENTS" ? values.studentIds : [],
      };

      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create assignment");
      }

      toast.success("Đã tạo bài tập nộp file thành công");
      setIsOpen(false);
      form.reset();
      
      // Tải lại trang để hiển thị bài tập mới
      window.location.reload();
    } catch (error) {
      console.error("Error creating file assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create file assignment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Tạo bài tập nộp file
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài tập nộp file mới</DialogTitle>
          <DialogDescription>
            Tạo bài tập nộp file cho khóa học và giao cho học sinh
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề bài tập</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề bài tập..." {...field} />
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
                  <FormLabel>Mô tả bài tập</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả chi tiết bài tập..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Hạn nộp bài</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Loại file được chấp nhận</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "application/pdf"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại file được chấp nhận" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Tất cả các file</SelectItem>
                          <SelectItem value="application/pdf">PDF</SelectItem>
                          <SelectItem value="image/">Hình ảnh</SelectItem>
                          <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                            Word Document
                          </SelectItem>
                          <SelectItem value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                            Excel
                          </SelectItem>
                          <SelectItem value="application/zip">ZIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Chỉ định loại file mà học viên được phép nộp
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giao bài tập cho</FormLabel>
                  <div className="flex space-x-4">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value === "CLASS"}
                          onCheckedChange={() =>
                            field.onChange("CLASS")
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Lớp học
                      </FormLabel>
                    </FormItem>

                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value === "STUDENTS"}
                          onCheckedChange={() =>
                            field.onChange("STUDENTS")
                          }
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Học sinh cụ thể
                      </FormLabel>
                    </FormItem>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {assignFor === "CLASS" && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chọn lớp</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp học" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((classItem) => (
                            <SelectItem
                              key={classItem.id}
                              value={classItem.id}
                            >
                              {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {assignFor === "STUDENTS" && (
              <FormField
                control={form.control}
                name="studentIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chọn học sinh</FormLabel>
                    <div className="border p-4 rounded-md max-h-40 overflow-y-auto">
                      {students.length > 0 ? (
                        students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center space-x-2 my-2"
                          >
                            <Checkbox
                              id={student.id}
                              checked={(field.value || []).includes(
                                student.id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([
                                    ...(field.value || []),
                                    student.id,
                                  ]);
                                } else {
                                  field.onChange(
                                    (field.value || []).filter(
                                      (id) => id !== student.id
                                    )
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={student.id}
                              className="text-sm cursor-pointer"
                            >
                              {student.user.displayName}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Không có học sinh nào đăng ký khóa học
                        </p>
                      )}
                    </div>

                    <div className="mt-2">
                      {(field.value || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(field.value || []).map((studentId) => {
                            const student = students.find(
                              (s) => s.id === studentId
                            );
                            return (
                              <div
                                key={studentId}
                                className="flex items-center bg-secondary rounded-md px-2 py-1"
                              >
                                <span className="text-sm">
                                  {student?.user.displayName}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={() => {
                                    field.onChange(
                                      (field.value || []).filter(
                                        (id) => id !== studentId
                                      )
                                    );
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Chọn học sinh để giao bài tập
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo bài tập"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 