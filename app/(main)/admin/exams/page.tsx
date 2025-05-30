"use client";

import { Suspense, useRef, useEffect } from "react";
import ExamsList from "@/components/admin/exams/ExamsList";
import CreateExamButton from "@/components/admin/exams/CreateExamButton";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard, CardContent } from "@/components/ui/animated-card";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAnimation } from "@/provider/AnimationProvider";
import { FileText } from "lucide-react";

export default function ExamsManagementPage() {
  const { gsap, isReady } = useAnimation();
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (!isReady || !pageRef.current) return;

    // Create a timeline for page animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the header
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );
    }

    // Animate the content
    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap]);

  return (
    <div ref={pageRef} className="relative min-h-screen p-6 space-y-6 overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground
        variant="gradient2"
        intensity="light"
        animated={true}
      />

      <div ref={headerRef} className="relative z-10">
        <div className="flex justify-between items-center mb-8 bg-card/60 p-6 rounded-xl backdrop-blur-sm border">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gradient-2 flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Quản lý bài kiểm tra
            </h1>
            <p className="text-muted-foreground">
              Tạo và quản lý các bài kiểm tra trắc nghiệm
            </p>
          </div>
          <CreateExamButton />
        </div>
      </div>

      <div ref={contentRef} className="relative z-10">
        <Suspense fallback={<ExamsListSkeleton />}>
          <ExamsList />
        </Suspense>
      </div>
    </div>
  );
}

function ExamsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <AnimatedCard
          key={i}
          className="border p-4"
          animationVariant="reveal"
          gradientBorder={true}
        >
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64 bg-gradient-2/20" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 bg-gradient-2/20" />
                <Skeleton className="h-9 w-20 bg-gradient-2/20" />
                <Skeleton className="h-9 w-20 bg-gradient-2/20" />
              </div>
            </div>
            <div className="mt-2">
              <Skeleton className="h-4 w-32 bg-gradient-2/10" />
            </div>
          </CardContent>
        </AnimatedCard>
      ))}
    </div>
  );
}
