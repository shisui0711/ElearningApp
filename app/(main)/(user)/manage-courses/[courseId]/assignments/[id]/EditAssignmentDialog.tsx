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
import { Loader2, CheckCircle } from "lucide-react";

interface EditAssignmentDialogProps {
  assignment: any;
  onSuccess: (updatedAssignment: any) => void;
}

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
    .max(100, "Tiêu đề không được quá 100 ký tự"),
  description: z.string().optional(),
  type: z.enum(["FILE_UPLOAD", "EXAM", "QUIZ"]),
  dueDate: z.date({
    required_error: "Vui lòng chọn thời hạn nộp bài",
  }),
  fileType: z.string().optional(),
  examId: z.string().optional(),
  quizId: z.string().optional(),
  classId: z.string().optional(),
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
  const [quizzes, setQuizzes] = useState<{ id: string; title: string; timeLimit: number | null }[]>([]);

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

        // Fetch quizzes
        const quizzesResponse = await fetch("/api/quizzes");
        if (quizzesResponse.ok) {
          const quizzesData = await quizzesResponse.json();
          setQuizzes(quizzesData);
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
      type: assignment.type as "FILE_UPLOAD" | "EXAM" | "QUIZ",
      fileType: assignment.fileType || "",
      examId: assignment.examId || "",
      quizId: assignment.quizId || "",
      classId: assignment.classId || "",
    },
  });

  const selectedType = form.watch("type");
  const selectedExamId = form.watch("examId");
  const selectedQuizId = form.watch("quizId");
  const selectedClass = form.watch("classId");

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
        quizId: values.type === "QUIZ" ? values.quizId : null,
        classId: values.classId || null,
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
                          <SelectItem value="QUIZ">Bài tập trắc nghiệm</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedType === "FILE_UPLOAD" && (
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
                          <SelectItem value="*">
                            Tất cả các loại file
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedType === "EXAM" && (
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

            {selectedType === "QUIZ" && (
              <FormField
                control={form.control}
                name="quizId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chọn bài tập trắc nghiệm</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bài tập trắc nghiệm" />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzes.map((quiz) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title} {quiz.timeLimit ? `(${quiz.timeLimit} phút)` : '(Không giới hạn thời gian)'}
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
              name="classId"
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

            {selectedClass === "CLASS" && (
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
