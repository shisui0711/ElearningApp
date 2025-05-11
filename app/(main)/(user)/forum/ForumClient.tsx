"use client"

import Link from "next/link";

import { CreateCategoryDialog } from "./components/CreateCategoryDialog";
import { formatTimeAgo } from "@/lib/utils";
import {
  AnimatedCard,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/animated-card";
import { useAnimation } from "@/provider/AnimationProvider";
import AnimatedBackground from "@/components/AnimatedBackground";
import {
  ArrowLeft,
  ArrowUpRight,
  MessageSquare,
  Users,
  Clock,
} from "lucide-react";

import React, { useRef, useEffect } from "react";
const ForumClient = ({
  categories,
  isAdmin,
}: {
  categories: any[];
  isAdmin: boolean;
}) => {
  const { gsap, isReady } = useAnimation();
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !pageRef.current) return;

    // Create a timeline for page animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the back button
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      );
    }

    // Animate the title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    // Animate the description
    if (descriptionRef.current) {
      tl.fromTo(
        descriptionRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    // Animate the categories
    if (categoriesRef.current && categories.length > 0) {
      const categoryCards =
        categoriesRef.current.querySelectorAll(".category-card");
      tl.fromTo(
        categoryCards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.2"
      );
    }

    // Animate the empty state
    if (emptyStateRef.current && categories.length === 0) {
      tl.fromTo(
        emptyStateRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6 },
        "-=0.2"
      );
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap, categories.length]);

  return (
    <div ref={pageRef} className="relative min-h-screen">
      {/* Animated background */}
      <AnimatedBackground
        variant="gradient2"
        intensity="light"
        animated={true}
      />

      <div className="container py-8 mx-auto px-4 relative z-10">
        <div ref={headerRef}>
          <Link
            href="/"
            prefetch={false}
            className="mb-8 flex items-center hover:text-primary transition-colors w-fit bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="mr-2 size-5" />
            Trang chủ
          </Link>
        </div>

        <div className="flex items-center justify-between mb-10 bg-card/80 backdrop-blur-md p-6 rounded-xl shadow-md">
          <div>
            <h1
              ref={titleRef}
              className="text-3xl font-bold tracking-tight text-gradient-1"
            >
              Diễn đàn hỏi đáp
            </h1>
            <p ref={descriptionRef} className="text-muted-foreground mt-2">
              Thảo luận các chủ đề, đặt câu hỏi và kết nối với những người học
              khác
            </p>
          </div>
          {isAdmin && <CreateCategoryDialog />}
        </div>

        <div ref={categoriesRef} className="grid grid-cols-1 gap-6">
          {categories.map((category) => {
            const latestTopic = category.topics[0];

            return (
              <Link
                key={category.id}
                href={`/forum/categories/${category.id}`}
                className="block category-card"
              >
                <AnimatedCard
                  animationVariant="hover"
                  className="overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-md"
                >
                  <CardHeader className="bg-gradient-to-r from-secondary/30 via-secondary/10 to-transparent">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-primary">
                          {category.name}
                          <ArrowUpRight className="h-4 w-4" />
                        </CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1.5">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center bg-primary/10 px-4 py-2 rounded-full text-primary font-medium">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {category._count.topics} chủ đề
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {latestTopic && (
                    <CardFooter className="border-t pt-4 bg-card/60">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-sm gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-secondary/30 p-1 rounded-full">
                            <Clock className="h-4 w-4 text-secondary-foreground" />
                          </span>
                          <span className="font-medium line-clamp-1 text-primary">
                            {latestTopic.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-secondary/30 p-1 rounded-full">
                            <Users className="h-4 w-4 text-secondary-foreground" />
                          </span>
                          <span className="font-medium">
                            {latestTopic.user.displayName}
                          </span>
                          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs">
                            {formatTimeAgo(latestTopic.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </CardFooter>
                  )}
                </AnimatedCard>
              </Link>
            );
          })}

          {categories.length === 0 && (
            <div
              ref={emptyStateRef}
              className="text-center py-16 bg-card/80 backdrop-blur-md rounded-xl shadow-md"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-xl text-gradient-1">
                Chưa có danh mục nào
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {isAdmin
                  ? "Tạo một danh mục để bắt đầu cuộc thảo luận mới."
                  : "Kiểm tra lại sau để biết các danh mục diễn đàn mới."}
              </p>
              {isAdmin && (
                <div className="mt-6">
                  <CreateCategoryDialog variant="default" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumClient
