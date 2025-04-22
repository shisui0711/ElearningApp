"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface QuizAnswer {
  id: string;
  content: string;
  isSelected: boolean;
}

interface QuizQuestion {
  id: string;
  content: string;
  answers: QuizAnswer[];
}

interface QuizAttemptProps {
  attemptId: string;
  assignmentId: string;
  quiz: {
    id: string;
    title: string;
    timeLimit: number | null;
    questions: QuizQuestion[];
  };
}

export default function QuizAttemptClient({ attemptId, assignmentId, quiz }: QuizAttemptProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz.questions);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<Date>(new Date());

  useEffect(() => {
    if (timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleToggleAnswer = async (questionIndex: number, answerId: string) => {
    try {
      // Toggle the answer locally
      const updatedQuestions = [...questions];
      const answer = updatedQuestions[questionIndex].answers.find(a => a.id === answerId);
      if (answer) {
        answer.isSelected = !answer.isSelected;
        setQuestions(updatedQuestions);
      }

      // Save the answer to the server
      await fetch(`/api/quizzes/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: updatedQuestions[questionIndex].id,
          answerId,
          isSelected: answer?.isSelected,
        }),
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Failed to save your answer. Please try again.");
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quizzes/attempts/${attemptId}/finish`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit quiz");
      }

      toast.success("Bài làm đã được nộp thành công");
      router.push(`/assignment/${assignmentId}/quiz-result/${attemptId}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "Không giới hạn";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    const answeredCount = questions.filter(q => q.answers.some(a => a.isSelected)).length;
    return Math.round((answeredCount / questions.length) * 100);
  };

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Bắt đầu {formatDistanceToNow(startTime, { locale: vi, addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={timeRemaining < 60 ? "text-red-500 font-bold" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          <Button 
            onClick={handleSubmitQuiz} 
            disabled={isSubmitting}
            variant="outline"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang nộp bài...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Nộp bài
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Tiến độ làm bài</span>
          <span className="text-sm font-medium">
            {getProgress()}% ({questions.filter(q => q.answers.some(a => a.isSelected)).length}/
            {questions.length})
          </span>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Câu {currentQuestion + 1}/{questions.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none mb-6">
                <div dangerouslySetInnerHTML={{ __html: currentQuestionData.content }} />
              </div>

              <div className="space-y-4">
                {currentQuestionData.answers.map((answer) => (
                  <div key={answer.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={answer.id}
                      checked={answer.isSelected}
                      onCheckedChange={() => handleToggleAnswer(currentQuestion, answer.id)}
                    />
                    <Label
                      htmlFor={answer.id}
                      className="text-base cursor-pointer flex-1 font-normal"
                    >
                      {answer.content}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Câu trước
              </Button>
              <Button 
                onClick={handleNextQuestion}
                disabled={currentQuestion === questions.length - 1}
              >
                Câu tiếp
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = q.answers.some(a => a.isSelected);
                  const isCurrent = index === currentQuestion;

                  return (
                    <Button
                      key={q.id}
                      variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                      className="h-10 w-10"
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang nộp bài...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Hoàn thành bài làm
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 