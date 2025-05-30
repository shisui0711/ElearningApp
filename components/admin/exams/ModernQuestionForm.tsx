"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedCard, CardContent, CardHeader, CardTitle } from "@/components/ui/animated-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Image, Video, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnimation } from "@/provider/AnimationProvider";

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
  difficulty?: string;
}

interface ModernQuestionFormProps {
  examId: string;
  question: Question | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function ModernQuestionForm({
  examId,
  question,
  onCancel,
  onSaved,
}: ModernQuestionFormProps) {
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [allowMultipleCorrect, setAllowMultipleCorrect] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!question;
  const { gsap, isReady } = useAnimation();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !formRef.current) return;

    // Create animation for the form
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );

    return () => {
      if (formRef.current) {
        gsap.killTweensOf(formRef.current);
      }
    };
  }, [isReady, gsap]);

  useEffect(() => {
    if (question) {
      setQuestionText(question.content);
      setPoints(question.points);
      setAnswers([...question.answers]);
      setImageUrl(question.imageUrl);
      setVideoUrl(question.videoUrl);
      setDifficulty(question.difficulty || "MEDIUM");
      setAllowMultipleCorrect(question.answers.filter(a => a.isCorrect).length > 1);
    } else {
      // Initialize with two empty answers for convenience
      setAnswers([
        { id: uuidv4(), content: "", isCorrect: true },
        { id: uuidv4(), content: "", isCorrect: false },
      ]);
      setImageUrl(undefined);
      setVideoUrl(undefined);
      setDifficulty("MEDIUM");
      setAllowMultipleCorrect(false);
    }
  }, [question]);

  // All the handler functions from the original component
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
      if (!isCorrect) {
        const otherCorrect = answers.some((a) => a.id !== id && a.isCorrect);
        if (!otherCorrect) {
          toast.error("Ít nhất một câu trả lời phải đúng");
          return;
        }
      }
      
      setAnswers(
        answers.map((answer) =>
          answer.id === id ? { ...answer, isCorrect } : answer
        )
      );
    } else {
      if (isCorrect) {
        setAnswers(
          answers.map((answer) =>
            answer.id === id
              ? { ...answer, isCorrect: true }
              : { ...answer, isCorrect: false }
          )
        );
      } else {
        toast.error("Ít nhất một câu trả lời phải đúng");
        return;
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn tệp video");
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
      toast.error("Phải có ít nhất một câu trả lời đúng.");
      return false;
    }

    if (answers.some((answer) => !answer.content.trim())) {
      toast.error("Câu trả lời không được để trống.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        content: questionText,
        points,
        answers: answers.map(({ content, isCorrect }) => ({
          content,
          isCorrect,
        })),
        imageUrl,
        videoUrl,
        difficulty,
      };

      let url, method;

      if (isEditing) {
        url = `/api/questions/${question!.id}`;
        method = "PATCH";
      } else {
        url = `/api/exams/${examId}/questions`;
        method = "POST";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save question");
      }

      toast.success(
        isEditing ? "Câu hỏi đã được cập nhật" : "Câu hỏi đã được thêm"
      );
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className="space-y-4 mt-8">
      <AnimatedCard
        className="bg-card/60 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
        glassMorphism
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-gradient-2">
            {isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="mb-4 bg-background/50 backdrop-blur-sm">
              <TabsTrigger value="content" className="data-[state=active]:bg-primary/20">Nội dung</TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-primary/20">Phương tiện</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-points">Điểm số</Label>
                    <Input
                      id="question-points"
                      type="number"
                      min="1"
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-difficulty">Mức độ khó</Label>
                    <Select
                      value={difficulty}
                      onValueChange={setDifficulty}
                    >
                      <SelectTrigger id="question-difficulty">
                        <SelectValue placeholder="Chọn mức độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Dễ</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="HARD">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="question-text">Câu hỏi</Label>
                  <Input
                    id="question-text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="h-10"
                  />
                </div>

                {imageUrl && (
                  <div className="relative mt-2">
                    <img
                      src={imageUrl}
                      alt="Question"
                      className="max-h-60 object-contain rounded-md border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {videoUrl && (
                  <div className="relative mt-2">
                    <video
                      src={videoUrl}
                      controls
                      className="max-h-60 w-full rounded-md border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={removeVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium">Danh sách câu trả lời</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multiple-correct"
                        checked={allowMultipleCorrect}
                        onCheckedChange={setAllowMultipleCorrect}
                      />
                      <Label htmlFor="multiple-correct">Cho phép nhiều đáp án đúng</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {answers.map((answer, index) => (
                      <div
                        key={answer.id}
                        className="flex items-center gap-2 border p-3 rounded-md"
                      >
                        <Checkbox
                          id={`answer-${answer.id}`}
                          checked={answer.isCorrect}
                          onCheckedChange={(checked) =>
                            handleCorrectChange(answer.id, checked === true)
                          }
                        />
                        <Input
                          id={`answer-content-${answer.id}`}
                          value={answer.content}
                          onChange={(e) =>
                            handleAnswerChange(answer.id, e.target.value)
                          }
                          className="flex-1 h-9"
                          placeholder={`Câu trả lời ${index + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAnswer(answer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleAddAnswer}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm câu trả lời
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
            <div className="space-y-4">
                <div>
                  <Label htmlFor="question-image">Hình ảnh</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="question-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={imageInputRef}
                    />
                    <Button
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="w-full p-8 h-auto border-dashed flex flex-col items-center justify-center gap-2"
                    >
                      {uploadingMedia ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Image className="h-6 w-6" />
                      )}
                      <span>
                        {uploadingMedia
                          ? "Đang tải lên..."
                          : "Tải lên hình ảnh"}
                      </span>
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="question-video">Video</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="question-video"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      ref={videoInputRef}
                    />
                    <Button
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className="w-full p-8 h-auto border-dashed flex flex-col items-center justify-center gap-2"
                    >
                      {uploadingMedia ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Video className="h-6 w-6" />
                      )}
                      <span>
                        {uploadingMedia ? "Đang tải lên..." : "Tải lên video"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-points-settings">Điểm số</Label>
                    <Input
                      id="question-points-settings"
                      type="number"
                      min="1"
                      value={points}
                      onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question-difficulty-settings">Mức độ khó</Label>
                    <Select
                      value={difficulty}
                      onValueChange={setDifficulty}
                    >
                      <SelectTrigger id="question-difficulty-settings">
                        <SelectValue placeholder="Chọn mức độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Dễ</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="HARD">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="multiple-correct-settings"
                    checked={allowMultipleCorrect}
                    onCheckedChange={setAllowMultipleCorrect}
                  />
                  <Label htmlFor="multiple-correct-settings">
                    Cho phép nhiều đáp án đúng
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <AnimatedButton 
              onClick={handleSubmit} 
              disabled={loading}
              gradientVariant="gradient2"
              animationVariant="hover"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {isEditing ? "Cập nhật" : "Lưu"}
                </>
              )}
            </AnimatedButton>
          </div>
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
