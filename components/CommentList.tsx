"use client";

import { useSocket } from "@/provider/SocketProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import UserAvatar from "./UserAvatar";
import { useSession } from "@/provider/SessionProvider";

interface CommentWithUser {
  id: string;
  content: string;
  lessonId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface LessonCommentListProps {
  lessonId: string;
}

const LessonCommentList = ({ lessonId }: LessonCommentListProps) => {
  const { user } = useSession();
  const [newComment, setNewComment] = useState("");
  const commentListRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const queryClient = useQueryClient();

  // Query to fetch existing comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["lessonComments", lessonId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/lessons/comments?lessonId=${lessonId}`
      );
      return response.data as CommentWithUser[];
    },
  });

  // Mutation to add a new comment
  const { mutate: addComment } = useMutation({
    mutationFn: async (content: string) => {
      const response = await axios.post("/api/lessons/comments", {
        lessonId,
        content,
      });
      return response.data;
    },
    onSuccess: (newComment) => {
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit("new_comment", {
          lessonId,
          userId: user.id,
          content: newComment.content,
        });
      }

      // Reset form
      setNewComment("");

      // Invalidate and refetch comments
      queryClient.invalidateQueries({ queryKey: ["lessonComments", lessonId] });
    },
  });

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment);
    }
  };

  // Connect to socket room for this lesson
  useEffect(() => {
    if (socket) {
      // Join the lesson room
      socket.emit("join_lesson", { lessonId, userId: user.id });

      // Listen for new comments
      socket.on("comment_received", (data) => {
        // Only refetch if it's not our own comment (those are handled by mutation)
        if (data.userId !== user.id) {
          queryClient.invalidateQueries({
            queryKey: ["lessonComments", lessonId],
          });
        }
      });

      // Clean up on unmount
      return () => {
        socket.emit("leave_lesson", { lessonId });
        socket.off("comment_received");
      };
    }
  }, [socket, lessonId, user.id, queryClient]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (commentListRef.current) {
      commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
    }
  }, [comments]);

  return (
    <div className="mt-8 border rounded-lg shadow-sm">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold">Bình luận</h2>
      </div>

      {/* Comments list */}
      <div ref={commentListRef} className="p-4 h-64 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500">Chưa có bình luận nào.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <UserAvatar avatarUrl={comment.user.avatarUrl} size="lg" />
              <div className="flex-1">
                <div className="bg-card  p-3 rounded-lg">
                  <div className="font-medium">{comment.user.displayName}</div>
                  <p className="mt-1">{comment.content}</p>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Thêm bình luận..."
            className="flex-1 border rounded-md p-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            disabled={!newComment.trim() || isLoading}
          >
            Gửi
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonCommentList;
