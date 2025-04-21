import React from "react";
import { validateRequest } from "@/auth";
import { ChevronLeft, Lock, Pin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";

import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TopicReplyForm } from "../components/TopicReplyForm";
import { PostItem } from "../components/PostItem";
import { TopicAdminActions } from "../components/TopicAdminActions";

interface TopicPageProps {
  params: {
    topicId: string;
  };
}

const TopicPage = async ({ params }: TopicPageProps) => {
  const { topicId } = params;
  const { user } = await validateRequest();
  const isAdmin = user?.role === "ADMIN";

  // Increment view counter
  await prisma.forumTopic.update({
    where: { id: topicId },
    data: { views: { increment: 1 } },
  });

  const topic = await prisma.forumTopic.findUnique({
    where: {
      id: topicId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      },
      category: true,
      posts: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!topic) {
    notFound();
  }

  // Get current user's likes
  let userLikes = [];

  if (user) {
    const likes = await prisma.forumLike.findMany({
      where: {
        userId: user.id,
        post: {
          topicId: topicId,
        },
      },
      select: {
        postId: true,
      },
    });

    userLikes = likes.map((like) => like.postId);
  }

  const canReply = !!user && (!topic.isLocked || isAdmin);

  return (
    <div className="container py-6 mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href={`/forum/categories/${topic.categoryId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{topic.title}</h1>
              {topic.isPinned && (
                <Badge variant="secondary">
                  <Pin className="h-3 w-3 mr-1" />
                  Đã ghim
                </Badge>
              )}
              {topic.isLocked && (
                <Badge variant="outline">
                  <Lock className="h-3 w-3 mr-1" />
                  Đã khóa
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              trong{" "}
              <Link
                href={`/forum/categories/${topic.categoryId}`}
                className="hover:underline font-medium"
              >
                {topic.category.name}
              </Link>
            </div>
          </div>
        </div>
        {isAdmin && <TopicAdminActions topic={topic} />}
      </div>

      <div className="space-y-6">
        {/* Original post (topic) */}
        <PostItem
          postData={{
            id: topic.id,
            content: topic.content,
            createdAt: topic.createdAt,
            updatedAt: topic.updatedAt,
            user: topic.user,
            _count: { likes: 0 },
          }}
          currentUser={user}
          isTopic={true}
          userLikedPosts={[]}
        />

        {/* Posts/replies */}
        {topic.posts.length > 0 && (
          <div className="pt-4">
            <h2 className="font-semibold text-xl mb-4">Phản hồi</h2>
            <div className="space-y-6">
              {topic.posts.map((post) => (
                <PostItem
                  key={post.id}
                  postData={post}
                  currentUser={user}
                  isLocked={topic.isLocked}
                  userLikedPosts={userLikes}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reply form */}
        {canReply ? (
          <div className="pt-6">
            <Separator className="mb-6" />
            <TopicReplyForm topicId={topicId} />
          </div>
        ) : topic.isLocked ? (
          <div className="py-6 text-center">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Lock className="h-3 w-3 mr-2" />
              Chủ đề này đã bị khóa và không còn chấp nhận trả lời.
            </Badge>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vui lòng{" "}
              <Link href="/sign-in" className="underline">
                đăng nhập
              </Link>{" "}
              để trả lời
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicPage;
