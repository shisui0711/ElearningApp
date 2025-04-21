"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ArrowLeft, TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";

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

  if (!result) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy kết quả</h1>
        <p className="mb-6">
          Kết quả kỳ thi bạn đang tìm kiếm không tồn tại hoặc bạn không thể truy
          cập vào chúng.
        </p>
        <Button onClick={() => router.push("/assignment")}>Quay lại</Button>
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
    <div className="container py-6 mx-auto px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/assignment")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <h1 className="text-2xl font-bold mb-2">{result.title} - Kết quả</h1>

        <div className="flex flex-wrap gap-2 text-sm mb-4">
          <div className="flex items-center">
            <TimerIcon className="mr-1 h-4 w-4 text-gray-500" />
            <span>Hoàn thành {formatTimeAgo(new Date(result.finishedAt))}</span>
          </div>
          <div className="flex items-center ml-4">
            <span className="text-gray-500">Thời gian làm bài: </span>
            <span className="ml-1 font-medium">{timeTaken}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Điểm của bạn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
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
                <span className="text-lg font-normal text-gray-500 ml-2">
                  ({percentage}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2 mb-4" />
              <div className="flex flex-wrap gap-2">
                {result.showCorrectAfter && (
                  <>
                    <Badge className="bg-green-100 text-green-800">
                      {correct} đúng
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      {incorrect} sai
                    </Badge>
                  </>
                )}
                {unanswered > 0 && (
                  <Badge className="bg-gray-100 text-gray-800">
                    {unanswered} chưa trả lời
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Xem lại bài thi</h2>
      <Separator className="mb-6" />

      <div className="space-y-6">
        {result.questions.map((question, index) => {
          const selectedAnswerId = result.savedAnswers[question.id];
          const selectedAnswer = question.answers.find(
            (a) => a.id === selectedAnswerId
          );
          const correctAnswer = question.answers.find((a) => a.isCorrect);
          const isCorrect = selectedAnswer?.isCorrect;

          // If showCorrectAfter is false, we can't show correctness indicators
          const cardClassName = !result.showCorrectAfter
            ? "border-gray-200"
            : selectedAnswerId
            ? isCorrect
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
            : "border-gray-200 bg-gray-50";

          return (
            <Card key={question.id} className={cardClassName}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium flex items-center">
                      <span className="mr-2">Câu {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        ({question.points} điểm)
                      </span>

                      {selectedAnswerId ? (
                        result.showCorrectAfter ? (
                          isCorrect ? (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              Đúng
                            </Badge>
                          ) : (
                            <Badge className="ml-2 bg-red-100 text-red-800">
                              Sai
                            </Badge>
                          )
                        ) : null
                      ) : (
                        <Badge className="ml-2 bg-gray-100 text-gray-800">
                          Chưa trả lời
                        </Badge>
                      )}
                    </h3>
                    <p className="mt-2">{question.content}</p>
                  </div>
                </div>

                {question.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={question.imageUrl}
                      alt="Question image"
                      className="max-w-full h-auto rounded-md"
                    />
                  </div>
                )}

                {question.videoUrl && (
                  <div className="mb-4">
                    <video
                      src={question.videoUrl}
                      controls
                      className="max-w-full h-auto rounded-md"
                    />
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  {question.answers.map((answer) => {
                    let className =
                      "flex items-center space-x-2 rounded-md border p-3";

                    if (result.showCorrectAfter) {
                      if (answer.isCorrect) {
                        className += " border-green-300 bg-green-50";
                      } else if (
                        selectedAnswerId === answer.id &&
                        !answer.isCorrect
                      ) {
                        className += " border-red-300 bg-red-50";
                      }
                    }

                    return (
                      <div key={answer.id} className={className}>
                        <div className="flex-1">
                          <p
                            className={
                              answer.isCorrect && result.showCorrectAfter
                                ? "font-medium"
                                : ""
                            }
                          >
                            {answer.content}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {answer.id === selectedAnswerId && (
                            <Badge className="mr-2 bg-blue-100 text-blue-800">
                              Đã chọn
                            </Badge>
                          )}

                          {result.showCorrectAfter &&
                            (answer.isCorrect ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : selectedAnswerId === answer.id ? (
                              <X className="h-5 w-5 text-red-600" />
                            ) : null)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ExamResult;
