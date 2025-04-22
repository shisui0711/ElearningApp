import { Suspense } from "react";
import { notFound } from "next/navigation";
import ExamEditor from "@/components/admin/exams/ExamEditor";
import { Skeleton } from "@/components/ui/skeleton";

interface ExamDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<ExamEditorSkeleton />}>
        <ExamEditor examId={id} />
      </Suspense>
    </div>
  );
}

function ExamEditorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
