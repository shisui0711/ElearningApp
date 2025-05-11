import React from "react";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ExamManagement from "./ExamManagement";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    class?: string;
    name?: string;
    student?: string;
    status?: string;
  }>;
}

async function getExamAttempts(courseId: string, classId?: string, examName?: string) {
  try {
    // Get all exam attempts for this course and optionally filtered by class
    const attempts = await prisma.examAttempt.findMany({
      where: {
        courseId: courseId,
        ...(classId ? { classId: classId } : {}),
        ...(examName ? { name: { contains: examName, mode: 'insensitive' } } : {}),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
        answers: {
          include: {
            answer: true,
            question: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all classes for this course for the filter dropdown
    const classes = await prisma.class.findMany({
      where: {
        attempts: {
          some: {
            courseId: courseId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return { attempts, classes };
  } catch (error) {
    console.error("Error fetching exam attempts:", error);
    return { attempts: [], classes: [] };
  }
}

export default async function ExamManagementPage({ params, searchParams }: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "TEACHER") {
    redirect("/");
  }

  const { courseId } = await params;
  const data = await searchParams;

  // Verify the course belongs to this teacher
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
      teacher: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!course) {
    notFound();
  }

  // Get the exam attempts data
  const { attempts, classes } = await getExamAttempts(
    courseId,
    data.class,
    data.name
  );

  return (
    <ExamManagement
      courseId={courseId}
      courseTitle={course.name}
      examAttempts={attempts}
      classes={classes}
      selectedClassId={data.class}
      examName={data.name}
      studentName={data.student}
      status={data.status}
    />
  );
}
