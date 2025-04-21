"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Save, Trash2, ArrowLeft } from "lucide-react";
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
}

interface ExamWithQuestions {
  id: string;
  title: string;
  duration: number;
  showCorrectAfter: boolean;
  questions: {
    id: string;
    questionId: string;
    order: number | null;
    question: Question;
  }[];
}

interface ExamEditorProps {
  examId: string;
}

export default function ExamEditor({ examId }: ExamEditorProps) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [showCorrectAfter, setShowCorrectAfter] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}`);

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Exam not found");
          router.push("/admin/exams");
          return;
        }
        throw new Error("Failed to fetch exam");
      }

      const data = await res.json();
      setExam(data);
      setTitle(data.title);
      setDuration(data.duration || 60);
      setShowCorrectAfter(data.showCorrectAfter || false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title,
          duration,
          showCorrectAfter
        }),
      });

      if (!res.ok) throw new Error("Failed to update exam");

      toast.success("Exam settings updated");
      setIsEditing(false);
      fetchExam();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update exam");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete question");

      toast.success("Đã xóa câu hỏi");
      fetchExam();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsAddingQuestion(false);
  };

  const handleAddQuestion = () => {
    setIsAddingQuestion(true);
    setEditingQuestion(null);
  };

  const handleQuestionSaved = () => {
    setEditingQuestion(null);
    setIsAddingQuestion(false);
    fetchExam();
  };

  if (loading && !exam) {
    return <div className="text-center py-10">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/exams")}
          className="gap-1"
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
            
            <div className="flex gap-2 items-center">
              <div className="space-y-2 flex-1">
                <Label htmlFor="duration">Thời gian làm bài (phút)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-correct"
                checked={showCorrectAfter}
                onCheckedChange={setShowCorrectAfter}
              />
              <Label htmlFor="show-correct">Hiện đáp án đúng sau khi làm bài xong</Label>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleUpdateExam}>
                <Save className="h-4 w-4 mr-1" />
                Lưu thay đổi
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  if (exam) {
                    setTitle(exam.title);
                    setDuration(exam.duration);
                    setShowCorrectAfter(exam.showCorrectAfter);
                  }
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <h1 className="text-3xl font-bold">{exam?.title}</h1>
            <div className="flex justify-between items-center mt-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Thời gian: {exam?.duration} phút
                </p>
                <p className="text-sm text-muted-foreground">
                  Hiện đáp án sau khi làm xong: {exam?.showCorrectAfter ? "Có" : "Không"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
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
            <h2 className="text-xl font-semibold">Các câu hỏi</h2>
            <div className="flex gap-2">
              <ImportQuestionsButton examId={examId} onImportComplete={fetchExam} />
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm câu hỏi
              </Button>
            </div>
          </div>

          {exam?.questions.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <p className="text-muted-foreground">
                Chưa có câu hỏi nào được thêm vào. Thêm câu hỏi đầu tiên của
                bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exam?.questions.map(({ question, id: examQuestionId }) => (
                <Card key={examQuestionId} className="overflow-hidden">
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
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Bạn có chắc chắn muốn xóa?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Thao tác này sẽ xóa vĩnh viễn câu hỏi này và các
                                câu trả lời của nó. Không thể hoàn tác hành động
                                này.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteQuestion(question.id)
                                }
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(isAddingQuestion || editingQuestion) && (
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
