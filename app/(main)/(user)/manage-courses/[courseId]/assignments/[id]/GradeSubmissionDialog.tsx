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
import { Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface GradeSubmissionDialogProps {
  submission: any;
  assignmentId: string;
  onSuccess: (updatedSubmission: any) => void;
}

const formSchema = z.object({
  grade: z
    .number()
    .min(0, "Điểm phải từ 0 đến 10")
    .max(10, "Điểm phải từ 0 đến 10"),
  feedback: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function GradeSubmissionDialog({
  submission,
  assignmentId,
  onSuccess,
}: GradeSubmissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: submission.grade !== null ? submission.score : 0,
      feedback: submission.feedback || "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const payload = {
        submissionId: submission.id,
        grade: values.grade,
        feedback: values.feedback,
      };

      const response = await fetch(
        `/api/assignments/${assignmentId}/submissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update submission");
      }

      const updatedSubmission = await response.json();

      toast.success("Đã chấm điểm bài nộp thành công");
      onSuccess(updatedSubmission);
      setIsOpen(false);
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Chấm điểm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chấm điểm bài nộp</DialogTitle>
          <DialogDescription>
            Xem và chấm điểm bài nộp của sinh viên
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar
              size="md"
              avatarUrl={submission.student.user.avatarUrl}
            />
            <div>
              <h3 className="font-medium">
                {submission.student.user.displayName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {submission.student.class?.name || ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Thời gian nộp
              </p>
              <p className="font-medium">
                {submission.submittedAt
                  ? format(
                      new Date(submission.submittedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      }
                    )
                  : "Chưa nộp"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">File đã nộp</p>
              <div className="flex items-center gap-2">
                {submission.fileUrl ? (
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem file
                    </a>
                  </Button>
                ) : (
                  <Badge variant="outline">Chưa nộp</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm số (0-10)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhận xét</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập nhận xét cho sinh viên..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu điểm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
