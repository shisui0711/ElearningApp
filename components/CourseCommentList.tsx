"use client";

import { useSocket } from "@/provider/SocketProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import UserAvatar from "./UserAvatar";
import { useSession } from "@/provider/SessionProvider";
import { Button } from "./ui/button";
import { Trash, Reply } from "lucide-react";

interface CourseComment {
  id: string;
  content: string;
  courseId: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  replies?: CourseComment[];
}

interface CommentFormProps {
  courseId: string;
  onSuccess?: () => void;
  parentId?: string | null;
  onCancel?: () => void;
  placeholder?: string;
}

const CommentForm = ({
  courseId,
  onSuccess,
  parentId = null,
  onCancel,
  placeholder = "Thêm bình luận...",
}: CommentFormProps) => {
  const [content, setContent] = useState("");
  const { user } = useSession();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/courses/comments", {
        courseId,
        content,
        parentId,
      });
      return response.data;
    },
    onSuccess: (newComment) => {
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("new_course_comment", {
          courseId,
          userId: user.id,
          content: newComment.content,
          parentId,
        });
      }

      // Reset form
      setContent("");

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ["courseComments", courseId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      addComment();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded-md p-2 min-h-[80px]"
          disabled={isPending}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Hủy
            </Button>
          )}
          <Button type="submit" disabled={!content.trim() || isPending}>
            Gửi
          </Button>
        </div>
      </div>
    </form>
  );
};

interface CommentItemProps {
  comment: CourseComment;
  courseId: string;
  level?: number;
  canModerate: boolean;
}

const CommentItem = ({
  comment,
  courseId,
  level = 0,
  canModerate,
}: CommentItemProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { mutate: deleteComment } = useMutation({
    mutationFn: async (commentId: string) => {
      await axios.delete(`/api/courses/comments?id=${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseComments", courseId] });
    },
  });

  const isOwnComment = user?.id === comment.userId;
  const canDelete = canModerate || isOwnComment;

  return (
    <div className={`flex space-x-3 ${level > 0 ? "ml-8" : ""}`}>
      <UserAvatar avatarUrl={comment.user.avatarUrl} />
      <div className="flex-1">
        <div className="bg-card p-3 rounded-lg">
          <div className="flex justify-between">
            <div className="font-medium">
              {comment.user.displayName}
              {comment.user.role === "TEACHER" && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Giảng viên
                </span>
              )}
              {comment.user.role === "ADMIN" && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => deleteComment(comment.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-1">{comment.content}</p>
        </div>
        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
          <span>{new Date(comment.createdAt).toLocaleString()}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Phản hồi
          </Button>
        </div>

        {showReplyForm && (
          <div className="mt-2">
            <CommentForm
              courseId={courseId}
              parentId={comment.id}
              onSuccess={() => setShowReplyForm(false)}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Viết phản hồi..."
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                courseId={courseId}
                level={level + 1}
                canModerate={canModerate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CourseCommentListProps {
  courseId: string;
  isEnrolled: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
}

const CourseCommentList = ({
  courseId,
  isEnrolled,
  isTeacher,
  isAdmin,
}: CourseCommentListProps) => {
  const { user } = useSession();
  const commentListRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const queryClient = useQueryClient();
  const canComment = isEnrolled || isTeacher || isAdmin;
  const canModerate = isTeacher || isAdmin;

  // Query to fetch existing comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["courseComments", courseId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/courses/comments?courseId=${courseId}`
      );
      return response.data as CourseComment[];
    },
  });

  // Connect to socket room for this course
  useEffect(() => {
    if (socket && user) {
      // Join the course room
      socket.emit("join_course", { courseId, userId: user.id });

      // Listen for new comments
      socket.on("course_comment_received", (data) => {
        // Only refetch if it's not our own comment (those are handled by mutation)
        if (data.userId !== user.id) {
          queryClient.invalidateQueries({
            queryKey: ["courseComments", courseId],
          });
        }
      });

      // Clean up on unmount
      return () => {
        socket.emit("leave_course", { courseId });
        socket.off("course_comment_received");
      };
    }
  }, [socket, courseId, user, queryClient]);

  return (
    <div className="mt-8 border rounded-lg shadow-sm bg-card">
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-semibold text-gradient-1">Thảo luận</h2>
      </div>

      {/* Comments list */}
      <div
        ref={commentListRef}
        className="p-4 max-h-[600px] overflow-y-auto space-y-6"
      >
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500">Chưa có bình luận nào.</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              courseId={courseId}
              canModerate={canModerate}
            />
          ))
        )}
      </div>

      {/* Comment form */}
      {canComment ? (
        <div className="p-4 border-t">
          <CommentForm courseId={courseId} />
        </div>
      ) : (
        <div className="p-4 border-t text-center">
          <p className="text-gray-500">
            Bạn cần đăng ký khóa học để có thể tham gia thảo luận.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseCommentList;
