"use client";

import React, { useState, useEffect } from "react";
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
import { Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/DatePicker";

interface EditAssignmentDialogProps {
  assignment: any;
  onSuccess: (updatedAssignment: any) => void;
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

export default function EditAssignmentDialog({
  assignment,
  onSuccess,
}: EditAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Fetch necessary data when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exams
        const examsResponse = await fetch("/api/exams");
        if (examsResponse.ok) {
          const examsData = await examsResponse.json();
          setExams(examsData);
        }

        // Fetch classes
        const classesResponse = await fetch("/api/classes");
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData);
        }

        // Fetch students enrolled in the course
        const courseId = assignment.course.id;
        const studentsResponse = await fetch(
          `/api/courses/${courseId}/students`
        );
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, assignment.course.id]);

  // Determine if assignment is assigned to a class or specific students
  const assignFor = assignment.classId ? "CLASS" : "STUDENTS";

  // Initialize form with assignment data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: assignment.title,
      description: assignment.description || "",
      dueDate: new Date(assignment.dueDate),
      type: assignment.type as "EXAM" | "FILE_UPLOAD",
      fileType: assignment.fileType || "application/pdf",
      examId: assignment.examId || "",
      assignFor: assignFor,
      classId: assignment.classId || "",
      studentIds: [],
    },
  });

  const assignmentType = form.watch("type");
  const currentAssignFor = form.watch("assignFor");

  // Handle form submission
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

      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update assignment");
      }

      const updatedAssignment = await response.json();
      
      toast.success("Đã cập nhật bài tập thành công");
      onSuccess(updatedAssignment);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update assignment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài tập</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin bài tập và các tùy chọn
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
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Loại bài tập</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
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
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại file" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application/pdf">PDF</SelectItem>
                          <SelectItem value="application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                            Word Document (.doc, .docx)
                          </SelectItem>
                          <SelectItem value="image/jpeg,image/png">
                            Hình ảnh (.jpg, .png)
                          </SelectItem>
                          <SelectItem value="application/zip,application/x-zip-compressed">
                            Tệp nén (.zip)
                          </SelectItem>
                          <SelectItem value="*">Tất cả các loại file</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                    <FormLabel>Chọn đề thi</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đề thi" />
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
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đối tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLASS">Cả lớp</SelectItem>
                        <SelectItem value="STUDENTS">
                          Sinh viên cụ thể
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentAssignFor === "CLASS" && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chọn lớp</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lớp" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentAssignFor === "STUDENTS" && (
              <FormField
                control={form.control}
                name="studentIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chọn sinh viên</FormLabel>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            checked={field.value?.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([
                                  ...(field.value || []),
                                  student.id,
                                ]);
                              } else {
                                field.onChange(
                                  field.value?.filter((id) => id !== student.id) || []
                                );
                              }
                            }}
                            id={`student-${student.id}`}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {student.user.displayName}
                            {student.class && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({student.class.name})
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                      {students.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Không có sinh viên nào đăng ký khóa học này
                        </p>
                      )}
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
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 