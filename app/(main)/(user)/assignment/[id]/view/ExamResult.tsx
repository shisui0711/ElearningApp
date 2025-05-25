"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeft, TimerIcon, Award, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useAnimation } from "@/provider/AnimationProvider";
import { AnimatedCard, CardContent, CardHeader, CardTitle } from "@/components/ui/animated-card";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  points: number;
  imageUrl?: string;
  videoUrl?: string;
  answers: Answer[];
}

interface ExamResult {
  id: string;
  title: string;
  description: string;
  startedAt: string;
  finishedAt: string;
  score: number;
  questions: Question[];
  savedAnswers: Record<string, string>;
  showCorrectAfter: boolean;
}

const ExamResult = ({ examId }: { examId: string }) => {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation refs
  const { gsap, isReady } = useAnimation();
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scoreCardRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const questionsListRef = useRef<HTMLDivElement>(null);
  // Animation effect
  useEffect(() => {
    if (!isReady || !result) return;

    // Create a timeline for animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the header
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );
    }

    // Animate the score card
    if (scoreCardRef.current) {
      tl.fromTo(
        scoreCardRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    // Animate the questions section
    if (questionsRef.current) {
      tl.fromTo(
        questionsRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.2"
      );
    }

    // Animate each question card with stagger
    if (questionsListRef.current) {
      const questionCards = questionsListRef.current.querySelectorAll('.question-card');
      tl.fromTo(
        questionCards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out"
        },
        "-=0.2"
      );
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap, result]);

  useEffect(() => {
    async function fetchExamResult() {
      try {
        const response = await fetch(
          `/api/student/exams/${examId}?completed=true`
        );

        if (response.status === 403) {
          const errorData = await response.json();
          if (
            errorData.error ===
            "You cannot view results until you complete the exam"
          ) {
            toast.error("Bạn chưa hoàn thành bài kiểm tra này");
            router.push(`/assignment/${examId}/take`);
            return;
          }
        }

        if (!response.ok) {
          throw new Error("Failed to fetch exam results");
        }

        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("Error fetching exam results:", error);
        setError("Có lỗi khi tải kết quả bài thi. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    fetchExamResult();
  }, [examId, router]);

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-gradient-1 text-lg font-medium">Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <AnimatedBackground variant="gradient3" intensity="light" />
        <div className="relative z-10 bg-card/80 p-8 rounded-xl backdrop-blur-sm border max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gradient-3">Có lỗi xảy ra</h1>
          <p className="mb-6">{error}</p>
          <Button
            onClick={() => router.push("/assignment")}
            className="gradient-1 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container py-10 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <AnimatedBackground variant="gradient3" intensity="light" />
        <div className="relative z-10 bg-card/80 p-8 rounded-xl backdrop-blur-sm border max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gradient-3">Không tìm thấy kết quả</h1>
          <p className="mb-6">
            Kết quả kỳ thi bạn đang tìm kiếm không tồn tại hoặc bạn không thể truy
            cập vào chúng.
          </p>
          <Button
            onClick={() => router.push("/assignment")}
            className="gradient-1 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Calculate percentage score
  const percentage = parseFloat(
    (
      (result.score /
        result.questions.reduce((sum, item) => sum + item.points, 0)) *
      100
    ).toFixed(1)
  );

  // We can only calculate correct/incorrect counts if showCorrectAfter is true
  let correct = 0;
  let incorrect = 0;

  if (result.showCorrectAfter) {
    correct = Object.values(result.savedAnswers).filter((answerId, index) => {
      const question = result.questions[index];
      const selectedAnswer = question.answers.find((a) => a.id === answerId);
      return selectedAnswer?.isCorrect;
    }).length;
    incorrect = Object.keys(result.savedAnswers).length - correct;
  }

  const unanswered =
    result.questions.length - Object.keys(result.savedAnswers).length;

  // Calculate time taken
  const startTime = new Date(result.startedAt).getTime();
  const endTime = new Date(result.finishedAt).getTime();
  const timeTakenMs = endTime - startTime;
  const hours = Math.floor(timeTakenMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeTakenMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeTakenMs % (1000 * 60)) / 1000);
  const timeTaken = `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;

  return (
    <div ref={pageRef} className="container py-6 mx-auto px-4 relative min-h-screen">
      {/* Animated background */}
      <AnimatedBackground variant="gradient1" intensity="light" />

      {/* Header section */}
      <div ref={headerRef} className="mb-8 relative z-10">
        <Button
          variant="outline"
          onClick={() => router.push("/assignment")}
          className="mb-4 glass hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <h1 className="text-3xl font-bold mb-3 text-gradient-1">{result.title} - Kết quả</h1>

        <div className="flex flex-wrap gap-4 text-sm mb-4 bg-card/60 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            <span>Hoàn thành {formatTimeAgo(new Date(result.finishedAt))}</span>
          </div>
          <div className="flex items-center">
            <TimerIcon className="mr-2 h-5 w-5 text-primary" />
            <span className="font-medium">{timeTaken}</span>
          </div>
        </div>

        <div ref={scoreCardRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <AnimatedCard
            glassMorphism
            animationVariant="none"
            className="overflow-hidden"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Award className="mr-2 h-6 w-6 text-primary" />
                Kết quả bài thi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6 p-4 bg-card/60 rounded-xl">
                <div className="text-5xl font-bold mb-2 text-gradient-1">
                  {parseFloat(
                    (
                      (result.score /
                        result.questions.reduce(
                          (sum, item) => sum + item.points,
                          0
                        )) *
                      10
                    ).toFixed(1)
                  )}
                </div>
                <div className="text-lg font-medium text-muted-foreground mb-3">
                  Đạt {percentage}% số điểm
                </div>
                <Progress value={percentage} className="h-3 w-full mb-2 bg-primary/20" />

                <div className="w-full flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                {result.showCorrectAfter && (
                  <>
                    <div className="flex flex-col items-center p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">{correct}</div>
                      <div className="text-sm text-green-700">Câu đúng</div>
                    </div>

                    <div className="flex flex-col items-center p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600 mb-1">{incorrect}</div>
                      <div className="text-sm text-red-700">Câu sai</div>
                    </div>
                  </>
                )}
              </div>

              {unanswered > 0 && (
                <div className="flex items-center justify-center p-2 bg-muted/50 rounded-lg mt-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{unanswered}</span> câu chưa trả lời
                  </div>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        </div>
      </div>

      {/* Questions review section */}
      <div ref={questionsRef} className="relative z-10">
        <h2 className="text-2xl font-semibold mb-4 text-gradient-1 flex items-center">
          <FileText className="mr-2 h-6 w-6" />
          Xem lại bài thi
        </h2>
        <Separator className="mb-6" />

        <div ref={questionsListRef} className="space-y-6">
          {result.questions.map((question, index) => {
            const selectedAnswerId = result.savedAnswers[question.id];
            const selectedAnswer = question.answers.find(
              (a) => a.id === selectedAnswerId
            );
            const isCorrect = selectedAnswer?.isCorrect;

            // If showCorrectAfter is false, we can't show correctness indicators
            let cardClassName = "question-card overflow-hidden";

            // Add appropriate classes based on correctness
            if (result.showCorrectAfter && selectedAnswerId) {
              if (isCorrect) {
                cardClassName += " border-green-200";
              } else {
                cardClassName += " border-red-200";
              }
            }

            return (
              <AnimatedCard
                key={question.id}
                className={cardClassName}
                gradientBorder
                animationVariant="none"
              >
                <CardContent className="p-6 bg-card">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-3 bg-card/60 p-3 rounded-lg backdrop-blur-sm">
                        <h3 className="text-lg font-medium flex items-center flex-wrap gap-2">
                          <span className="mr-1 text-gradient-1 font-bold">Câu {index + 1}</span>
                          <div className="px-3 py-1 bg-primary/10 rounded-full text-primary font-semibold ml-2">
                            {question.points} điểm
                          </div>
                        </h3>

                        <div className="flex items-center">
                          {selectedAnswerId ? (
                            result.showCorrectAfter ? (
                              isCorrect ? (
                                <Badge className="gradient-2 text-white px-3 py-1 text-sm font-medium">
                                  <Check className="mr-1 h-4 w-4" />
                                  Đúng
                                </Badge>
                              ) : (
                                <Badge className="gradient-3 text-white px-3 py-1 text-sm font-medium">
                                  <X className="mr-1 h-4 w-4" />
                                  Sai
                                </Badge>
                              )
                            ) : null
                          ) : (
                            <Badge className="gradient-4 text-white px-3 py-1 text-sm font-medium">
                              Chưa trả lời
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-16">{question.content}</p>
                    </div>
                  </div>

                  {question.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={question.imageUrl}
                        alt="Question image"
                        className="max-w-full h-auto rounded-md border border-border"
                      />
                    </div>
                  )}

                  {question.videoUrl && (
                    <div className="mb-4">
                      <video
                        src={question.videoUrl}
                        controls
                        className="max-w-full h-auto rounded-md border border-border"
                      />
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Các đáp án:</h4>
                    <div className="space-y-4">
                      {question.answers.map((answer) => {
                        let className =
                          "flex items-center justify-between rounded-lg border p-4 transition-all";

                        // Styling for correct/incorrect answers
                        if (result.showCorrectAfter) {
                          if (answer.isCorrect) {
                            className += " border-green-300 bg-green-50/50 dark:bg-green-950/20";
                          } else if (
                            selectedAnswerId === answer.id &&
                            !answer.isCorrect
                          ) {
                            className += " border-red-300 bg-red-50/50 dark:bg-red-950/20";
                          }
                        }

                        // Highlight selected answer
                        if (answer.id === selectedAnswerId) {
                          className += " ring-2 ring-primary shadow-md";
                        }

                        return (
                          <div key={answer.id} className={className}>
                            <div className="flex items-center flex-1">
                              {/* Selection indicator */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                answer.id === selectedAnswerId
                                  ? 'gradient-1 text-white'
                                  : 'border-2 border-muted-foreground/30'
                              }`}>
                                {answer.id === selectedAnswerId && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>

                              {/* Answer content */}
                              <p className={
                                answer.isCorrect && result.showCorrectAfter
                                  ? "font-medium"
                                  : answer.id === selectedAnswerId
                                  ? "font-medium"
                                  : ""
                              }>
                                {answer.content}
                              </p>
                            </div>

                            {/* Status badges */}
                            <div className="flex items-center ml-4">
                              {answer.id === selectedAnswerId && (
                                <Badge className="gradient-1 text-white px-3 py-1 mr-2">
                                  Đã chọn
                                </Badge>
                              )}

                              {result.showCorrectAfter && answer.isCorrect && (
                                <Badge className="gradient-2 text-white px-3 py-1">
                                  <Check className="mr-1 h-4 w-4" />
                                  Đáp án đúng
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
