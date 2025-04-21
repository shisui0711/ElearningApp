"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import mammoth from "mammoth";

interface ImportQuestionsButtonProps {
  examId: string;
  onImportComplete: () => void;
}

interface Answer {
  content: string;
  isCorrect: boolean;
}

interface Question {
  content: string;
  answers: Answer[];
}

export default function ImportQuestionsButton({
  examId,
  onImportComplete,
}: ImportQuestionsButtonProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[] | null>(
    null
  );
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF.js from CDN
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load the PDF.js library from CDN
      const pdfjsScript = document.createElement("script");
      pdfjsScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      pdfjsScript.async = true;
      pdfjsScript.onload = () => {
        // Set worker source
        const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        setIsPdfJsLoaded(true);
      };
      document.head.appendChild(pdfjsScript);
    }

    return () => {
      // Clean up script tag on component unmount
      const scriptTag = document.querySelector(
        'script[src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"]'
      );
      if (scriptTag) {
        document.head.removeChild(scriptTag);
      }
    };
  }, []);

  const parseText = (text: string): Question[] => {
    const questions: Question[] = [];

    // Remove excessive newlines to normalize the text, but keep paragraph structure
    const normalizedText = text.replace(/\n{3,}/g, "\n\n").trim();

    // Split text into question blocks - looking for "Câu X" patterns
    const questionBlocks = normalizedText
      .split(/(?=Câu\s+\d+)/gm)
      .filter((block) => block.trim().length > 0);

    for (const questionBlock of questionBlocks) {
      try {
        // Skip if block doesn't look like a question
        if (!questionBlock.match(/Câu\s+\d+/)) continue;

        // Extract question number
        const questionNumberMatch = /Câu\s+(\d+)/.exec(questionBlock);
        const questionNumber = questionNumberMatch
          ? questionNumberMatch[1]
          : "";

        // Split the block into lines for processing
        const lines = questionBlock
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length < 3) continue; // Not enough content for a valid question

        // Extract question content - it's usually the second line after "Câu X"
        let questionContentIndex = -1;

        // Find where the question content starts
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/^Câu\s+\d+$/)) {
            questionContentIndex = i + 1;
            break;
          }
        }

        if (
          questionContentIndex === -1 ||
          questionContentIndex >= lines.length
        ) {
          // Try again with a different pattern if we didn't find it
          questionContentIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/Câu\s+\d+/)) {
              // The question content might be on the same line or the next line
              if (lines[i].length > questionNumber.length + 5) {
                // Question is on the same line as "Câu X"
                questionContentIndex = i;
              } else {
                questionContentIndex = i + 1;
              }
              break;
            }
          }
        }

        if (questionContentIndex === -1 || questionContentIndex >= lines.length)
          continue;

        // Extract the question content
        let questionContent = "";
        if (questionContentIndex === 0) {
          // Extract from the "Câu X" line
          const contentMatch = /Câu\s+\d+\s+(.+)/.exec(
            lines[questionContentIndex]
          );
          if (contentMatch) {
            questionContent = contentMatch[1].trim();
          }
        } else {
          questionContent = lines[questionContentIndex].trim();
        }

        // Continue collecting question content until we hit an answer
        let currentIndex = questionContentIndex + 1;
        while (
          currentIndex < lines.length &&
          !lines[currentIndex].match(/^[A-Da-d](\s|$)/)
        ) {
          questionContent += " " + lines[currentIndex].trim();
          currentIndex++;
        }

        // Find answer options
        const answers: Answer[] = [];
        let correctAnswerLetter = "";

        // Look for lines that start with A, B, C, D
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const answerMatch = /^([A-Da-d])(\s|$)/.exec(line);

          if (answerMatch) {
            const answerLetter = answerMatch[1].toUpperCase();

            // Get answer content - might be on same line or next lines
            let answerContent = line.replace(/^[A-Da-d](\s|$)/, "").trim();

            // If no content on same line, check next line
            if (answerContent.length === 0 && i + 1 < lines.length) {
              answerContent = lines[i + 1].trim();
              i++; // Skip the next line as we've processed it
            }

            // Collect additional content until next answer or end
            let j = i + 1;
            while (
              j < lines.length &&
              !lines[j].match(/^[A-Da-d](\s|$)/) &&
              !lines[j].match(/Câu\s+\d+/) &&
              !lines[j].match(/Đáp án|đáp án|Đáp Án/)
            ) {
              answerContent += " " + lines[j].trim();
              j++;
              i = j - 1; // Update outer loop counter
            }

            answers.push({
              content: answerContent.trim(),
              isCorrect: false, // Will set correctly later
            });
          }

          // Look for correct answer indication
          if (
            line.match(
              /Đáp án|đáp án|Đáp Án|Câu trả lời đúng|Câu đúng|Đáp án đúng/
            )
          ) {
            const correctMatch =
              /(?:Đáp án|đáp án|Đáp Án|Câu trả lời đúng|Câu đúng|Đáp án đúng)\s*[:\- ]?\s*([A-Da-d])/i.exec(
                line
              );
            if (correctMatch) {
              correctAnswerLetter = correctMatch[1].toUpperCase();
            }
          }
        }

        // If we couldn't find a correct answer indication, look for indirect clues
        if (!correctAnswerLetter && answers.length > 0) {
          // Look for answers with * or special formatting
          for (let i = 0; i < answers.length; i++) {
            if (answers[i].content.includes("*")) {
              correctAnswerLetter = String.fromCharCode(65 + i); // A, B, C, D
              break;
            }
          }

          // Look for answers that mention "đúng" or "chính xác" in the content
          if (!correctAnswerLetter) {
            for (let i = 0; i < answers.length; i++) {
              if (
                answers[i].content.match(/\b(đúng|chính xác|chính xác là)\b/i)
              ) {
                correctAnswerLetter = String.fromCharCode(65 + i);
                break;
              }
            }
          }

          // For this specific format, if we still have no correct answer, try to detect if
          // one answer includes all other options (like "Cả A, B và C")
          if (!correctAnswerLetter) {
            for (let i = 0; i < answers.length; i++) {
              const content = answers[i].content.toLowerCase();
              if (
                content.includes("cả") &&
                ["a", "b", "c", "d"].filter((letter) =>
                  content.includes(letter)
                ).length >= 2
              ) {
                correctAnswerLetter = String.fromCharCode(65 + i);
                break;
              }
            }
          }
        }

        // Mark the correct answer
        for (let i = 0; i < answers.length; i++) {
          if (correctAnswerLetter === String.fromCharCode(65 + i)) {
            answers[i].isCorrect = true;
            break;
          }
        }

        // If no correct answer was found, mark the first one
        if (!answers.some((a) => a.isCorrect) && answers.length > 0) {
          answers[0].isCorrect = true;
        }

        // Add the question if we have content and at least 2 answers
        if (
          questionContent &&
          questionContent.length > 0 &&
          answers.length >= 2
        ) {
          questions.push({
            content: questionContent.trim(),
            answers,
          });
        }
      } catch (error) {
        console.error("Error parsing question block:", error);
      }
    }

    return questions;
  };

  const parsePdfDocument = async (file: File): Promise<Question[]> => {
    if (!isPdfJsLoaded || !(window as any)["pdfjs-dist/build/pdf"]) {
      throw new Error("PDF.js is not loaded yet");
    }

    try {
      const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];

      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = "";

      // Iterate through each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Xử lý từng item text để giữ nguyên định dạng tốt hơn
        const pageItems = textContent.items;
        let lastY = null;
        let lastX = null;

        for (const item of pageItems) {
          const itemY = item.transform[5]; // Vị trí Y của item
          const itemX = item.transform[4]; // Vị trí X của item

          // Nếu khác dòng hoặc có khoảng cách lớn, thêm xuống dòng
          if (lastY !== null && Math.abs(lastY - itemY) > 5) {
            fullText += "\n";
          }
          // Nếu cùng dòng nhưng X cách xa, thêm khoảng trắng
          else if (lastX !== null && lastY === itemY && itemX - lastX > 10) {
            fullText += " ";
          }

          fullText += item.str;
          lastY = itemY;
          lastX = itemX + item.width;
        }

        fullText += "\n\n"; // Thêm ngắt dòng giữa các trang
      }

      return parseText(fullText);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      throw new Error("Failed to parse PDF document");
    }
  };

  const parseWordDocument = async (file: File): Promise<Question[]> => {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Use mammoth to extract text from the Word document
      const result = await mammoth.extractRawText({ arrayBuffer });
      const fullText = result.value;

      // Try both parsing methods
      let questions = parseText(fullText);

      // If we didn't get many questions, try the specific format parser
      if (questions.length < 5) {
        const specialQuestions = parseFormattedDocument(fullText);
        if (specialQuestions.length > questions.length) {
          questions = specialQuestions;
        }
      }

      return questions;
    } catch (error) {
      console.error("Error parsing Word document:", error);
      throw new Error("Failed to parse Word document");
    }
  };

  const parseFormattedDocument = (text: string): Question[] => {
    const questions: Question[] = [];

    // First, clean up the text by removing multiple spaces and normalizing line breaks
    const cleanText = text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();

    // Split by "Câu" markers
    const regex =
      /Câu\s+(\d+)\s+([^A-D]+)\s+A\s+([^B]+)\s+B\s+([^C]+)\s+C\s+([^D]+)\s+D\s+([^\n]+)/g;

    let match;
    while ((match = regex.exec(cleanText)) !== null) {
      try {
        const questionNumber = match[1];
        const questionContent = match[2].trim();

        const answers = [
          { content: match[3].trim(), isCorrect: false },
          { content: match[4].trim(), isCorrect: false },
          { content: match[5].trim(), isCorrect: false },
          { content: match[6].trim(), isCorrect: false },
        ];

        // Add question
        questions.push({
          content: questionContent,
          answers,
        });
      } catch (error) {
        console.error("Error parsing question:", match, error);
      }
    }

    return questions;
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check file type
    if (
      file.type !== "application/pdf" &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
      file.type !== "text/plain"
    ) {
      toast.error("Chỉ hỗ trợ tài liệu PDF, Word hoặc TXT");
      return;
    }

    try {
      setIsProcessing(true);

      let extractedQuestions: Question[] = [];

      if (file.type === "application/pdf") {
        if (!isPdfJsLoaded) {
          toast.error(
            "Đang tải thư viện PDF.js, vui lòng thử lại sau vài giây"
          );
          return;
        }
        extractedQuestions = await parsePdfDocument(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        extractedQuestions = await parseWordDocument(file);
      } else if (file.type === "text/plain") {
        extractedQuestions = await parseTextFile(file);
      }

      // Make sure at least one answer is marked as correct for each question
      extractedQuestions = extractedQuestions.map((question) => {
        // If no correct answer is marked, mark the first one as correct
        if (!question.answers.some((answer) => answer.isCorrect)) {
          question.answers[0].isCorrect = true;
        }
        return question;
      });

      setParsedQuestions(extractedQuestions);

      if (extractedQuestions.length > 0) {
        toast.success(
          `Đã trích xuất thành công ${extractedQuestions.length} câu hỏi từ tài liệu`
        );
      } else {
        toast.warning(
          "Không tìm thấy câu hỏi nào trong tài liệu. Kiểm tra lại định dạng tài liệu của bạn."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi phân tích tài liệu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCorrectAnswerChange = (
    questionIndex: number,
    answerIndex: number
  ) => {
    if (!parsedQuestions) return;

    const updatedQuestions = [...parsedQuestions];

    // Reset all answers for this question to not correct
    updatedQuestions[questionIndex].answers = updatedQuestions[
      questionIndex
    ].answers.map((answer) => ({ ...answer, isCorrect: false }));

    // Set the selected answer as correct
    updatedQuestions[questionIndex].answers[answerIndex].isCorrect = true;

    setParsedQuestions(updatedQuestions);
  };

  const importQuestions = async () => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      toast.error("Không có câu hỏi nào để nhập");
      return;
    }

    try {
      setIsProcessing(true);

      // Import questions one by one
      let successCount = 0;

      for (const question of parsedQuestions) {
        const res = await fetch(`/api/exams/${examId}/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(question),
        });

        if (res.ok) {
          successCount++;
        }
      }

      toast.success(
        `Đã nhập thành công ${successCount} trong ${parsedQuestions.length} câu hỏi`
      );
      onImportComplete();
      setOpen(false);
      setParsedQuestions(null);
    } catch (error) {
      console.error(error);
      toast.error("Không thể nhập câu hỏi");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fall back to parsing text files if both PDF and DOCX fail
  const parseTextFile = async (file: File): Promise<Question[]> => {
    try {
      const text = await file.text();
      return parseText(text);
    } catch (error) {
      console.error("Error parsing text file:", error);
      throw new Error("Failed to parse text file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Nhập từ tài liệu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nhập câu hỏi từ tài liệu</DialogTitle>
          <DialogDescription>
            Tải lên tệp PDF hoặc Word chứa các câu hỏi để phân tích và nhập tự
            động.
          </DialogDescription>
        </DialogHeader>

        {!parsedQuestions ? (
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-gray-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                <p>Đang phân tích tài liệu...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="mb-4">
                  Kéo và thả tệp PDF hoặc Word vào đây, hoặc
                </p>
                <Button type="button" onClick={triggerFileInput}>
                  <Upload className="h-4 w-4 mr-2" />
                  Chọn tệp
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Tệp phải được định dạng đúng để nhận dạng câu hỏi. Mỗi câu hỏi
                  nên được đánh số (ví dụ: 1., 2.), và mỗi câu trả lời phải được
                  đánh dấu bằng chữ cái (A., B., C. hoặc a), b), c)). Đánh dấu
                  câu trả lời đúng bằng dấu * hoặc ghi rõ "Đáp án: X".
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            <p className="font-medium flex items-center">
              <span>
                Câu hỏi được nhận dạng từ tài liệu ({parsedQuestions.length}):
              </span>
              <span className="text-sm text-gray-500 ml-2">
                (Chọn đáp án đúng cho mỗi câu hỏi)
              </span>
            </p>

            {parsedQuestions.map((question, index) => (
              <Card key={index} className="shadow-sm">
                <CardContent className="pt-4">
                  <p className="font-medium mb-2">
                    {index + 1}. {question.content}
                  </p>
                  <RadioGroup
                    value={question.answers
                      .findIndex((a) => a.isCorrect)
                      .toString()}
                    onValueChange={(value) =>
                      handleCorrectAnswerChange(index, parseInt(value))
                    }
                    className="mt-2 space-y-2"
                  >
                    {question.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={aIndex.toString()}
                          id={`q${index}-a${aIndex}`}
                        />
                        <Label
                          htmlFor={`q${index}-a${aIndex}`}
                          className={`flex-1 ${
                            answer.isCorrect ? "font-medium text-green-600" : ""
                          }`}
                        >
                          {String.fromCharCode(65 + aIndex)}. {answer.content}
                          {answer.isCorrect && (
                            <Check className="inline-block h-4 w-4 ml-1 text-green-600" />
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setParsedQuestions(null);
            }}
          >
            Hủy
          </Button>
          {parsedQuestions && (
            <Button onClick={importQuestions} disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Nhập {parsedQuestions.length} câu hỏi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
