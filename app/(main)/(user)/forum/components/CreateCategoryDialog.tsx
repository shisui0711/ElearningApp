"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, MessageSquare, Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { AnimatedButton } from "@/components/ui/animated-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAnimation } from "@/provider/AnimationProvider";

interface CreateCategoryDialogProps {
  variant?:
    | "outline"
    | "default"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export const CreateCategoryDialog = ({
  variant = "outline",
}: CreateCategoryDialogProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { gsap, isReady } = useAnimation();
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formFieldsRef = useRef<HTMLDivElement>(null);

  // GSAP animations for dialog content
  useEffect(() => {
    if (!isReady || !isOpen) return;

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
  }, [isReady, gsap, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error("Tên danh mục là bắt buộc");
      return;
    }

    try {
      setIsLoading(true);

      await axios.post("/api/forum/categories", {
        name,
        description,
      });

      toast.success("Đã tạo danh mục thành công");
      setIsOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <AnimatedButton
          variant={variant}
          animationVariant="hover"
          className="bg-primary/90 hover:bg-primary text-primary-foreground"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Tạo danh mục
        </AnimatedButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div ref={iconRef} className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-fit">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle ref={titleRef} className="text-center text-xl text-gradient-1">
              Tạo mới danh mục
            </DialogTitle>
            <DialogDescription className="text-center">
              Thêm danh mục mới vào diễn đàn để người dùng có thể tạo chủ đề.
            </DialogDescription>
          </DialogHeader>
          <div ref={formFieldsRef} className="grid gap-4 py-4">
            <div className="space-y-2 form-field">
              <Label htmlFor="name" className="text-right flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Tên danh mục
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Thảo luận chung"
                disabled={isLoading}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2 form-field">
              <Label htmlFor="description" className="text-right flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hãy mô tả nội dung của danh mục này."
                disabled={isLoading}
                className="border-primary/20 focus:border-primary min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <AnimatedButton
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full"
              animationVariant="hover"
            >
              {isLoading ? "Đang tạo..." : "Tạo danh mục"}
            </AnimatedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
