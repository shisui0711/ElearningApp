// MagicButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MagicButtonProps {
  onContentGenerated?: (content: string) => void;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  inputPlaceholder?: string;
  useStreaming?: boolean;
  className?: string;
}

export default function MagicButton({
  onContentGenerated,
  buttonText,
  dialogTitle = "Tạo nội dung với AI",
  dialogDescription = "Lên ý tưởng để tạo nội dung với AI",
  inputPlaceholder = "Mô tả ý tưởng của bạn...",
  useStreaming = true,
  className,
}: MagicButtonProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  // Clean up controller on unmount
  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [controller]);

  const generateContent = async () => {
    if (!prompt.trim()) return;

    // Reset content
    setGeneratedContent("");
    setIsGenerating(true);

    // Create a new abort controller
    const abortController = new AbortController();
    setController(abortController);

    try {
      if (useStreaming) {
        // Streaming implementation
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek/deepseek-chat-v3-0324:free",
              messages: [
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
              
              // Skip "[DONE]" message
              if (jsonData === "[DONE]") continue;
              
              try {
                const parsedLine = JSON.parse(jsonData);
                
                // Extract content from the OpenRouter format
                if (parsedLine.choices && 
                    parsedLine.choices[0]?.delta?.content) {
                  const content = parsedLine.choices[0].delta.content;
                  accumulatedContent += content;
                  setGeneratedContent(accumulatedContent);
                }
                
                // Check if this is the last message
                if (parsedLine.choices && 
                    parsedLine.choices[0]?.finish_reason !== null) {
                  break;
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
              }
            }
          }
        }
      } else {
        // Non-streaming implementation
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            stream: false,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setGeneratedContent(data.choices[0].message.content);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Failed to generate content:", error);
        setGeneratedContent(
          "Failed to generate content. Please check if Ollama is running locally."
        );
      }
    } finally {
      setIsGenerating(false);
      setController(null);
    }
  };

  const handleCancelGeneration = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!onContentGenerated) return;
    onContentGenerated(generatedContent);
    setOpen(false);
    // Reset states for next use
    setPrompt("");
    setGeneratedContent("");
    setActiveTab("preview");
  };

  const handleClose = () => {
    if (isGenerating) {
      handleCancelGeneration();
    }
    setOpen(false);
    setPrompt("");
    setGeneratedContent("");
    setActiveTab("preview");
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-2", className)}
      >
        <Wand2 className="w-4 h-4" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt">Mô tả ý tưởng của bạn</Label>
              <Textarea
                id="prompt"
                placeholder={inputPlaceholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="mt-2"
              >
                {isGenerating ? "Đang tạo..." : "Tạo"}
              </Button>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Nội dung đã tạo</Label>
                {isGenerating && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelGeneration}
                  >
                    Hủy bỏ
                  </Button>
                )}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-[200px]">
                  <TabsTrigger value="preview">Xem trước</TabsTrigger>
                  <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="preview"
                  className="border rounded-md p-4 min-h-[200px] markdown-content"
                >
                  {isGenerating && !generatedContent && (
                    <div className="text-muted-foreground italic">
                      Đang tạo nội dung...
                    </div>
                  )}
                  {!isGenerating && !generatedContent && (
                    <div className="text-muted-foreground italic">
                      Nội dung sẽ xuất hiện ở đây
                    </div>
                  )}
                  {generatedContent && (
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="edit" className="mt-0">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    placeholder={
                      isGenerating
                        ? "Đang tạo nội dung..."
                        : "Nội dung sẽ xuất hiện ở đây"
                    }
                    rows={12}
                    className="resize-y min-h-[200px] font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              Hủy bỏ
            </Button>
            <div className="flex gap-2">
              {generatedContent && !isGenerating && (
                <Button onClick={generateContent}>Tạo lại</Button>
              )}
              {generatedContent && !isGenerating && (
                <Button onClick={handleConfirm}>Xác nhận</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
