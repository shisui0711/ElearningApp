"use client";

import { Suspense, useRef, useEffect } from "react";
import { notFound } from "next/navigation";
import ModernExamEditor from "@/components/admin/exams/ModernExamEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard, CardContent } from "@/components/ui/animated-card";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAnimation } from "@/provider/AnimationProvider";

interface ExamDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { gsap, isReady } = useAnimation();
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !pageRef.current || !contentRef.current) return;

    // Create animation for the page content
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    return () => {
      if (contentRef.current) {
        gsap.killTweensOf(contentRef.current);
      }
    };
  }, [isReady, gsap]);

  const renderContent = async () => {
    try {
      const { id } = await params;

      if (!id) {
        notFound();
      }

      return (
        <ModernExamEditor examId={id} />
      );
    } catch (error) {
      console.error("Error loading exam:", error);
      return <div className="text-destructive">Lỗi khi tải đề thi</div>;
    }
  };

  return (
    <div ref={pageRef} className="relative min-h-screen p-6 space-y-6 overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground
        variant="gradient2"
        intensity="light"
        animated={true}
      />

      <div ref={contentRef} className="relative z-10">
        <Suspense fallback={<ExamEditorSkeleton />}>
          {renderContent()}
        </Suspense>
      </div>
    </div>
  );
}

function ExamEditorSkeleton() {
  return (
    <div className="space-y-6">
      <AnimatedCard className="bg-card/60 backdrop-blur-sm border-0 shadow-lg p-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64 bg-primary/20" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 bg-primary/20" />
            </div>
          </div>
        </CardContent>
      </AnimatedCard>

      <div className="space-y-4 mt-6">
        <Skeleton className="h-8 w-48 bg-primary/20" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AnimatedCard
              key={i}
              className="overflow-hidden bg-card/60 backdrop-blur-sm border-0 shadow-lg"
              animationVariant="reveal"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-full max-w-[60%] bg-primary/20" />
                  <Skeleton className="h-6 w-16 bg-primary/20" />
                  <Skeleton className="h-6 w-12 rounded-full bg-primary/20" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full bg-primary/20" />
                      <Skeleton className="h-6 w-full bg-primary/20" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-9 w-20 bg-primary/20" />
                  <Skeleton className="h-9 w-20 bg-primary/20" />
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
}
