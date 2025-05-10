"use client";

import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PlusCircle, CheckCircle2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Input } from "@/components/ui/input";
import { createClassSchema, CreateClassValues } from "@/lib/validation";
import { useCreateClassMutation } from "./mutations";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PaginationResponse } from "@/types";
import { useAnimation } from "@/provider/AnimationProvider";

// Define department interface
interface Department {
  id: string;
  name: string;
}

type CreateClassDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateClassDialog({
  open,
  onClose,
}: CreateClassDialogProps) {
  const { gsap, isReady } = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const { isPending, mutate } = useCreateClassMutation();

  // Create refs for animations
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formFieldsRef = useRef<HTMLDivElement>(null);
  const successIconRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // Fetch departments for the dropdown
  const { data: departments, isLoading: loadingDepartments } = useQuery<
    PaginationResponse<Department>
  >({
    queryKey: ["departments-all"],
    queryFn: async () => {
      const response = await axios.get("/api/departments", {
        params: {
          pageSize: 100,
          pageNumber: 1,
        },
      });
      return response.data;
    },
  });

  const form = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      departmentId: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        departmentId: "",
      });
      setIsSuccess(false);
    }
  }, [open, form]);

  // GSAP animations for dialog content
  useEffect(() => {
    if (!isReady || !open) return;

    // Create a timeline for form animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the icon
    if (iconRef.current) {
      tl.fromTo(
        iconRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }

    // Animate the title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        "-=0.3"
      );
    }

    // Animate the form fields
    if (formFieldsRef.current) {
      const formFields = formFieldsRef.current.querySelectorAll('.form-field');
      tl.fromTo(
        formFields,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.1
        },
        "-=0.2"
      );
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap, open]);

  // Success animation
  useEffect(() => {
    if (!isReady || !isSuccess || !successIconRef.current) return;

    gsap.fromTo(
      successIconRef.current,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }
    );

    // Auto close after success animation
    const timer = setTimeout(() => {
      onClose();
      setIsSuccess(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isReady, gsap, isSuccess, onClose]);

  const onSubmit = async (values: CreateClassValues) => {
    mutate(values, {
      onSuccess: () => {
        setIsSuccess(true);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open || !isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-primary/20">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div ref={successIconRef} className="mb-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Tạo lớp thành công!</h2>
            <p className="text-muted-foreground text-center">
              Lớp học mới đã được tạo thành công.
            </p>
          </div>
        ) : (
          <>
            <div ref={iconRef} className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>

            <DialogHeader>
              <DialogTitle ref={titleRef} className="text-gradient-1 text-2xl text-center">
                Tạo lớp học mới
              </DialogTitle>
              <DialogDescription className="text-center">
                Nhập thông tin chi tiết cho lớp học mới.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div ref={formFieldsRef}>
                  <div className="form-field">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Tên lớp</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tên lớp"
                              className="border-primary/20 focus-visible:ring-primary/30"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="form-field mt-4">
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Khoa</FormLabel>
                          <Select
                            disabled={loadingDepartments}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-primary/20 focus-visible:ring-primary/30">
                                <SelectValue placeholder="Chọn khoa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments?.data && departments?.data?.map((department) => (
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
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <AnimatedButton
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="mr-2"
                    animationVariant="hover"
                    disabled={isPending}
                  >
                    Hủy
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    disabled={isPending}
                    animationVariant="hover"
                    gradientVariant="gradient1"
                    className="text-white"
                  >
                    {isPending ? "Đang tạo..." : "Tạo lớp"}
                  </AnimatedButton>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
