"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useDeleteClassMutation } from "./mutations";
import { useAnimation } from "@/provider/AnimationProvider";

interface Class {
  id: string;
  name: string;
  departmentId: string;
}

export default function DeleteClassDialog({
  classItem,
  open,
  onClose,
}: {
  classItem: Class;
  open: boolean;
  onClose: () => void;
}) {
  const { gsap, isReady } = useAnimation();
  const [isSuccess, setIsSuccess] = useState(false);
  const { isPending, mutate } = useDeleteClassMutation(classItem);

  // Create refs for animations
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const successIconRef = useRef<HTMLDivElement>(null);

  // GSAP animations for dialog content
  useEffect(() => {
    if (!isReady || !open) return;

    // Create a timeline for animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the warning icon
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

    // Animate the content
    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
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

  const handleDelete = () => {
    mutate(classItem.id, {
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
      <DialogContent className="sm:max-w-[425px] glass border-destructive/20">
        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div ref={successIconRef} className="mb-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Xóa lớp thành công!</h2>
            <p className="text-muted-foreground text-center">
              Lớp học đã được xóa khỏi hệ thống.
            </p>
          </div>
        ) : (
          <>
            <div ref={iconRef} className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>

            <DialogHeader>
              <DialogTitle ref={titleRef} className="text-destructive text-2xl text-center">
                Xóa lớp học
              </DialogTitle>
              <DialogDescription className="text-center">
                Bạn có chắc chắn muốn xóa lớp học <span className="font-medium">"{classItem.name}"</span>?
              </DialogDescription>
            </DialogHeader>

            <div ref={contentRef} className="py-4">
              <p className="text-muted-foreground text-center">
                Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến lớp học này sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <DialogFooter className="mt-2">
              <AnimatedButton
                variant="outline"
                onClick={onClose}
                className="mr-2"
                animationVariant="hover"
                disabled={isPending}
              >
                Hủy
              </AnimatedButton>
              <AnimatedButton
                variant="destructive"
                onClick={handleDelete}
                animationVariant="hover"
                disabled={isPending}
              >
                {isPending ? "Đang xóa..." : "Xóa lớp"}
              </AnimatedButton>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
