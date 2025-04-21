"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TopicReplyFormProps {
  topicId: string;
}

export const TopicReplyForm = ({ topicId }: TopicReplyFormProps) => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Nội dung trả lời là bắt buộc");
      return;
    }
    
    try {
      setIsLoading(true);
      
      await axios.post("/api/forum/posts", {
        content,
        topicId,
      });
      
      toast.success("Trả lời đã được đăng thành công.");
      setContent("");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      
      if (error.response?.status === 403) {
        toast.error("Chủ đề này đã bị khóa");
      } else {
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea 
          placeholder="Viết câu trả lời của bạn..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px]"
        />
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isLoading || !content.trim()}
        >
          {isLoading ? (
            "Đang tạo..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Đăng trả lời
            </>
          )}
        </Button>
      </div>
    </form>
  );
}; 