import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Eye, Trash } from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

export default async function ExamsList() {
  const exams = await prisma.exam.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      subject: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  return (
    <div className="space-y-4">
      {exams.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-xl font-medium mb-2">Chưa có bộ câu hỏi nào</h3>
          <p className="text-muted-foreground mb-4">
            Hãy tạo bộ câu hỏi đầu tiên để giáo viên có thể sử dụng
          </p>
        </div>
      ) : (
        exams.map((exam) => (
          <Card key={exam.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>
                      {exam._count.questions} câu hỏi
                    </span>
                    {exam.subject && (
                      <span>Môn: {exam.subject.name}</span>
                    )}
                    <span>
                      Cập nhật{" "}
                      {formatDistance(
                        new Date(exam.updatedAt || exam.createdAt),
                        new Date(),
                        { addSuffix: true, locale: vi }
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/exams/${exam.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                  </Link>
                  <Link href={`/admin/exams/${exam.id}/edit`}>
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
