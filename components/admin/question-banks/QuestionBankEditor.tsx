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
import { QuestionBankWithDetail } from "@/types";

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

interface QuestionBankWithQuestions {
  id: string;
  title: string;
  questions: {
    id: string;
    questionId: string;
    order: number | null;
    question: Question;
  }[];
}

interface QuestionBankEditorProps {
  questionBankId: string;
}

export default function QuestionBankEditor({ questionBankId }: QuestionBankEditorProps) {
  const router = useRouter();
  const [questionBank, setQuestionBank] = useState<QuestionBankWithDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [showCorrectAfter, setShowCorrectAfter] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  useEffect(() => {
    fetchQuestionBank();
  }, [questionBankId]);

  const fetchQuestionBank = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/question-banks/${questionBankId}`);

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Ngân hàng câu hỏi không tồn tại");
          router.push("/admin/question-banks");
          return;
        }
        throw new Error("Failed to fetch question bank");
      }

      const data = await res.json();
      console.log(data);
      setQuestionBank(data);
      setTitle(data.title);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load question bank");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestionBank = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      const res = await fetch(`/api/question-banks/${questionBankId}`, {
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

      if (!res.ok) throw new Error("Có lỗi xảy ra. Vui lòng thử lại.");

      toast.success("Ngân hàng câu hỏi đã được cập nhật");
      setIsEditing(false);
      fetchQuestionBank();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete question");

      toast.success("Đã xóa câu hỏi");
      fetchQuestionBank();
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
    fetchQuestionBank();
  };

  if (loading && !questionBank) {
    return <div className="text-center py-10">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/question-banks")}
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
              <Button onClick={handleUpdateQuestionBank}>
                <Save className="h-4 w-4 mr-1" />
                Lưu thay đổi
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  if (questionBank) {
                    setTitle(questionBank.title);
                  }
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <h1 className="text-3xl font-bold">{questionBank?.title}</h1>
            <div className="flex justify-between items-center mt-2">
              <div className="space-y-1">
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
              <ImportQuestionsButton questionBankId={questionBankId} onImportComplete={fetchQuestionBank} />
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm câu hỏi
              </Button>
            </div>
          </div>

          {questionBank?.questions?.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <p className="text-muted-foreground">
                Chưa có câu hỏi nào được thêm vào. Thêm câu hỏi đầu tiên của
                bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionBank?.questions.map(({ content, points, answers, id: questionBankQuestionId }) => (
                <Card key={questionBankQuestionId} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">
                            {content}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            ({points} điểm)
                          </span>
                        </div>
                        <div className="space-y-2 pl-5">
                          {answers?.map((answer: Answer) => (
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
                          onClick={() => handleEditQuestion({ content, points, answers, id: questionBankQuestionId })}
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
                                  handleDeleteQuestion(questionBankQuestionId)
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
          questionBankId={questionBankId}
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
