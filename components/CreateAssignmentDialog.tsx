"use client";

import React, { useState, useRef } from "react";
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
  FormDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Exam {
  id: string;
  title: string;
  duration: number;
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  user: {
    displayName: string;
  };
}

interface CreateAssignmentDialogProps {
  courseId: string;
  exams: Exam[];
  classes: Class[];
  students: Student[];
  onAssignmentCreated?: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề bài tập"),
  description: z.string().optional(),
  dueDate: z.date({
    required_error: "Vui lòng chọn hạn nộp bài",
  }),
  dueTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng thời gian không hợp lệ"),
  type: z.enum(["EXAM", "FILE_UPLOAD"]),
  assignType: z.enum(["CLASS", "STUDENTS"]),
  classId: z.string().optional(),
  examId: z.string().optional(),
  fileType: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAssignmentDialog({
  courseId,
  exams,
  classes,
  students,
  onAssignmentCreated,
}: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"CLASS" | "STUDENTS">("CLASS");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "EXAM",
      assignType: "CLASS",
      dueTime: "23:59",
      studentIds: [],
    },
  });

  const type = form.watch("type");
  const assignType = form.watch("assignType");

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // Combine date and time
      const dueDateTime = new Date(values.dueDate);
      const [hours, minutes] = values.dueTime.split(":").map(Number);
      dueDateTime.setHours(hours, minutes);

      const assignmentData = {
        title: values.title,
        description: values.description,
        dueDate: dueDateTime.toISOString(),
        type: values.type,
        classId: values.assignType === "CLASS" ? values.classId : undefined,
        examId: values.type === "EXAM" ? values.examId : undefined,
        fileType: values.type === "FILE_UPLOAD" ? values.fileType : undefined,
        studentIds: values.assignType === "STUDENTS" ? values.studentIds : undefined,
      };

      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Có lỗi xảy ra khi tạo bài tập");
      }

      toast.success("Tạo bài tập thành công");
      form.reset();
      setOpen(false);
      
      if (onAssignmentCreated) {
        onAssignmentCreated();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Giao bài tập
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Giao bài tập mới</DialogTitle>
          <DialogDescription>
            Tạo bài tập mới cho khóa học này
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề bài tập" {...field} />
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
                      placeholder="Mô tả chi tiết bài tập"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày hết hạn</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Giờ hết hạn</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input
                          type="time"
                          {...field}
                          className="w-full"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại bài tập</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại bài tập" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EXAM">Bài tập trắc nghiệm</SelectItem>
                      <SelectItem value="FILE_UPLOAD">Bài tập nộp file</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "EXAM" && (
              <FormField
                control={form.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bài kiểm tra</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn bài kiểm tra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exams.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.title} ({exam.duration} phút)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "FILE_UPLOAD" && (
              <FormField
                control={form.control}
                name="fileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại file chấp nhận</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại file" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="application/pdf">PDF</SelectItem>
                        <SelectItem value="image/">Hình ảnh</SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                          Word Document
                        </SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                          Excel
                        </SelectItem>
                        <SelectItem value="application/zip">ZIP</SelectItem>
                        <SelectItem value="*">Tất cả các loại file</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Chọn loại file mà sinh viên được phép nộp
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="assignType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giao cho</FormLabel>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setActiveTab(value as "CLASS" | "STUDENTS");
                    }}
                  >
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="CLASS">Theo lớp</TabsTrigger>
                      <TabsTrigger value="STUDENTS">Sinh viên cụ thể</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="CLASS" className="pt-4">
                      <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lớp</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn lớp" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classes.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Bài tập sẽ được giao cho tất cả sinh viên trong lớp
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="STUDENTS" className="pt-4">
                      <FormField
                        control={form.control}
                        name="studentIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sinh viên</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                const currentValues = field.value || [];
                                if (!currentValues.includes(value)) {
                                  field.onChange([...currentValues, value]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn sinh viên" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {students.map((student) => (
                                  <SelectItem
                                    key={student.id}
                                    value={student.id}
                                    disabled={(field.value || []).includes(student.id)}
                                  >
                                    {student.user.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                                  Chưa có sinh viên nào được chọn
                                </p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo bài tập"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 