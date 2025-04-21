"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pin, Lock, Trash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

interface AdminTopicActionsProps {
  topic: Topic;
}

export const AdminTopicActions = ({ topic }: AdminTopicActionsProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePin = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/forum/topics/${topic.id}/pin`);
      toast.success(`Topic ${topic.isPinned ? "unpinned" : "pinned"} successfully`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/forum/topics/${topic.id}/lock`);
      toast.success(`Topic ${topic.isLocked ? "unlocked" : "locked"} successfully`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/forum/topics/${topic.id}`);
      toast.success("Topic deleted successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete topic");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Hành động</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Hành đồng</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePin} disabled={isLoading}>
            <Pin className="h-4 w-4 mr-2" />
            {topic.isPinned ? "Gỡ ghim" : "Ghim"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLock} disabled={isLoading}>
            <Lock className="h-4 w-4 mr-2" />
            {topic.isLocked ? "Mở khóa" : "Khóa"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
            disabled={isLoading}
          >
            <Trash className="h-4 w-4 mr-2" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
            Điều này sẽ xóa chủ đề vĩnh viễn &quot;{topic.title}&quot; và tất cả các bài viết của nó.
            Hành động này không thể hoàn tác.
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