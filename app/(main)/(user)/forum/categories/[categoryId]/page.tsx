import React from "react";
import { validateRequest } from "@/auth";
import {
  ChevronLeft,
  MessageSquare,
  Eye,
  Pin,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { cn, formatTimeAgo } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTopicButton } from "../components/CreateTopicButton";
import { AdminTopicActions } from "../components/AdminTopicActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CategoryPageProps {
  params: Promise<{
    categoryId: string;
  }>;
}

const CategoryPage = async ({ params }: CategoryPageProps) => {
  const { categoryId } = await params;
  const { user } = await validateRequest();
  const isAdmin = user?.role === "ADMIN";

  const category = await prisma.forumCategory.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      topics: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="container py-6 mx-auto px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/forum">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{category.name}</h1>
      </div>

      {category.description && (
        <p className="text-muted-foreground mb-6">{category.description}</p>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Các chủ đề</h2>
        {user && <CreateTopicButton categoryId={categoryId} />}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Chủ lệ</th>
              <th className="text-center p-4 font-medium w-28">Trả lời</th>
              <th className="text-center p-4 font-medium w-28">Lượt xem</th>
              <th className="text-right p-4 font-medium w-52">
                Bài viết gần đây
              </th>
              {isAdmin && (
                <th className="w-24 p-4 font-medium text-center">Hành động</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {category.topics.map((topic) => (
              <tr
                key={topic.id}
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  topic.isPinned && "bg-accent/10"
                )}
              >
                <td className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage
                        src={topic.user.avatarUrl || undefined}
                        alt={topic.user.displayName}
                      />
                      <AvatarFallback>
                        {topic.user.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/forum/topics/${topic.id}`}
                          className="font-medium hover:underline"
                        >
                          {topic.title}
                        </Link>
                        {topic.isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Đã ghim
                          </Badge>
                        )}
                        {topic.isLocked && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Đã khóa
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        đăng bởi{" "}
                        <span className="font-medium">
                          {topic.user.displayName}
                        </span>{" "}
                        •{" "}
                        {formatTimeAgo(topic.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center text-sm">
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {topic._count.posts}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center text-sm">
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {topic.views}
                  </div>
                </td>
                <td className="p-4 text-right text-sm">
                  {topic._count.posts > 0 ? (
                    <span className="text-muted-foreground">
                      {formatTimeAgo(topic.updatedAt)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Chưa có phản hồi nào
                    </span>
                  )}
                </td>
                {isAdmin && (
                  <td className="p-4 text-center">
                    <AdminTopicActions topic={topic} />
                  </td>
                )}
              </tr>
            ))}

            {category.topics.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <MessageSquare className="h-10 w-10 opacity-20" />
                    <div>
                      <p>Chưa có chủ đề nào</p>
                      {user && (
                        <div className="mt-3">
                          <CreateTopicButton
                            categoryId={categoryId}
                            variant="default"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryPage;
