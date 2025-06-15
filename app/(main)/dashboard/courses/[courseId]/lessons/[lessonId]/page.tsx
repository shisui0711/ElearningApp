"use server";
import { validateRequest } from "@/auth";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import VideoPlayer from "@/components/VideoPlayer";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import React from "react";
import LessonDisplay from "./LessonDisplay";

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

const LessonPage = async ({ params }: LessonPageProps) => {
  const { user } = await validateRequest();

  if (!user) redirect("/sign-in");
  const { courseId, lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      documents: true
    }
  });
  if (!lesson) redirect(`/dashboard/courses/${courseId}`);
  return (
    <LessonDisplay lesson={lesson} studentId={user.student?.id} />
  );
};

export default LessonPage;
