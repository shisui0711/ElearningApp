"use client";

import { useState, useEffect, useRef } from "react";
import ExamEditor from "./ExamEditor";
import ModernQuestionForm from "./ModernQuestionForm";
import { AnimatedCard, CardContent, CardHeader, CardTitle } from "@/components/ui/animated-card";
import { useAnimation } from "@/provider/AnimationProvider";
import { FileText } from "lucide-react";

interface ModernExamEditorProps {
  examId: string;
}

export default function ModernExamEditor({ examId }: ModernExamEditorProps) {
  const { gsap, isReady } = useAnimation();
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  useEffect(() => {
    if (!isReady || !headerRef.current || !contentRef.current) return;

    // Create animation for the header
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );

    // Create animation for the content with a slight delay
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.out"
      }
    );

    return () => {
      if (headerRef.current) gsap.killTweensOf(headerRef.current);
      if (contentRef.current) gsap.killTweensOf(contentRef.current);
    };
  }, [isReady, gsap]);

  // Handlers for question form
  const handleAddQuestion = () => {
    setIsAddingQuestion(true);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setIsAddingQuestion(false);
  };

  const handleQuestionSaved = () => {
    setIsAddingQuestion(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-6">
      <AnimatedCard
        ref={headerRef}
        className="bg-card/60 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
        glassMorphism
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-gradient-2 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Chi tiết bài kiểm tra
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground">
            Quản lý thông tin và câu hỏi của bài kiểm tra
          </p>
        </CardContent>
      </AnimatedCard>

      <div ref={contentRef} className="space-y-6">
        {(isAddingQuestion || editingQuestion) ? (
          <ModernQuestionForm
            examId={examId}
            question={editingQuestion}
            onCancel={() => {
              setIsAddingQuestion(false);
              setEditingQuestion(null);
            }}
            onSaved={handleQuestionSaved}
          />
        ) : (
          <ExamEditor
            examId={examId}
            onAddQuestion={handleAddQuestion}
            onEditQuestion={handleEditQuestion}
          />
        )}
      </div>
    </div>
  );
}
