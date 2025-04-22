"use client";

import { useSidebar } from "@/provider/SidebarProvider";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowLeft, Check, ChevronRight, Library, PlayCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeToggle } from "./ThemeToggle";
import CourseProgress from "./CourseProgress";
import { Accordion } from "./ui/accordion";
import { CourseManageWithDetails, CourseWithDetails } from "@/types";
import { CompletedLesson } from "@prisma/client";

interface SidebarProps {
  course: CourseManageWithDetails;
  completedLessons: CompletedLesson[];
}

const Sidebar = ({ course, completedLessons }: SidebarProps) => {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebar();
  const [openLessons, setOpenLessons] = useState<string[]>([]);
  const progress = Math.ceil( completedLessons.length / course.lessons.length * 100);

  useEffect(()=>{
    if(pathname && course.lessons){
      const currentLessonId = course.lessons.find((lesson)=> pathname === `/dashboard/course/${course.id}/lessons/${lesson.id}`)?.id;

      if(currentLessonId && !openLessons.includes(currentLessonId)){
        setOpenLessons((prev)=>[...prev,currentLessonId]);
      }
    }
  },[pathname,course,openLessons])

  const SidebarContent = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 lg:p-6 border-b flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/my-courses"
              className="flex items-center gap-x-2 text-sm hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-4" />
              <div className="flex items-center gap-x-2">
                <Library className="size-4" />
                <span>Các bài học</span>
              </div>
            </Link>
            <div className="space-x-2">
              <ThemeToggle />
              <Button
                onClick={close}
                variant="ghost"
                className="lg:hidden -mr-2"
                size="icon"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="font-semibold text-2xl">{course.name}</h1>
            <CourseProgress progress={progress} variant="success" label="Tiến độ" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 lg:p-4">
            <Accordion
              type="multiple"
              className="w-full space-y-4"
              value={openLessons}
              onValueChange={setOpenLessons}
            >
              {course.lessons?.map((lesson, lessonIndex) => {
                const isActive = pathname === `/dashboard/courses/${course.id}/lessons/${lesson.id}`
                const isCompleted = completedLessons.some((completion) => completion.id === lesson.id);
                return <Link href={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
                  key={lesson.id}
                  prefetch={false}
                  onClick={close}
                  className={cn('flex items-center pl-8 lg:pl-10 pr-2 lg:pr-4 py-2 gap-x-2 lg:gap-x-4 group hover:bg-muted/50 transition-colors relative',
                    isActive && 'bg-muted',
                    isCompleted && 'text-muted-foreground'
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground min-w-[28px]">
                    {String(lessonIndex +1).padStart(2,"0")}
                  </span>
                  {isCompleted ? (
                    <Check className="size-4 shrink-0 text-green-500"/>
                  ):(
                    <PlayCircle className={cn('size-4 shrink-0',
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/80"
                    )}/>
                  )}
                  <span className={cn('text-sm line-clamp-2 min-w-0',
                    isCompleted && 'text-muted-foreground line-through decoration-green-500/50'
                  )}>
                    {lesson.title}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-primary"/>
                  )}
                </Link>
              })}
            </Accordion>
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex flex-col items-center w-[60px] border-r bg-background lg:hidden py-4 gap-y-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" prefetch={false}>
                <Button variant="ghost" size="icon" className="size-10">
                  <Library className="size-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Course Library</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggle}
                variant="ghost"
                size="icon"
                className="size-10"
              >
                <ChevronRight
                  className={cn(
                    "size-5 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toogle Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </aside>
      {/* Main sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background transition-all duration-300 ease-in-out",
          "lg:z-50 lg:block lg:w-96 lg:border-r",
          isOpen
            ? "w-[calc(100%-60px)] translate-x-[60px] lg:translate-x-0 lg:w-96"
            : "translate-x-[-100%] lg:translate-x-0"
        )}
      >
        <div className="h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
