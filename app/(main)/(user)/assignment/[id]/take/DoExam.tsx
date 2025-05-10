"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon, Clock, Send, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimatedCard, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/animated-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAnimation } from "@/provider/AnimationProvider";
import { cn } from "@/lib/utils";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Question {
  id: string;
  content: string;
  points: number;
  imageUrl?: string;
  videoUrl?: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: Question[];
  startedAt: string;
  finishedAt: string | null;
}

export default function DoExam({ examId }: { examId: string }) {
  const router = useRouter();
  const { gsap, isReady } = useAnimation();
  const questionCardRef = useRef<HTMLDivElement>(null);

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [markedQuestions, setMarkedQuestions] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchExam() {
      try {
        const response = await fetch(`/api/student/exams/${examId}`);

        if (response.status === 403) {
          // If the exam is already completed, redirect to results page
          const errorData = await response.json();
          if (errorData.error === "This exam has already been completed") {
            toast.info(
              "Bạn đã hoàn thành bài kiểm tra này. Đang chuyển đến trang kết quả..."
            );
            router.push(`/assignment/${examId}/view`);
            return;
          }
        }

        if (!response.ok) {
          throw new Error("Failed to fetch exam");
        }

        const data = await response.json();
        setExam(data);

        // Calculate remaining time
        if (data.duration && data.startedAt && !data.finishedAt) {
          const startTime = new Date(data.startedAt).getTime();
          const totalTimeInMs = data.duration * 60 * 1000;
          const endTime = startTime + totalTimeInMs;
          const now = Date.now();
          const remainingMs = Math.max(0, endTime - now);

          setTimeRemaining(Math.floor(remainingMs / 1000));
        }

        // Initialize selected answers from saved data if available
        if (data.savedAnswers) {
          setSelectedAnswers(data.savedAnswers);
        }

        // Initialize marked questions if available
        if (data.markedQuestions) {
          setMarkedQuestions(data.markedQuestions);
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
        setError("Có lỗi xảy ra. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    fetchExam();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examId, router]);

  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);

  const handleTimeUp = async () => {
    toast.warning("Đã hết giờ! Bài thi của bạn đang được nộp...");
    await handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));

    // Automatically save answer after selection
    saveAnswer(questionId, answerId);
  };

  const saveAnswer = async (questionId: string, answerId: string) => {
    try {
      await fetch(`/api/student/exams/${examId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          answerId,
        }),
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      // Don't show error to user as this is a background operation
    }
  };

  const toggleMarkQuestion = (questionId: string) => {
    setMarkedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });

    // Save marked questions
    saveMarkedQuestions([...markedQuestions, questionId]);
  };

  const saveMarkedQuestions = async (questionIds: string[]) => {
    try {
      await fetch(`/api/student/exams/${examId}/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markedQuestions: questionIds,
        }),
      });
    } catch (error) {
      console.error("Error saving marked questions:", error);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit exam");
      }

      toast.success("Đã nộp bài thi thành công.");
      router.push(`/assignment/${examId}/view`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  };

  const navigateToQuestion = (index: number) => {
    // Animate question transition if GSAP is ready
    if (isReady && questionCardRef.current) {
      gsap.fromTo(
        questionCardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }

    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground variant="gradient2" intensity="light" />
        <div className="container py-10 flex items-center justify-center min-h-screen">
          <div className="text-center bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-lg font-medium text-gradient-2">Đang tải bài kiểm tra...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground variant="gradient3" intensity="light" />
        <div className="container py-10 flex items-center justify-center min-h-screen">
          <div className="text-center bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-gradient-3">Có lỗi xảy ra</h1>
            <p className="mb-6 text-muted-foreground">{error}</p>
            <AnimatedButton
              onClick={() => router.push("/assignment")}
              animationVariant="hover"
              className="gap-2"
            >
              Quay lại
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground variant="gradient2" intensity="light" />
        <div className="container py-10 flex items-center justify-center min-h-screen">
          <div className="text-center bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-lg border max-w-md">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-gradient-2">Không tìm thấy bài kiểm tra</h1>
            <p className="mb-6 text-muted-foreground">
              Bài thi bạn đang tìm kiếm không tồn tại hoặc bạn không thể truy cập
              vào kỳ thi đó.
            </p>
            <AnimatedButton
              onClick={() => router.push("/assignment")}
              animationVariant="hover"
              className="gap-2"
            >
              Quay lại
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredQuestionsCount = Object.keys(selectedAnswers).length;
  const progressPercentage =
    (answeredQuestionsCount / exam.questions.length) * 100;

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="gradient2" intensity="light" />

      <div className="container py-6 mx-auto px-4 relative z-10 bg-background/80 backdrop-blur-sm min-h-screen rounded-lg">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md pt-2 pb-4 z-10 rounded-lg shadow-sm px-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gradient-2">{exam.title}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                <Clock className="mr-2 h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              <AnimatedButton
                variant="outline"
                onClick={() => setConfirmSubmit(true)}
                animationVariant="hover"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Nộp bài
              </AnimatedButton>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Progress value={progressPercentage} className="h-2.5 bg-muted/50" />
            <span className="text-sm whitespace-nowrap font-medium">
              {answeredQuestionsCount}/{exam.questions.length} câu đã trả lời
            </span>
          </div>
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-3">
            {currentQuestion && (
              <AnimatedCard
                ref={questionCardRef}
                animationVariant="reveal"
                gradientBorder={true}
                className="overflow-hidden bg-card shadow-md"
              >
                <CardHeader className="bg-gradient-to-r from-blue-100/80 via-cyan-50/50 to-transparent pb-2 dark:from-blue-900/20 dark:via-cyan-900/10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-gradient-2">
                        Câu {currentQuestionIndex + 1}
                        <span className="text-sm bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full ml-1 dark:bg-green-900/40 dark:text-green-300">
                          {currentQuestion.points} điểm
                        </span>
                      </CardTitle>
                      <CardDescription className="text-base font-medium text-foreground">
                        {currentQuestion.content}
                      </CardDescription>
                    </div>
                    <AnimatedButton
                      variant="ghost"
                      onClick={() => toggleMarkQuestion(currentQuestion.id)}
                      className={cn(
                        "gap-2",
                        markedQuestions.includes(currentQuestion.id)
                          ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-950/30 "
                          : ""
                      )}
                      animationVariant="hover"
                    >
                      <span>Đánh dấu</span>
                      <BookmarkIcon className="h-4 w-4" />
                    </AnimatedButton>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-4 bg-card">
                  {currentQuestion.imageUrl && (
                    <div className="mb-6 mt-2">
                      <img
                        src={currentQuestion.imageUrl}
                        alt="Question image"
                        className="max-w-full h-auto rounded-md shadow-md"
                      />
                    </div>
                  )}

                  {currentQuestion.videoUrl && (
                    <div className="mb-6 mt-2">
                      <video
                        src={currentQuestion.videoUrl}
                        controls
                        className="max-w-full h-auto rounded-md shadow-md"
                      />
                    </div>
                  )}

                  <RadioGroup
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onValueChange={(value) =>
                      handleAnswerSelect(currentQuestion.id, value)
                    }
                    className="space-y-3"
                  >
                    {currentQuestion.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={cn(
                          "flex items-center space-x-3 rounded-md border p-4 transition-all",
                          selectedAnswers[currentQuestion.id] === answer.id
                            ? "bg-green-100 border-green-300 shadow-sm dark:bg-green-950/40 dark:border-green-700/50 text-green-800 dark:text-green-400"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem
                          value={answer.id}
                          id={answer.id}
                          className={selectedAnswers[currentQuestion.id] === answer.id ? "text-green-600 border-green-400 dark:text-green-400 dark:border-green-500" : ""}
                        />
                        <Label
                          htmlFor={answer.id}
                          className={cn(
                            "flex-1 cursor-pointer",
                            selectedAnswers[currentQuestion.id] === answer.id
                              ? "font-medium text-green-800 dark:text-green-400"
                              : "text-foreground/90"
                          )}
                        >
                          {answer.content}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex justify-between mt-8">
                    <AnimatedButton
                      variant="outline"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                      animationVariant="hover"
                      className="gap-2"
                    >
                      Câu trước
                    </AnimatedButton>
                    {currentQuestionIndex !== exam.questions.length - 1 ? (
                      <AnimatedButton
                        onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                        animationVariant="hover"
                        gradientVariant="gradient2"
                        className="gap-2"
                      >
                        Câu sau
                      </AnimatedButton>
                    ) : (
                      <AnimatedButton
                        variant="default"
                        onClick={() => setConfirmSubmit(true)}
                        animationVariant="pulse"
                        gradientVariant="gradient2"
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Nộp bài
                      </AnimatedButton>
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-28">
              <h3 className="text-lg font-medium mb-3 text-gradient-2">Bảng câu hỏi</h3>
              <div className="bg-card p-4 rounded-lg shadow-sm border mb-4">
                <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((question, index) => {
                  const isAnswered = !!selectedAnswers[question.id];
                  const isMarked = markedQuestions.includes(question.id);
                  const isActive = index === currentQuestionIndex;

                  return (
                    <AnimatedButton
                      key={question.id}
                      variant="ghost"
                      className={cn(
                        "h-10 w-10 p-0 font-medium relative",
                        isAnswered && !isMarked && "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-950/60 font-medium",
                        isMarked && "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-950/60 font-medium",
                        !isAnswered && !isMarked && "bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-800/60",
                        isActive && "ring-2 ring-blue-500 shadow-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                      )}
                      onClick={() => navigateToQuestion(index)}
                      animationVariant="hover"
                    >
                      {index + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
                      )}
                    </AnimatedButton>
                  );
                })}
              </div>

              </div>
              <div className="mt-4 space-y-3 bg-card p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookmarkIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Cần xem lại</span>
                </div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Chưa trả lời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gradient-2 text-xl">Nộp bài kiểm tra</DialogTitle>
            <DialogDescription className="pt-2">
              Bạn có chắc chắn muốn nộp bài thi của mình không?

              <div className="mt-4 p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
                <span>Số câu đã trả lời:</span>
                <span className="font-medium">{answeredQuestionsCount}/{exam.questions.length}</span>
              </div>

              {answeredQuestionsCount < exam.questions.length && (
                <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>
                    Bạn còn {exam.questions.length - answeredQuestionsCount} câu hỏi chưa
                    trả lời.
                  </p>
                </div>
              )}

              {answeredQuestionsCount === exam.questions.length && (
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/30 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p>
                    Bạn đã trả lời tất cả các câu hỏi.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <AnimatedButton
              variant="outline"
              onClick={() => setConfirmSubmit(false)}
              animationVariant="hover"
            >
              Quay lại làm bài
            </AnimatedButton>
            <AnimatedButton
              onClick={handleSubmit}
              disabled={submitting}
              animationVariant={submitting ? "none" : "pulse"}
              gradientVariant={submitting ? "none" : "gradient2"}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Nộp bài
                </>
              )}
            </AnimatedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
