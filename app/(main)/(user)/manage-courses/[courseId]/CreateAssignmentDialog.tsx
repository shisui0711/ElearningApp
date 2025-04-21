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
import { Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/DatePicker";

interface CreateAssignmentDialogProps {
  courseId: string;
  exams: {
    id: string;
    title: string;
    duration: number;
  }[];
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
  type: z.enum(["EXAM", "FILE_UPLOAD"], {
    required_error: "Vui lòng chọn loại bài tập",
  }),
  fileType: z.string().optional(),
  examId: z.string().optional(),
  assignFor: z.enum(["CLASS", "STUDENTS"], {
    required_error: "Vui lòng chọn đối tượng giao bài",
  }),
  classId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAssignmentDialog({
  courseId,
  exams,
  classes,
  students,
}: CreateAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today); // Tạo một bản sao để không thay đổi today
  tomorrow.setDate(tomorrow.getDate() + 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "FILE_UPLOAD",
      fileType: "application/pdf",
      assignFor: "CLASS",
      studentIds: [],
      dueDate: tomorrow
    },
  });

  const assignmentType = form.watch("type");
  const assignFor = form.watch("assignFor");

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const payload = {
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        type: values.type,
        fileType: values.type === "FILE_UPLOAD" ? values.fileType : null,
        examId: values.type === "EXAM" ? values.examId : null,
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

      toast.success("Đã tạo bài tập thành công");
      setIsOpen(false);
      form.reset();
      
      // Tải lại trang để hiển thị bài tập mới
      window.location.reload();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tạo bài tập
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài tập mới</DialogTitle>
          <DialogDescription>
            Tạo bài tập cho khóa học và giao cho học sinh
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
                    <DatePicker date={field.value} setDate={field.onChange}  />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Loại bài tập</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại bài tập" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FILE_UPLOAD">Nộp file</SelectItem>
                          <SelectItem value="EXAM">Trắc nghiệm</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {assignmentType === "FILE_UPLOAD" && (
              <FormField
                control={form.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem>
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
            )}

            {assignmentType === "EXAM" && (
              <FormField
                control={form.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bài kiểm tra</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bài kiểm tra" />
                        </SelectTrigger>
                        <SelectContent>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.title} ({exam.duration} phút)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Chọn bài kiểm tra trắc nghiệm để giao cho học sinh
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="assignFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giao bài tập cho</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đối tượng giao bài" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLASS">Lớp học</SelectItem>
                        <SelectItem value="STUDENTS">Sinh viên cụ thể</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    <FormLabel>Lớp học</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp học" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Bài tập sẽ được giao cho tất cả sinh viên trong lớp
                    </FormDescription>
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
                    <FormLabel>Sinh viên</FormLabel>
                    <FormDescription>
                      Chọn sinh viên để giao bài tập
                    </FormDescription>
                    <div className="border rounded-md p-4 space-y-4">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={student.id}
                            checked={field.value?.includes(student.id)}
                            onCheckedChange={(checked) => {
                              const currentVal = field.value || [];
                              if (checked) {
                                field.onChange([...currentVal, student.id]);
                              } else {
                                field.onChange(
                                  currentVal.filter((id) => id !== student.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={student.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {student.user.displayName}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </Button>
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