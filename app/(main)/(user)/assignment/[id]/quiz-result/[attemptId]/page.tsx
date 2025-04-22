"use server";

import { redirect, notFound } from "next/navigation";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Award, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizResultPageProps {
  params: {
    id: string;
    attemptId: string;
  };
}

export default async function QuizResultPage({ params }: QuizResultPageProps) {
  const { id: assignmentId, attemptId } = params;
  const { user } = await validateRequest();

  if (!user || !user.student) {
    return redirect("/login");
  }

  // Get quiz attempt information with all data needed
  const quizAttempt = await prisma.quizAttempt.findUnique({
    where: {
      id: attemptId,
      studentId: user.student.id,
    },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              answers: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
      questionAttempts: {
        include: {
          question: true,
          answerAttempts: {
            include: {
              answer: true,
            },
          },
        },
      },
    },
  });

  if (!quizAttempt) {
    return notFound();
  }

  // Get the assignment to verify it's a quiz assignment
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
      quizId: quizAttempt.quizId,
    },
  });

  if (!assignment) {
    return notFound();
  }

  // Calculate total possible points
  const totalPoints = quizAttempt.quiz.questions.reduce(
    (sum, question) => sum + question.points,
    0
  );

  // Calculate score percentage
  const scorePercentage = totalPoints > 0 
    ? Math.round((quizAttempt.score || 0) / totalPoints * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/assignment/${assignmentId}`}
          className="text-sm flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại bài tập
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{quizAttempt.quiz.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>Bắt đầu: {quizAttempt.startedAt ? format(quizAttempt.startedAt, 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}</div>
          <div>Kết thúc: {quizAttempt.finishedAt ? format(quizAttempt.finishedAt, 'dd/MM/yyyy HH:mm', { locale: vi }) : 'N/A'}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả bài làm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Điểm số</div>
                <div className="text-lg font-bold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  {quizAttempt.score} / {totalPoints} ({scorePercentage}%)
                </div>
              </div>
              <Progress value={scorePercentage} className="h-2 mb-8" />

              <div className="space-y-8">
                {quizAttempt.quiz.questions.map((question, index) => {
                  const questionAttempt = quizAttempt.questionAttempts.find(
                    qa => qa.questionId === question.id
                  );

                  const selectedAnswerIds = new Set(
                    questionAttempt?.answerAttempts
                      .filter(aa => aa.isSelected)
                      .map(aa => aa.answerId) || []
                  );

                  const correctAnswerIds = new Set(
                    question.answers
                      .filter(a => a.isCorrect)
                      .map(a => a.id)
                  );

                  // Check if all correct answers are selected and no wrong ones
                  const isAllCorrect = 
                    Array.from(correctAnswerIds).every(id => selectedAnswerIds.has(id)) && 
                    Array.from(selectedAnswerIds).every(id => correctAnswerIds.has(id));

                  return (
                    <div 
                      key={question.id}
                      className={`p-4 border rounded-lg ${isAllCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-lg">Câu {index + 1}</h3>
                        <div className="flex items-center">
                          {isAllCorrect ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-1" />
                              <span>Đúng</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="h-5 w-5 mr-1" />
                              <span>Sai</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div 
                        className="prose max-w-none mb-4"
                        dangerouslySetInnerHTML={{ __html: question.content }}
                      />

                      <div className="space-y-2">
                        {question.answers.map(answer => {
                          const isSelected = selectedAnswerIds.has(answer.id);
                          const isCorrect = answer.isCorrect;

                          let answerClass = "p-3 border rounded";
                          if (isSelected && isCorrect) {
                            answerClass += " bg-green-100 border-green-300";
                          } else if (isSelected && !isCorrect) {
                            answerClass += " bg-red-100 border-red-300";
                          } else if (!isSelected && isCorrect) {
                            answerClass += " bg-amber-50 border-amber-200";
                          }

                          return (
                            <div key={answer.id} className={answerClass}>
                              <div className="flex items-start">
                                <div className="flex-1">
                                  {answer.content}
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                  {isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                                  {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                                  {!isSelected && isCorrect && <CheckCircle className="h-5 w-5 text-amber-500" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Thông tin bài làm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tổng số câu hỏi</div>
                  <div className="font-medium">{quizAttempt.quiz.questions.length} câu hỏi</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tổng điểm</div>
                  <div className="font-medium">{totalPoints} điểm</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Điểm đạt được</div>
                  <div className="font-medium">{quizAttempt.score} điểm ({scorePercentage}%)</div>
                </div>
                {quizAttempt.startedAt && quizAttempt.finishedAt && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Thời gian làm bài</div>
                    <div className="font-medium">
                      {Math.round((quizAttempt.finishedAt.getTime() - quizAttempt.startedAt.getTime()) / 60000)} phút
                    </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href={`/assignment/${assignmentId}`}>
                      Quay lại bài tập
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 