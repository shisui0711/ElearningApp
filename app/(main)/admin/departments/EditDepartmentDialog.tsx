"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Department } from "@prisma/client";
import { Pencil, CheckCircle2, ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  updateDepartmentSchema,
  UpdateDepartmentValues,
} from "@/lib/validation";
import { useUpdateDepartmentMutation } from "./mutations";
import { useAnimation } from "@/provider/AnimationProvider";
import { cn } from "@/lib/utils";

type EditDepartmentDialogProps = {
  open: boolean;
  onClose: () => void;
  department: Department;
};

export default function EditDepartmentDialog({
  open,
  department,
  onClose,
}: EditDepartmentDialogProps) {
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

  const form = useForm<UpdateDepartmentValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      id: department.id,
      name: department.name,
    },
  });

  const { isPending, mutate } = useUpdateDepartmentMutation();
  
  // Watch for form value changes to detect modifications
  const watchedValues = form.watch();
  
  useEffect(() => {
    const hasNameChanged = watchedValues.name !== department.name;
    setHasChanges(hasNameChanged);
  }, [watchedValues, department]);

  useEffect(() => {
    form.reset({
      id: department.id,
      name: department.name,
    });
    setIsSuccess(false);
    setHasChanges(false);
  }, [department, form]);

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

  const onSubmit = async (values: UpdateDepartmentValues) => {
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
              Thông tin khoa đã được cập nhật.
            </p>
          </div>
        ) : (
          <>
            <div ref={iconRef} className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="h-6 w-6 text-primary" />
            </div>

            <DialogHeader>
              <DialogTitle ref={titleRef} className="text-gradient-1 text-2xl text-center">
                Chỉnh sửa khoa
              </DialogTitle>
              <DialogDescription className="text-center">
                Chỉnh sửa thông tin cho khoa <span className="font-medium">{department.name}</span>.
              </DialogDescription>
            </DialogHeader>

            {/* Changes comparison section */}
            {hasChanges && (
              <div
                ref={comparisonRef}
                className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/10"
              >
                <h4 className="text-sm font-medium text-primary mb-2">Thay đổi</h4>

                {watchedValues.name !== department.name && (
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">Tên khoa:</span>
                      <div className="font-medium line-through">{department.name}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-primary">{watchedValues.name}</div>
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
                          <FormLabel className="text-primary">Tên khoa</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nhập tên khoa" 
                              className={cn(
                                "border-primary/20 focus-visible:ring-primary/30",
                                watchedValues.name !== department.name && "border-primary/40 bg-primary/5"
                              )}
                              {...field} 
                            />
                          </FormControl>
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
                    {isPending ? "Đang cập nhật..." : "Cập nhật khoa"}
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
