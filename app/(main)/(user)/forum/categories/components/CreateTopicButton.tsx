"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateTopicButtonProps {
  categoryId: string;
  variant?: "outline" | "default" | "secondary" | "ghost" | "link" | "destructive";
}

export const CreateTopicButton = ({ 
  categoryId, 
  variant = "outline" 
}: CreateTopicButtonProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      toast.error("Vui lòng điền hết các trường");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await axios.post("/api/forum/topics", {
        title,
        content,
        categoryId,
      });
      
      toast.success("Tạo chủ đề thành công");
      setIsOpen(false);
      setTitle("");
      setContent("");
      
      // Navigate to the new topic
      router.push(`/forum/topics/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Tạo chủ đề mới
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo chủ đề mới</DialogTitle>
            <DialogDescription>
            Bắt đầu một cuộc thảo luận mới trong danh mục này
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-right">
                Tiêu đề
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề chủ đề"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-right">
                Nội dung
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của bạn..."
                className="min-h-[150px]"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit"
              disabled={isLoading || !title.trim() || !content.trim()} 
              className="w-full"
            >
              {isLoading ? "Đang tạo..." : "Tạo chủ đề"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 