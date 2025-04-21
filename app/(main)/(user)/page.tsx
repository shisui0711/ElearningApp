import CourseFilter from "@/components/CourseFilter";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-8">
          <div className="h-px flex-1 bg-gradient-to-r from-border/0 via-border to-border/0" />
          <span className="text-sm font-medium text-muted-foreground">
            Danh sách khóa học
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border/0 via-border to-border/0 " />
        </div>
        
        {/* Course Filter */}
        <div id="courses">
          <Suspense fallback={<div className="h-32 bg-card/50 rounded-lg animate-pulse" />}>
            <CourseFilter />
          </Suspense>
        </div>
      </div>
    </div>
  );
}


