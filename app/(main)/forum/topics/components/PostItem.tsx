"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Heart, MoreVertical, Pencil, Trash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from "@/lib/utils";
import { vi } from 'date-fns/locale/vi';

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
  createdAt: Date;
}

interface PostData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: UserInfo;
  _count: {
    likes: number;
  };
}

interface PostItemProps {
  postData: PostData;
  currentUser: any;
  isLocked?: boolean;
  isTopic?: boolean;
  userLikedPosts: string[];
}

export const PostItem = ({
  postData,
  currentUser,
  isLocked = false,
  isTopic = false,
  userLikedPosts = [],
}: PostItemProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(postData.content);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [likeCount, setLikeCount] = useState(postData._count.likes);
  const [isLiked, setIsLiked] = useState(userLikedPosts.includes(postData.id));

  const isOwner = currentUser?.id === postData.user.id;
  const isAdmin = currentUser?.role === "ADMIN";
  const canEdit = (isOwner || isAdmin) && !isLocked;
  const canDelete = isOwner || isAdmin;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    try {
      setIsEditLoading(true);

      await axios.patch(`/api/forum/posts/${postData.id}`, {
        content: editContent,
      });

      toast.success("Cập nhật bài viết thành công");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleteLoading(true);

      if (isTopic) {
        await axios.delete(`/api/forum/topics/${postData.id}`);
        router.push("/forum");
      } else {
        await axios.delete(`/api/forum/posts/${postData.id}`);
        router.refresh();
      }

      toast.success(
        isTopic ? "Xóa chủ đề thành công" : "Bài viết đã được xóa thành công."
      );
    } catch (error) {
      console.error(error);
      toast.error(`Xảy ra lỗi khi xóa ${isTopic ? "chủ đề" : "bài viết"}`);
    } finally {
      setIsDeleteLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Bạn phải đăng nhập để thích bài viết");
      return;
    }

    try {
      setIsLikeLoading(true);

      await axios.post(`/api/forum/posts/${postData.id}/like`);

      if (isLiked) {
        setLikeCount((prev) => prev - 1);
      } else {
        setLikeCount((prev) => prev + 1);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex gap-4 md:gap-6">
            {/* Author info */}
            <div className="hidden md:block md:w-36 lg:w-40 shrink-0">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={postData.user.avatarUrl}
                    alt={postData.user.displayName}
                  />
                  <AvatarFallback>
                    {postData.user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-2 space-y-1">
                  <p className="font-semibold">{postData.user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    @{postData.user.username}
                  </p>
                  {postData.user.role && (
                    <Badge
                      variant={
                        postData.user.role === "ADMIN"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {postData.user.role.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Post content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 md:hidden">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={postData.user.avatarUrl}
                    alt={postData.user.displayName}
                  />
                  <AvatarFallback>
                    {postData.user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">
                    {postData.user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{postData.user.username}
                  </p>
                </div>
                {postData.user.role && (
                  <Badge
                    variant={
                      postData.user.role === "ADMIN"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {postData.user.role.toLowerCase()}
                  </Badge>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    disabled={isEditLoading}
                    className="min-h-[150px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(postData.content);
                      }}
                      disabled={isEditLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={
                        isEditLoading ||
                        editContent === postData.content ||
                        !editContent.trim()
                      }
                    >
                      {isEditLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {postData.content}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 md:px-6 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
          {format(new Date(postData.createdAt), "d 'Tháng' M, yyyy 'lúc' h:mm a", { locale: vi })}
            {postData.updatedAt > postData.createdAt && (
              <span className="ml-2 italic">(đã chỉnh sửa)</span>
            )}
          </div>

          <div className="flex items-center">
            {!isTopic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLikeLoading || !currentUser || isLocked}
                className="mr-2"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 mr-1",
                    isLiked ? "fill-destructive text-destructive" : ""
                  )}
                />
                {likeCount}
              </Button>
            )}

            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Hành động</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              {isTopic ? "topic and all its replies" : "post"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
