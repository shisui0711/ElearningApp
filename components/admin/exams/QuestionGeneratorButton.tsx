"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Answer {
  content: string;
  isCorrect: boolean;
}

interface QuestionPreview {
  content: string;
  points: number;
  difficulty: string;
  answers: Answer[];
}

interface QuestionGeneratorButtonProps {
  examId: string;
  onQuestionsGenerated: () => void;
}

export default function QuestionGeneratorButton({
  examId,
  onQuestionsGenerated,
}: QuestionGeneratorButtonProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [easyCount, setEasyCount] = useState(2);
  const [mediumCount, setMediumCount] = useState(2);
  const [hardCount, setHardCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [controller, setController] = useState<AbortController | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    QuestionPreview[]
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [controller]);

  const handleCancelGeneration = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsGenerating(false);
      toast.error("Đã hủy quá trình tạo câu hỏi");
    }
  };

  const resetState = () => {
    setSubject("");
    setEasyCount(2);
    setMediumCount(2);
    setHardCount(1);
    setGeneratedQuestions([]);
    setShowPreview(false);
    setActiveTab("all");
    setGenerationProgress(0);
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen && !isGenerating && !isSaving) {
      resetState();
      setOpen(false);
    } else if (isOpen) {
      setOpen(true);
    }
  };

  const generateQuestions = async () => {
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tên môn học");
      return;
    }

    const totalQuestions = easyCount + mediumCount + hardCount;
    if (totalQuestions <= 0) {
      toast.error("Vui lòng nhập số lượng câu hỏi");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedQuestions([]);
    const abortController = new AbortController();
    setController(abortController);

    try {
      const prompt = `Generate ${totalQuestions} multiple-choice questions for a ${subject} exam with the following distribution:
- ${easyCount} easy questions
- ${mediumCount} medium difficulty questions
- ${hardCount} hard questions

For each question:
1. Create a clear question
2. Provide 4 answer choices (A, B, C, D)
3. Indicate which answer is correct
4. Assign points based on difficulty (1 point for easy, 2 for medium, 3 for hard)

Format the output as a valid JSON array of question objects with this structure:
[
  {
    "content": "Question text here",
    "points": 1,
    "difficulty": "EASY",
    "answers": [
      {"content": "Answer A", "isCorrect": false},
      {"content": "Answer B", "isCorrect": true},
      {"content": "Answer C", "isCorrect": false},
      {"content": "Answer D", "isCorrect": false}
    ]
  }
]`;

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            models: ["deepseek/deepseek-r1:free","google/gemma-3n-e4b-it:free"],
            messages: [
              {
                role: "system",
                content:
                  "You are an educational content creator specializing in creating high-quality exam questions. Your responses should be concise, well-formatted JSON that strictly follows the requested structure.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            stream: true,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body reader is not available");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonData = line.replace("data: ", "");

            if (jsonData === "[DONE]") continue;

            try {
              const parsedLine = JSON.parse(jsonData);

              if (parsedLine.choices && parsedLine.choices[0]?.delta?.content) {
                const content = parsedLine.choices[0].delta.content;
                accumulatedContent += content;

                setGenerationProgress(
                  Math.min(95, (accumulatedContent.length / 1000) * 10)
                );
              }

              if (
                parsedLine.choices &&
                parsedLine.choices[0]?.finish_reason !== null
              ) {
                break;
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }

      try {
        const jsonMatch = accumulatedContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in the response");
        }

        const jsonStr = jsonMatch[0];
        const questions = JSON.parse(jsonStr);

        setGeneratedQuestions(questions);
        setShowPreview(true);
        setGenerationProgress(100);
      } catch (error) {
        console.error("Failed to parse generated questions:", error);
        toast.error("Không thể xử lý câu hỏi đã tạo. Vui lòng thử lại.");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Failed to generate questions:", error);
        toast.error(
          "Không thể tạo câu hỏi. Vui lòng kiểm tra kết nối của bạn."
        );
      }
    } finally {
      setIsGenerating(false);
      setController(null);
    }
  };

  const saveGeneratedQuestions = async () => {
    if (generatedQuestions.length === 0) {
      return;
    }

    setIsSaving(true);

    try {
      let successCount = 0;

      for (const question of generatedQuestions) {
        const res = await fetch(`/api/exams/${examId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: question.content,
            points: question.points,
            difficulty: question.difficulty,
            answers: question.answers,
          }),
        });

        if (res.ok) {
          successCount++;
        }
      }

      toast.success(
        `Đã thêm thành công ${successCount} trong ${generatedQuestions.length} câu hỏi vào bài kiểm tra`
      );
      setOpen(false);
      resetState();
      onQuestionsGenerated();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Có lỗi xảy ra khi lưu câu hỏi. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = generatedQuestions.filter((q) => {
    if (activeTab === "all") return true;
    return q.difficulty.toLowerCase() === activeTab.toLowerCase();
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return "bg-green-100/80 text-green-800 backdrop-blur-sm";
      case "MEDIUM":
        return "bg-yellow-100/80 text-yellow-800 backdrop-blur-sm";
      case "HARD":
        return "bg-red-100/80 text-red-800 backdrop-blur-sm";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return "Dễ";
      case "MEDIUM":
        return "Trung bình";
      case "HARD":
        return "Khó";
      default:
        return difficulty;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="gap-1 hover:bg-primary/90">
            <Brain className="h-4 w-4 mr-1" />
            Tạo câu hỏi AI
          </Button>
        </DialogTrigger>
        <DialogContent
          className={`${
            showPreview ? "sm:max-w-4xl" : "sm:max-w-md"
          } max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <DialogHeader>
            <DialogTitle>Tạo câu hỏi bằng AI</DialogTitle>
            <DialogDescription>
              {showPreview
                ? `Xem trước ${generatedQuestions.length} câu hỏi cho môn ${subject}`
                : "Nhập thông tin về môn học và số lượng câu hỏi theo từng độ khó"}
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="grid gap-4 py-4 overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="subject">Tên môn học</Label>
                <Input
                  id="subject"
                  placeholder="VD: Toán học, Lịch sử, Lập trình..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="easyCount">Câu hỏi dễ</Label>
                  <Input
                    id="easyCount"
                    type="number"
                    min="0"
                    max="10"
                    value={easyCount}
                    onChange={(e) =>
                      setEasyCount(parseInt(e.target.value) || 0)
                    }
                    disabled={isGenerating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mediumCount">Câu hỏi trung bình</Label>
                  <Input
                    id="mediumCount"
                    type="number"
                    min="0"
                    max="10"
                    value={mediumCount}
                    onChange={(e) =>
                      setMediumCount(parseInt(e.target.value) || 0)
                    }
                    disabled={isGenerating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hardCount">Câu hỏi khó</Label>
                  <Input
                    id="hardCount"
                    type="number"
                    min="0"
                    max="10"
                    value={hardCount}
                    onChange={(e) =>
                      setHardCount(parseInt(e.target.value) || 0)
                    }
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Đang tạo câu hỏi...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 ease-in-out"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden py-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    Tất cả ({generatedQuestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="easy">
                    Dễ (
                    {
                      generatedQuestions.filter(
                        (q) => q.difficulty.toUpperCase() === "EASY"
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="medium">
                    Trung bình (
                    {
                      generatedQuestions.filter(
                        (q) => q.difficulty.toUpperCase() === "MEDIUM"
                      ).length
                    }
                    )
                  </TabsTrigger>
                  <TabsTrigger value="hard">
                    Khó (
                    {
                      generatedQuestions.filter(
                        (q) => q.difficulty.toUpperCase() === "HARD"
                      ).length
                    }
                    )
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[50vh] pr-4">
                  <div className="space-y-4">
                    {filteredQuestions.map((question, index) => (
                      <Card key={index} className="shadow-sm">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex-1">{question.content}</div>
                            <div className="flex items-center space-x-2 shrink-0 ml-2">
                              <Badge variant="outline">
                                {question.points} điểm
                              </Badge>
                              <Badge
                                className={getDifficultyColor(
                                  question.difficulty
                                )}
                              >
                                {getDifficultyText(question.difficulty)}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <div className="space-y-2">
                            {question.answers.map((answer, aIndex) => (
                              <div
                                key={aIndex}
                                className={`flex items-start p-2 rounded-md ${
                                  answer.isCorrect ? "bg-green-50/50" : ""
                                }`}
                              >
                                <div className="h-5 w-5 rounded-full mr-2 flex items-center justify-center shrink-0">
                                  {answer.isCorrect ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-400" />
                                  )}
                                </div>
                                <span>{answer.content}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </Tabs>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            {isGenerating ? (
              <Button variant="destructive" onClick={handleCancelGeneration}>
                Hủy
              </Button>
            ) : showPreview ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setGeneratedQuestions([]);
                  }}
                >
                  Quay lại
                </Button>
                <Button
                  onClick={saveGeneratedQuestions}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[hsl(var(--gradient-2-start))] to-[hsl(var(--gradient-2-end))] hover:opacity-90 text-white border-0"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Thêm vào bài kiểm tra"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={generateQuestions}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-[hsl(var(--gradient-2-start))] to-[hsl(var(--gradient-2-end))] hover:opacity-90 text-white border-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo câu hỏi"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
