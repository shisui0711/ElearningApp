import { Suspense } from "react";
import QuestionBanksList from "@/components/admin/question-banks/QuestionBanksList";
import CreateQuestionBankButton from "@/components/admin/question-banks/CreateQuestionBankButton";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionBanksManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý ngân hàng câu hỏi</h1>
        <CreateQuestionBankButton />
      </div>

      <Suspense fallback={<QuestionBanksListSkeleton />}>
        <QuestionBanksList />
      </Suspense>
    </div>
  );
}

function QuestionBanksListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
