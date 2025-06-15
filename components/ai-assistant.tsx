"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Search, FileText, MessageSquare, BotIcon, Maximize2, Minimize2 } from "lucide-react";
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

interface AiAssistantProps {
  buttonText?: string;
  className?: string;
}

const AiAssistant = ({
  buttonText = "AI Assistant",
  className,
}: AiAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [activeMode, setActiveMode] = useState("ask");
  const [textToSummarize, setTextToSummarize] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [controller]);

  const generateSystemPrompt = () => {
    switch (activeMode) {
      case "ask":
        return "You are a helpful AI assistant. Answer the user's question clearly and concisely.";
      case "search":
        return "You are a deep search AI. Find relevant information about the topic and provide detailed analysis.";
      case "summarize":
        return "You are a text summarizer. Create a concise summary of the provided text while maintaining all key points.";
      default:
        return "You are a helpful AI assistant. Answer the user's question clearly and concisely.";
    }
  };

  const generateContent = async () => {
    if (activeMode === "summarize" && !textToSummarize.trim()) {
      return;
    }
    
    if (activeMode !== "summarize" && !prompt.trim()) {
      return;
    }

    setGeneratedContent("");
    setIsGenerating(true);

    const abortController = new AbortController();
    setController(abortController);

    try {
      const inputText = activeMode === "summarize" ? textToSummarize : prompt;
      const systemPrompt = generateSystemPrompt();

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
            models: ["deepseek/deepseek-r1:free","google/gemma-3n-e4b-it:free"],
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: inputText,
              },
            ],
            stream: true,
            plugins: activeMode === "search" ? [{ "id": "web" }] : [],
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
              
              if (parsedLine.choices && 
                  parsedLine.choices[0]?.delta?.content) {
                const content = parsedLine.choices[0].delta.content;
                accumulatedContent += content;
                setGeneratedContent(accumulatedContent);
              }
              
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
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Failed to generate content:", error);
        setGeneratedContent(
          "Lỗi khi tạo nội dung. Vui lòng kiểm tra lại API key và kết nối."
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

  const handleClose = () => {
    if (isGenerating) {
      handleCancelGeneration();
    }
    setOpen(false);
    setPrompt("");
    setTextToSummarize("");
    setGeneratedContent("");
    setActiveTab("chat");
    setActiveMode("ask");
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const renderInputSection = () => {
    if (activeTab === "chat") {
      if (activeMode === "summarize") {
        return (
          <div className="grid gap-2">
            <Label htmlFor="text-to-summarize">Văn bản cần tóm tắt</Label>
            <Textarea
              id="text-to-summarize"
              placeholder="Dán văn bản bạn muốn tóm tắt vào đây..."
              value={textToSummarize}
              onChange={(e) => setTextToSummarize(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <Button
              onClick={generateContent}
              disabled={isGenerating || !textToSummarize.trim()}
              className="mt-2"
            >
              {isGenerating ? "Đang tóm tắt..." : "Tóm tắt"}
            </Button>
          </div>
        );
      } else {
        return (
          <div className="grid gap-2">
            <Label htmlFor="prompt">Câu hỏi của bạn</Label>
            <Textarea
              id="prompt"
              placeholder={
                activeMode === "search"
                  ? "Nhập từ khóa hoặc chủ đề bạn muốn tìm kiếm chuyên sâu..."
                  : "Nhập câu hỏi của bạn..."
              }
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
              {isGenerating
                ? activeMode === "search"
                  ? "Đang tìm kiếm..."
                  : "Đang xử lý..."
                : activeMode === "search"
                ? "Tìm kiếm"
                : "Gửi"}
            </Button>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn("flex items-center gap-2", className)}
      >
        <BotIcon className="w-4 h-4" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={cn(
          "sm:max-w-3xl max-h-[80vh] overflow-y-auto transition-all duration-300",
          isFullScreen && "sm:max-w-full max-w-full w-[100vw] h-[100vh] max-h-[100vh] rounded-none pt-16"
        )}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>AI Assistant</DialogTitle>
              <DialogDescription>
                Trợ lý thông minh hỗ trợ bạn với các tác vụ khác nhau
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullScreen}
              className="ml-auto"
              title={isFullScreen ? "Thu nhỏ" : "Phóng to"}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-1 w-[200px]">
                <TabsTrigger value="chat">Trò chuyện</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeMode === "ask" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveMode("ask")}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Hỏi đáp
                  </Button>
                  <Button
                    variant={activeMode === "search" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveMode("search")}
                    className="flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Tìm kiếm chuyên sâu
                  </Button>
                  <Button
                    variant={activeMode === "summarize" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveMode("summarize")}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Tóm tắt văn bản
                  </Button>
                </div>

                {renderInputSection()}

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Kết quả</Label>
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

                  <div className="border rounded-md p-4 min-h-[200px] markdown-content">
                    {isGenerating && !generatedContent && (
                      <div className="text-muted-foreground italic">
                        Đang xử lý...
                      </div>
                    )}
                    {!isGenerating && !generatedContent && (
                      <div className="text-muted-foreground italic">
                        Kết quả sẽ hiển thị ở đây
                      </div>
                    )}
                    {generatedContent && (
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiAssistant;
