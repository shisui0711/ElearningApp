"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Image, Video, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

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
  imageUrl?: string;
  videoUrl?: string;
}

interface QuestionFormProps {
  examId: string;
  question: Question | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function QuestionForm({
  examId,
  question,
  onCancel,
  onSaved,
}: QuestionFormProps) {
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [allowMultipleCorrect, setAllowMultipleCorrect] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!question;

  useEffect(() => {
    if (question) {
      setQuestionText(question.content);
      setPoints(question.points);
      setAnswers([...question.answers]);
      setImageUrl(question.imageUrl);
      setVideoUrl(question.videoUrl);
      // Set multiple choice mode if there are multiple correct answers
      setAllowMultipleCorrect(question.answers.filter(a => a.isCorrect).length > 1);
    } else {
      // Initialize with two empty answers for convenience
      setAnswers([
        { id: uuidv4(), content: "", isCorrect: true },
        { id: uuidv4(), content: "", isCorrect: false },
      ]);
      setImageUrl(undefined);
      setVideoUrl(undefined);
      setAllowMultipleCorrect(false);
    }
  }, [question]);

  const handleAddAnswer = () => {
    setAnswers([...answers, { id: uuidv4(), content: "", isCorrect: false }]);
  };

  const handleRemoveAnswer = (id: string) => {
    if (answers.length <= 2) {
      toast.error("Một câu hỏi phải có ít nhất 2 câu trả lời");
      return;
    }

    const newAnswers = answers.filter((answer) => answer.id !== id);

    // If the removed answer was the only correct one, make the first answer correct
    if (
      answers.find((a) => a.id === id)?.isCorrect &&
      !newAnswers.some((a) => a.isCorrect)
    ) {
      newAnswers[0].isCorrect = true;
    }

    setAnswers(newAnswers);
  };

  const handleAnswerChange = (id: string, content: string) => {
    setAnswers(
      answers.map((answer) =>
        answer.id === id ? { ...answer, content } : answer
      )
    );
  };

  const handleCorrectChange = (id: string, isCorrect: boolean) => {
    if (allowMultipleCorrect) {
      // In multiple choice mode, allow multiple correct answers
      if (!isCorrect) {
        // When unchecking, make sure at least one answer remains correct
        const otherCorrect = answers.some((a) => a.id !== id && a.isCorrect);
        if (!otherCorrect) {
          toast.error("Ít nhất một câu trả lời phải đúng");
          return;
        }
      }
      
      // Toggle this answer's correct status
      setAnswers(
        answers.map((answer) =>
          answer.id === id ? { ...answer, isCorrect } : answer
        )
      );
    } else {
      // In single choice mode, only one answer can be correct
      if (isCorrect) {
        setAnswers(
          answers.map((answer) =>
            answer.id === id
              ? { ...answer, isCorrect: true }
              : { ...answer, isCorrect: false }
          )
        );
      } else {
        // Don't allow unchecking if it's the only correct answer
        toast.error("Ít nhất một câu trả lời phải đúng");
        return;
      }
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ các tập tin hình ảnh.");
      return;
    }

    try {
      setUploadingMedia(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "media");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setImageUrl(data.fileUrl);
      setActiveTab("content");
      toast.success("Hình ảnh đã được tải lên thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUploadingMedia(false);
      // Clear the input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast.error("Chỉ hỗ trợ các tập tin video.");
      return;
    }

    try {
      setUploadingMedia(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "media");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const data = await response.json();
      setVideoUrl(data.fileUrl);
      setActiveTab("content");
      toast.success("Video đã được tải lên thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUploadingMedia(false);
      // Clear the input
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const removeImage = () => {
    setImageUrl(undefined);
  };

  const removeVideo = () => {
    setVideoUrl(undefined);
  };

  const validateForm = () => {
    if (!questionText.trim()) {
      toast.error("Vui lòng nhập câu hỏi.");
      return false;
    }

    if (points < 1) {
      toast.error("Điểm phải đạt ít nhất 1.");
      return false;
    }

    if (answers.length < 2) {
      toast.error("Một câu hỏi phải có ít nhất 2 câu trả lời.");
      return false;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      toast.error("Ít nhất một câu trả lời phải đúng.");
      return false;
    }

    const emptyAnswers = answers.some((answer) => !answer.content.trim());
    if (emptyAnswers) {
      toast.error("Tất cả các câu trả lời phải có nội dung.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (isEditing) {
        // Update existing question
        const res = await fetch(`/api/questions/${question!.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: questionText,
            points,
            imageUrl,
            videoUrl,
            answers: answers.map((answer) => ({
              id: answer.id,
              content: answer.content,
              isCorrect: answer.isCorrect,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to update question");

        toast.success("Câu hỏi đã được chỉnh sửa thành công.");
      } else {
        // Create new question and link to exam
        const res = await fetch(`/api/exams/${examId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: questionText,
            points,
            imageUrl,
            videoUrl,
            answers: answers.map((answer) => ({
              content: answer.content,
              isCorrect: answer.isCorrect,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to add question");

        toast.success("Câu hỏi đã được thêm thành công.");
      }

      onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="content">Nội dung</TabsTrigger>
            <TabsTrigger value="image">Hình ảnh</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question-text">Câu hỏi</Label>
              <Input
                id="question-text"
                placeholder="Nhập câu hỏi"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                disabled={loading}
              />
            </div>

            {imageUrl && (
              <div className="relative border rounded-md p-2 mt-4">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium mb-2">Hình ảnh đính kèm:</p>
                <img
                  src={imageUrl}
                  alt="Question attachment"
                  className="max-h-[200px] object-contain"
                />
              </div>
            )}

            {videoUrl && (
              <div className="relative border rounded-md p-2 mt-4">
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium mb-2">Video đính kèm:</p>
                <video
                  src={videoUrl}
                  controls
                  className="max-h-[200px] w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="points">Điểm cho câu hỏi này</Label>
              <Input
                id="points"
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                disabled={loading}
                className="w-24"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Các câu trả lời</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="multiple-correct"
                      checked={allowMultipleCorrect}
                      onCheckedChange={(checked) => {
                        setAllowMultipleCorrect(checked);
                        // If switching from multiple to single and multiple are selected,
                        // keep only the first correct answer
                        if (!checked) {
                          const correctAnswers = answers.filter(a => a.isCorrect);
                          if (correctAnswers.length > 1) {
                            const firstCorrectId = correctAnswers[0].id;
                            setAnswers(
                              answers.map(answer => 
                                answer.id === firstCorrectId 
                                  ? { ...answer, isCorrect: true }
                                  : { ...answer, isCorrect: false }
                              )
                            );
                            toast.info("Chuyển sang chế độ đơn lựa chọn. Chỉ giữ một đáp án đúng.");
                          }
                        }
                      }}
                      disabled={loading}
                    />
                    <Label htmlFor="multiple-correct" className="text-sm">
                      Cho phép nhiều đáp án đúng
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAnswer}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm câu trả lời
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div key={answer.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`answer-correct-${answer.id}`}
                      checked={answer.isCorrect}
                      onCheckedChange={(checked) =>
                        handleCorrectChange(answer.id, checked === true)
                      }
                      disabled={loading}
                    />
                    <Input
                      placeholder={`Đáp án ${index + 1}`}
                      value={answer.content}
                      onChange={(e) =>
                        handleAnswerChange(answer.id, e.target.value)
                      }
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAnswer(answer.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-10 text-center">
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {uploadingMedia ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                  <p>Đang tải lên hình ảnh...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Image className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="mb-4">Kéo và thả hình ảnh vào đây, hoặc</p>
                  <Button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Chọn hình ảnh
                  </Button>
                </div>
              )}
            </div>

            {imageUrl && (
              <div className="border rounded-md p-4 mt-4">
                <p className="text-sm font-medium mb-2">Hình ảnh hiện tại:</p>
                <img
                  src={imageUrl}
                  alt="Question attachment"
                  className="max-h-[300px] object-contain"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  onClick={removeImage}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa hình ảnh
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-10 text-center">
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/*"
                className="hidden"
              />

              {uploadingMedia ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                  <p>Đang tải lên video...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Video className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="mb-4">Kéo và thả video vào đây, hoặc</p>
                  <Button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Chọn video
                  </Button>
                </div>
              )}
            </div>

            {videoUrl && (
              <div className="border rounded-md p-4 mt-4">
                <p className="text-sm font-medium mb-2">Video hiện tại:</p>
                <video
                  src={videoUrl}
                  controls
                  className="w-full max-h-[300px]"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  onClick={removeVideo}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa video
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEditing ? "Cập nhật" : "Lưu"} câu hỏi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
