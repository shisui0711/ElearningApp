"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Lock, Trash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Topic {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  categoryId: string;
}

interface TopicAdminActionsProps {
  topic: Topic;
}

export const TopicAdminActions = ({ topic }: TopicAdminActionsProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePin = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/forum/topics/${topic.id}/pin`);
      toast.success(`Topic ${topic.isPinned ? "bỏ ghim" : "ghim"} thành công`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/forum/topics/${topic.id}/lock`);
      toast.success(
        `Chủ đề ${topic.isLocked ? "đã mở khóa" : "đã khóa"} thành công`
      );
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/forum/topics/${topic.id}`);
      toast.success("Chủ đề đã được xóa thành công");
      router.push(`/forum/categories/${topic.categoryId}`);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePin}
          disabled={isLoading}
        >
          <Pin className="h-4 w-4 mr-2" />
          {topic.isPinned ? "Gỡ ghim" : "Ghim"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLock}
          disabled={isLoading}
        >
          <Lock className="h-4 w-4 mr-2" />
          {topic.isLocked ? "Mở khóa" : "Khóa"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isLoading}
        >
          <Trash className="h-4 w-4 mr-2" />
          Xóa
        </Button>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Điều này sẽ xóa chủ đề vĩnh viễn &quot;{topic.title}&quot; và tất
              cả các bài viết của nó. Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
