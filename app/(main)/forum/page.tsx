import React from "react";
import { validateRequest } from "@/auth";
import { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, MessageSquare } from "lucide-react";

import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCategoryDialog } from "./components/CreateCategoryDialog";
import { formatTimeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Forum",
  description: "Interact with other learners in our community forums",
};

const ForumPage = async () => {
  const { user } = await validateRequest();
  const isAdmin = user?.role === "ADMIN";

  const categories = await prisma.forumCategory.findMany({
    include: {
      _count: {
        select: {
          topics: true,
        },
      },
      topics: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="container py-6 mx-auto px-4">
      <Link
        href="/"
        prefetch={false}
        className="mb-8 flex items-center hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="mr-2 size-5" />
        Trang chủ
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Diễn đàn hỏi đáp
          </h1>
          <p className="text-muted-foreground mt-2">
            Thảo luận các chủ đề, đặt câu hỏi và kết nối với những người học
            khác
          </p>
        </div>
        {isAdmin && <CreateCategoryDialog />}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {categories.map((category) => {
          const latestTopic = category.topics[0];

          return (
            <Link
              key={category.id}
              href={`/forum/categories/${category.id}`}
              className="block"
            >
              <Card className="hover:bg-accent/50 transition duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {category.name}
                        <ArrowUpRight className="h-4 w-4" />
                      </CardTitle>
                      {category.description && (
                        <CardDescription className="mt-1.5">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        {category._count.topics} chủ đề
                      </span>
                    </div>
                  </div>
                </CardHeader>
                {latestTopic && (
                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Mới nhất:</span>
                        <span className="font-medium line-clamp-1">
                          {latestTopic.title}
                        </span>
                        <span className="text-muted-foreground">đăng bởi</span>
                        <span className="font-medium">
                          {latestTopic.user.displayName}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {formatTimeAgo(latestTopic.updatedAt)}
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </Link>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <h3 className="font-semibold text-lg">Chưa có danh mục nào.</h3>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "Tạo một danh mục để bắt đầu."
                : "Kiểm tra lại sau để biết các danh mục diễn đàn"}
            </p>
            {isAdmin && (
              <div className="mt-4">
                <CreateCategoryDialog variant="default" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
