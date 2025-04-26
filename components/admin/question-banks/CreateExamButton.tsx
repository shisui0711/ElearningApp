"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateExamButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

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
    <Button asChild>
      <Link href="/admin/exams/create">
        <Plus className="h-4 w-4 mr-2" />
        Tạo bộ câu hỏi mới
      </Link>
    </Button>
  );
}
