"use server";

import { notFound } from "next/navigation";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import AssignmentDetail from "./AssignmentDetail";
import { Assignment, AssignmentSubmission, AssignmentType, ExamAttempt, QuizAttempt } from "@prisma/client";

interface AssignmentPageProps {
  params: Promise<{ id: string }>;
}

// Define types for the formatted assignment output
interface FormattedAssignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  type: AssignmentType;
  fileType: string | null;
  examId: string | null;
  quizId: string | null;
  course: {
    id: string;
    name: string;
    teacher: {
      user: {
        displayName: string;
      };
    };
    enrollments: any[];
  };
  exam: {
    id: string;
    title: string;
    duration: number;
  } | null;
  quiz: {
    id: string;
    title: string;
    timeLimit: number | null;
  } | null;
  submissions: Array<{
    id: string;
    fileUrl: string | null;
    examAttemptId: string | null;
    quizAttemptId: string | null;
    grade: number | null;
    submittedAt: string;
    examAttempt: {
      id: string;
      score: number | null;
      startedAt: string | null;
      finishedAt: string | null;
    } | null;
    quizAttempt: {
      id: string;
      score: number | null;
      startedAt: string | null;
      finishedAt: string | null;
    } | null;
  }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params;
  const { user } = await validateRequest();

  if (!user || !user.student) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Bạn cần đăng nhập để xem bài tập</h1>
        <p>Vui lòng đăng nhập với tài khoản sinh viên để xem và nộp bài tập.</p>
      </div>
    );
  }

  // Lấy thông tin bài tập
  const assignment = await prisma.assignment.findUnique({
    where: {
      id,
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          teacher: {
            include: {
              user: {
                select: {
                  displayName: true,
                },
              },
            },
          },
          enrollments: {
            where: {
              studentId: user.student.id,
            },
          },
        },
      },
      exam: {
        select: {
          id: true,
          title: true,
          duration: true,
        },
      },
      quiz: {
        select: {
          id: true,
          title: true,
          timeLimit: true,
        },
      },
      submissions: {
        where: {
          studentId: user.student.id,
        },
        include: {
          examAttempt: true,
          quizAttempt: true,
        },
      },
    },
  });

  if (!assignment) {
    return notFound();
  }

  // Kiểm tra xem sinh viên có quyền xem bài tập không
  const isEnrolled = assignment.course.enrollments.length > 0;
  if (!isEnrolled) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Bạn không có quyền xem bài tập này</h1>
        <p>
          Bạn cần đăng ký khóa học "{assignment.course.name}" để xem và nộp bài
          tập.
        </p>
      </div>
    );
  }

  // Convert the Date object to string before passing to the client component
  const formattedAssignment: FormattedAssignment = {
    ...assignment,
    dueDate: assignment.dueDate.toISOString(),
    submissions: assignment.submissions.map(submission => ({
      ...submission,
      submittedAt: submission.submittedAt.toISOString(),
      examAttempt: submission.examAttempt
        ? {
            ...submission.examAttempt,
            startedAt: submission.examAttempt.startedAt?.toISOString() || null,
            finishedAt: submission.examAttempt.finishedAt?.toISOString() || null,
          }
        : null,
      quizAttempt: submission.quizAttempt
        ? {
            ...submission.quizAttempt,
            startedAt: submission.quizAttempt.startedAt?.toISOString() || null,
            finishedAt: submission.quizAttempt.finishedAt?.toISOString() || null,
          }
        : null,
    })),
  };

  return (
    <AssignmentDetail
      assignment={formattedAssignment}
      studentId={user.student.id}
    />
  );
} 