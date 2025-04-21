"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
            toast.info("Bạn đã hoàn thành bài kiểm tra này. Đang chuyển đến trang kết quả...");
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
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Có lỗi xảy ra</h1>
        <p className="mb-6">{error}</p>
        <Button onClick={() => router.push("/assignment")}>Quay lại</Button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài kiểm tra</h1>
        <p className="mb-6">
          Bài thi bạn đang tìm kiếm không tồn tại hoặc bạn không thể truy cập
          vào kỳ thi đó.
        </p>
        <Button onClick={() => router.push("/assignment")}>Quay lại</Button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredQuestionsCount = Object.keys(selectedAnswers).length;
  const progressPercentage =
    (answeredQuestionsCount / exam.questions.length) * 100;

  return (
    <div className="container py-6 mx-auto px-4">
      <div className="sticky top-0 bg-background pt-2 pb-4 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-orange-600">
              <Clock className="mr-1 h-4 w-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
            <Button variant="outline" onClick={() => setConfirmSubmit(true)}>
              <Send className="mr-2 h-4 w-4" />
              Nộp bài
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Progress value={progressPercentage} className="h-2" />
          <span className="text-sm whitespace-nowrap">
            {answeredQuestionsCount}/{exam.questions.length} câu đã trả lời
          </span>
        </div>
        <Separator />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        <div className="md:col-span-3">
          {currentQuestion && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium">
                        Câu {currentQuestionIndex + 1}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        ({currentQuestion.points} điểm)
                      </span>
                    </div>
                    <p>{currentQuestion.content}</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => toggleMarkQuestion(currentQuestion.id)}
                    className={
                      markedQuestions.includes(currentQuestion.id)
                        ? "text-yellow-500"
                        : ""
                    }
                  >
                    <span>Cần xem xét lại</span>
                    <BookmarkIcon className="h-5 w-5" />
                  </Button>
                </div>

                {currentQuestion.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question image"
                      className="max-w-full h-auto rounded-md"
                    />
                  </div>
                )}

                {currentQuestion.videoUrl && (
                  <div className="mb-4">
                    <video
                      src={currentQuestion.videoUrl}
                      controls
                      className="max-w-full h-auto rounded-md"
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
                      className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted"
                    >
                      <RadioGroupItem value={answer.id} id={answer.id} />
                      <Label
                        htmlFor={answer.id}
                        className="flex-1 cursor-pointer"
                      >
                        {answer.content}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                  >
                    Câu trước
                  </Button>
                  <Button
                    disabled={
                      currentQuestionIndex === exam.questions.length - 1
                    }
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  >
                    Câu sau
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-28">
            <h3 className="text-lg font-medium mb-3">Bảng câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((question, index) => {
                let bgClass = "bg-gray-100";

                if (selectedAnswers[question.id]) {
                  bgClass = "bg-green-100 text-green-800";
                }

                if (markedQuestions.includes(question.id)) {
                  bgClass = "bg-yellow-100 text-yellow-800";
                }

                if (index === currentQuestionIndex) {
                  bgClass += " ring-2 ring-primary";
                }

                return (
                  <Button
                    key={question.id}
                    variant="ghost"
                    className={`h-10 w-10 p-0 font-medium ${bgClass}`}
                    onClick={() => navigateToQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-sm">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span className="text-sm">Cần xem lại</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span className="text-sm">Chưa trả lời</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp bài</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn nộp bài thi của mình không? Bạn đã trả lời{" "}
              {answeredQuestionsCount} trong số {exam.questions.length} câu hỏi.
              {answeredQuestionsCount < exam.questions.length && (
                <p className="text-red-500 mt-2">
                  Cảnh báo: Bạn có{" "}
                  {exam.questions.length - answeredQuestionsCount} câu hỏi chưa
                  trả lời.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
