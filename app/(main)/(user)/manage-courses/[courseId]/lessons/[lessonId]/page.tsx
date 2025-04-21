import React from "react";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ManageLessons from "../ManageLessons";

interface PageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

async function getLessonDetails(
  courseId: string,
  lessonId: string,
  userId: string
) {
  try {
    // First, find the teacher record
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!teacher) {
      return null;
    }

    // Get the course to verify ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id, // Only allow access to the teacher's own courses
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!course) {
      return null;
    }

    // Get the lesson details
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId: courseId,
      },
      include: {
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    // Get all lessons for the course (for document management)
    const allLessons = await prisma.lesson.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return { course, lesson, allLessons };
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    return null;
  }
}

export default async function LessonManagementPage({ params }: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "TEACHER") {
    redirect("/");
  }

  const { courseId, lessonId } = await params
  const data = await getLessonDetails(
    courseId,
    lessonId,
    user.id
  );

  if (!data) {
    notFound();
  }

  const { course, lesson, allLessons } = data;

  return (
    <ManageLessons course={course} lesson={lesson} allLessons={allLessons} />
  );
}
