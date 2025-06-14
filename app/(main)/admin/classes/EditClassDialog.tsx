"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

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
import { updateClassSchema, UpdateClassValues } from "@/lib/validation";
import { useUpdateClassMutation } from "./mutations";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PaginationResponse } from "@/types";
import { useAnimation } from "@/provider/AnimationProvider";
import { cn } from "@/lib/utils";

// Define interfaces
interface Department {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  departmentId: string;
}

type EditClassDialogProps = {
  open: boolean;
  onClose: () => void;
  classItem: Class;
};

export default function EditClassDialog({
  open,
  classItem,
  onClose,
}: EditClassDialogProps) {
  const { gsap, isReady } = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Create refs for animations
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const formFieldsRef = useRef<HTMLDivElement>(null);
  const successIconRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  // Fetch departments for the dropdown
  const { data: departmentsData, isLoading: loadingDepartments } = useQuery<PaginationResponse<Department>>({
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

  // Extract departments array from the response
  const departments = departmentsData?.data || [];

  // No need to find original department name anymore as we're using the departments array directly

  const form = useForm<UpdateClassValues>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      id: classItem.id,
      name: classItem.name,
      departmentId: classItem.departmentId,
    },
  });

  const { isPending, mutate } = useUpdateClassMutation();

  // Watch for form value changes to detect modifications
  const watchedValues = form.watch();

  useEffect(() => {
    const hasNameChanged = watchedValues.name !== classItem.name;
    const hasDepartmentChanged = watchedValues.departmentId !== classItem.departmentId;
    setHasChanges(hasNameChanged || hasDepartmentChanged);
  }, [watchedValues, classItem]);

  // Reset form when class item changes
  useEffect(() => {
    form.reset({
      id: classItem.id,
      name: classItem.name,
      departmentId: classItem.departmentId,
    });
    setIsSuccess(false);
    setHasChanges(false);
  }, [classItem, form]);

  // GSAP animations for dialog content
  useEffect(() => {
    if (!isReady || !open) return;

    // Create a timeline for form animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the icon
    if (iconRef.current) {
      tl.fromTo(
        iconRef.current,
        { scale: 0.5, opacity: 0, rotate: -45 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.5, ease: "back.out(1.7)" }
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
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1
        },
        "-=0.2"
      );
    }

    // Animate comparison section when it appears
    if (comparisonRef.current) {
      gsap.set(comparisonRef.current, { opacity: 0, y: 20 });
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap, open]);

  // Animate comparison section when changes are detected
  useEffect(() => {
    if (!isReady || !comparisonRef.current) return;

    if (hasChanges) {
      gsap.to(comparisonRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    } else {
      gsap.to(comparisonRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in"
      });
    }
  }, [isReady, gsap, hasChanges]);

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

  const onSubmit = async (values: UpdateClassValues) => {
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
      <DialogContent className="sm:max-w-[450px] glass border-primary/20">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div ref={successIconRef} className="mb-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Cập nhật thành công!</h2>
            <p className="text-muted-foreground text-center">
              Thông tin lớp học đã được cập nhật.
            </p>
          </div>
        ) : (
          <>
            <div ref={iconRef} className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="h-6 w-6 text-primary" />
            </div>

            <DialogHeader>
              <DialogTitle ref={titleRef} className="text-gradient-1 text-2xl text-center">
                Chỉnh sửa lớp học
              </DialogTitle>
              <DialogDescription className="text-center">
                Chỉnh sửa thông tin cho lớp học <span className="font-medium">{classItem.name}</span>.
              </DialogDescription>
            </DialogHeader>

            {/* Changes comparison section */}
            {hasChanges && (
              <div
                ref={comparisonRef}
                className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/10"
              >
                <h4 className="text-sm font-medium text-primary mb-2">Thay đổi</h4>

                {watchedValues.name !== classItem.name && (
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">Tên lớp:</span>
                      <div className="font-medium line-through">{classItem.name}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-primary">{watchedValues.name}</div>
                    </div>
                  </div>
                )}

                {watchedValues.departmentId !== classItem.departmentId && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">Khoa:</span>
                      <div className="font-medium line-through">
                        {departments.find(d => d.id === classItem.departmentId)?.name || "Không xác định"}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-primary">
                        {departments.find(d => d.id === watchedValues.departmentId)?.name || "Không xác định"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                              className={cn(
                                "border-primary/20 focus-visible:ring-primary/30",
                                watchedValues.name !== classItem.name && "border-primary/40 bg-primary/5"
                              )}
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
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "border-primary/20 focus-visible:ring-primary/30",
                                  watchedValues.departmentId !== classItem.departmentId && "border-primary/40 bg-primary/5"
                                )}
                              >
                                {loadingDepartments ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Đang tải...</span>
                                  </div>
                                ) : (
                                  <SelectValue placeholder="Chọn khoa" />
                                )}
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
                    disabled={isPending || !hasChanges}
                    animationVariant="hover"
                    gradientVariant="gradient1"
                    className={cn(
                      "text-white",
                      !hasChanges && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isPending ? "Đang cập nhật..." : "Cập nhật lớp"}
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
