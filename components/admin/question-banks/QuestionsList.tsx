import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye } from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

interface QuestionsListProps {
  questionBankId: string;
}

export default async function QuestionsList({ questionBankId }: QuestionsListProps) {
  const questions = await prisma.question.findMany({
    where: {
      questionBankId,
    },
    include: {
      answers: {
        select: {
          id: true,
          isCorrect: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  if (questions.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg">
        <h3 className="text-xl font-medium mb-2">Chưa có câu hỏi nào</h3>
        <p className="text-muted-foreground mb-4">
          Hãy thêm câu hỏi đầu tiên vào ngân hàng câu hỏi này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => {
        const correctAnswersCount = question.answers.filter(answer => answer.isCorrect).length;
        
        return (
          <Card key={question.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium">
                      {question.content.length > 100
                        ? `${question.content.substring(0, 100)}...`
                        : question.content}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <Badge variant={
                      question.difficulty === "EASY" ? "outline" : 
                      question.difficulty === "MEDIUM" ? "secondary" : 
                      "destructive"
                    }>
                      {question.difficulty === "EASY" 
                        ? "Dễ" 
                        : question.difficulty === "MEDIUM" 
                          ? "Trung bình" 
                          : "Khó"}
                    </Badge>
                    <span>{question.points} điểm</span>
                    <span>{question.answers.length} phương án, {correctAnswersCount} đáp án đúng</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/question-banks/${questionBankId}/questions/${question.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                  </Link>
                  <Link href={`/admin/question-banks/${questionBankId}/questions/${question.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 