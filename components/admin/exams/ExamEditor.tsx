"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Pencil, Plus, Save, Trash2, ArrowLeft, Loader2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import QuestionForm from "./QuestionForm";
import ImportQuestionsButton from "./ImportQuestionsButton";
import QuestionGeneratorButton from "./QuestionGeneratorButton";

interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  points: number;
  answers: Answer[];
  difficulty?: string;
}

interface ExamWithQuestions {
  id: string;
  title: string;
  questions: {
    id: string;
    questionId: string;
    order: number | null;
    question: Question;
  }[];
}

interface ExamEditorProps {
  examId: string;
  onAddQuestion?: () => void;
  onEditQuestion?: (question: Question) => void;
}

export default function ExamEditor({ examId, onAddQuestion, onEditQuestion }: ExamEditorProps) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch exam");
      }

      const data = await response.json();
      setExam(data);
      setTitle(data.title);
    } catch (error) {
      console.error(error);
      setError("Không thể tải bài kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update exam");
      }

      await fetchExam();
      setIsEditing(false);
      toast.success("Đã cập nhật bài kiểm tra thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật bài kiểm tra");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/exams/${examId}/questions/${questionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      await fetchExam();
      toast.success("Đã xóa câu hỏi thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa câu hỏi");
    }
  };

  const handleEditQuestion = (question: Question) => {
    if (onEditQuestion) {
      onEditQuestion(question);
    } else {
      setEditingQuestion(question);
      setIsAddingQuestion(false);
    }
  };

  const handleAddQuestion = () => {
    if (onAddQuestion) {
      onAddQuestion();
    } else {
      setIsAddingQuestion(true);
      setEditingQuestion(null);
    }
  };

  const handleQuestionSaved = () => {
    setIsAddingQuestion(false);
    setEditingQuestion(null);
    fetchExam();
  };

  // Filter questions based on search term
  const filteredQuestions = exam?.questions.filter(({ question }) => 
    question.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-60 bg-card/60 rounded-lg backdrop-blur-sm border p-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Đang tải dữ liệu bài kiểm tra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push("/admin/exams")}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/exams")}
          className="gap-1 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <div className="flex justify-between items-center">
        {isEditing ? (
          <div className="space-y-4 w-full">
            <div className="flex gap-2 items-center">
              <div className="space-y-2 flex-1">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleUpdateExam}
                className="bg-gradient-to-r from-[hsl(var(--gradient-2-start))] to-[hsl(var(--gradient-2-end))] hover:opacity-90 text-white border-0"
              >
                <Save className="h-4 w-4 mr-1" />
                Lưu thay đổi
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  if (exam) {
                    setTitle(exam.title);
                  }
                }}
                className="hover:bg-primary/10"
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <h1 className="text-3xl font-bold text-gradient-2">{exam?.title}</h1>
            <div className="flex justify-between items-center mt-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Số câu hỏi: {exam?.questions.length || 0}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="hover:bg-primary/10"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isAddingQuestion && !editingQuestion && (
        <div className="space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gradient-2">Các câu hỏi</h2>
            <div className="flex gap-2">
              <ImportQuestionsButton
                examId={examId}
                onImportComplete={fetchExam}
              />
              <QuestionGeneratorButton
                examId={examId}
                onQuestionsGenerated={fetchExam}
              />
              <Button
                onClick={handleAddQuestion}
                className="bg-gradient-to-r from-[hsl(var(--gradient-2-start))] to-[hsl(var(--gradient-2-end))] hover:opacity-90 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm câu hỏi
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card/60 backdrop-blur-sm">
              <p className="text-muted-foreground">
                {exam?.questions.length === 0 
                  ? "Chưa có câu hỏi nào được thêm vào. Thêm câu hỏi đầu tiên của bạn."
                  : "Không tìm thấy câu hỏi nào phù hợp."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map(({ question, id: examQuestionId }) => (
                <AnimatedCard
                  key={examQuestionId}
                  className="overflow-hidden bg-card/60 backdrop-blur-sm border-0 shadow-lg"
                  animationVariant="hover"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">
                            {question.content}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            ({question.points} điểm)
                          </span>
                          <span
                            className={`text-sm px-2 py-0.5 rounded-full ${
                              question.difficulty === "EASY"
                                ? "bg-green-100/80 text-green-800 backdrop-blur-sm"
                                : question.difficulty === "MEDIUM"
                                ? "bg-yellow-100/80 text-yellow-800 backdrop-blur-sm"
                                : "bg-red-100/80 text-red-800 backdrop-blur-sm"
                            }`}
                          >
                            {question.difficulty === "EASY"
                              ? "Dễ"
                              : question.difficulty === "MEDIUM"
                              ? "Trung bình"
                              : "Khó"}
                          </span>
                        </div>
                        <div className="space-y-2 pl-5">
                          {question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`h-4 w-4 rounded-full ${
                                  answer.isCorrect
                                    ? "bg-green-500"
                                    : "bg-gray-200"
                                }`}
                              />
                              <p
                                className={
                                  answer.isCorrect ? "font-medium" : ""
                                }
                              >
                                {answer.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Chỉnh sửa
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card/95 backdrop-blur-sm border-0 shadow-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl text-gradient-3">
                                Bạn có chắc chắn muốn xóa?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Thao tác này sẽ xóa vĩnh viễn câu hỏi này và các
                                câu trả lời của nó. Không thể hoàn tác hành động
                                này.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="hover:bg-primary/10">Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteQuestion(question.id)
                                }
                                className="bg-gradient-to-r from-[hsl(var(--gradient-3-start))] to-[hsl(var(--gradient-3-end))] hover:opacity-90 text-white border-0"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      )}

      {(isAddingQuestion || editingQuestion) && !onAddQuestion && !onEditQuestion && (
        <QuestionForm
          examId={examId}
          question={editingQuestion}
          onCancel={() => {
            setIsAddingQuestion(false);
            setEditingQuestion(null);
          }}
          onSaved={handleQuestionSaved}
        />
      )}
    </div>
  );
}
