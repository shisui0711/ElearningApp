import { notFound } from "next/navigation";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import QuestionsList from "@/components/admin/question-banks/QuestionsList";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionBankPageProps {
  params: {
    id: string;
  };
}

export default async function QuestionBankPage({ params }: QuestionBankPageProps) {
  const questionBank = await prisma.questionBank.findUnique({
    where: {
      id: params.id,
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

  if (!questionBank) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/question-banks">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Quay lại
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{questionBank.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/question-banks/${questionBank.id}/edit`}>
              <Edit className="h-4 w-4 mr-1" />
              Chỉnh sửa
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/question-banks/${questionBank.id}/questions/create`}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Tạo câu hỏi
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin ngân hàng câu hỏi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionBank.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Mô tả:</h3>
              <p>{questionBank.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Số câu hỏi:</h3>
              <p>{questionBank._count.questions} câu hỏi</p>
            </div>
            {questionBank.course && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Khóa học:</h3>
                <p>{questionBank.course.name}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Ngày tạo:</h3>
              <p>{format(new Date(questionBank.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Danh sách câu hỏi</h2>
        <Suspense fallback={<QuestionsListSkeleton />}>
          <QuestionsList questionBankId={questionBank.id} />
        </Suspense>
      </div>
    </div>
  );
}

function QuestionsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
