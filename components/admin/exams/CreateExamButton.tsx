"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAnimation } from "@/provider/AnimationProvider";

export default function CreateExamButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const { gsap, isReady } = useAnimation();
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Animation for form elements when dialog opens
  useEffect(() => {
    if (!isReady || !open || !formRef.current) return;

    const formElements = formRef.current.querySelectorAll('input, label, button');

    gsap.fromTo(
      formElements,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out"
      }
    );

    return () => {
      gsap.killTweensOf(formElements);
    };
  }, [isReady, open, gsap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề cho bài kiểm tra.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, duration }),
      });

      if (!response.ok) {
        throw new Error("Failed to create exam");
      }

      const data = await response.json();
      toast.success("Bài kiểm tra đã được tạo thành công.");
      setOpen(false);
      router.push(`/admin/exams/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimatedButton
          ref={buttonRef}
          gradientVariant="gradient2"
          animationVariant="hover"
          size="lg"
          className="shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Tạo bài kiểm tra
        </AnimatedButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 shadow-lg bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl text-gradient-2">Tạo bài kiểm tra mới</DialogTitle>
          <DialogDescription>
            Tạo bài kiểm tra trắc nghiệm mới để giao cho sinh viên
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exam-title" className="text-foreground">Tiêu đề bài kiểm tra</Label>
              <Input
                id="exam-title"
                placeholder="Nhập tiêu đề bài kiểm tra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                className="border-input/60 bg-background/60 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Thời gian làm bài &#40;phút&#41;
              </Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                disabled={loading}
                className="w-full sm:w-32 border-input/60 bg-background/60 focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              type="button"
            >
              Hủy
            </Button>
            <AnimatedButton
              type="submit"
              disabled={loading}
              gradientVariant="gradient2"
              animationVariant="hover"
            >
              {loading ? "Đang tạo..." : "Tạo bài kiểm tra"}
            </AnimatedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
