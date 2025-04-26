import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye, Trash } from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

export default async function QuestionBanksList() {
  const questionBanks = await prisma.questionBank.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      course: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return (
    <div className="space-y-4">
      {questionBanks.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-xl font-medium mb-2">Chưa có ngân hàng câu hỏi nào</h3>
          <p className="text-muted-foreground mb-4">
            Hãy tạo ngân hàng câu hỏi đầu tiên để giáo viên có thể sử dụng
          </p>
        </div>
      ) : (
        questionBanks.map((bank) => (
          <Card key={bank.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{bank.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>
                      {bank._count.questions} câu hỏi
                    </span>
                    {bank.course && (
                      <span>Khóa học: {bank.course.name}</span>
                    )}
                    <span>
                      Cập nhật{" "}
                      {formatDistance(
                        new Date(bank.updatedAt),
                        new Date(),
                        { addSuffix: true, locale: vi }
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/question-banks/${bank.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                  </Link>
                  <Link href={`/admin/question-banks/${bank.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 