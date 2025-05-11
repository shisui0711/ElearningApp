"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface SubjectOption {
  id: string;
  name: string;
}

interface PrerequisiteType {
  id: string;
  subjectId: string;
  subject: {
    name: string;
  };
  description: string | null;
}

interface PrerequisiteDialogProps {
  courseId: string;
  initialPrerequisites: PrerequisiteType[];
}

// Define the form schema for adding a prerequisite
const formSchema = z.object({
  subjectId: z.string({
    required_error: "Vui lòng chọn môn học",
  }),
  description: z.string().optional(),
});

export function PrerequisiteDialog({
  courseId,
  initialPrerequisites,
}: PrerequisiteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [prerequisites, setPrerequisites] = useState(initialPrerequisites);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: "",
      description: "",
    },
  });

  // Load subjects when dialog opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && subjects.length === 0) {
      try {
        const response = await axios.get("/api/subjects", {
          params: {
            pageSize: 100,
            pageNumber: 1,
          },
        });
        setSubjects(response.data.data);
      } catch (error) {
        toast.error("Không thể tải danh sách môn học");
        console.error(error);
      }
    }
  };

  // Handle form submission to add a prerequisite
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/prerequisites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Có lỗi xảy ra khi thêm điều kiện tiên quyết"
        );
      }

      const newPrereq = await response.json();

      // Find the subject name
      const subject = subjects.find((s) => s.id === newPrereq.subjectId);

      // Add the new prerequisite to the local state
      setPrerequisites([
        ...prerequisites,
        {
          ...newPrereq,
          subject: { name: subject?.name || "Unknown" },
        },
      ]);

      form.reset();
      toast.success("Đã thêm điều kiện tiên quyết thành công");
      router.refresh();
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi thêm điều kiện tiên quyết"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a prerequisite
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/courses/prerequisites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Có lỗi xảy ra khi xóa điều kiện tiên quyết"
        );
      }

      // Update local state
      setPrerequisites(prerequisites.filter((p) => p.id !== id));
      toast.success("Đã xóa điều kiện tiên quyết thành công");
      router.refresh();
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi xóa điều kiện tiên quyết"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="mr-1 h-4 w-4" />
          Thêm điều kiện
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quản lý điều kiện tiên quyết</DialogTitle>
          <DialogDescription>
            Thêm các môn học tiên quyết mà sinh viên cần hoàn thành trước khi
            tham gia khóa học này
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">
            Danh sách điều kiện hiện tại:
          </h3>

          {prerequisites.length > 0 ? (
            <div className="space-y-2 mb-6">
              {prerequisites.map((prerequisite) => (
                <div
                  key={prerequisite.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div>
                    <p className="font-medium">{prerequisite.subject.name}</p>
                    {prerequisite.description && (
                      <p className="text-sm text-muted-foreground">
                        {prerequisite.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(prerequisite.id)}
                    disabled={deletingId === prerequisite.id}
                  >
                    {deletingId === prerequisite.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-lg mb-6">
              <p className="text-muted-foreground">
                Chưa có điều kiện tiên quyết nào
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Môn học</FormLabel>
                    <Select
                      disabled={loading || subjects.length === 0}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn môn học" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả (không bắt buộc)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả lý do môn học này là điều kiện tiên quyết"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Giải thích tại sao sinh viên cần hoàn thành môn học này
                      trước
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={loading || form.formState.isSubmitting}
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Thêm điều kiện"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
