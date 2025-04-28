"use server";

import { notFound } from "next/navigation";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import AssignmentDetail from "./AssignmentDetail";
import { Assignment, AssignmentSubmission, AssignmentType, ExamAttempt } from "@prisma/client";

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
  submissions: Array<{
    id: string;
    fileUrl: string | null;
    grade: number | null;
    submittedAt: string;
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
      submissions: {
        where: {
          studentId: user.student.id,
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
      examAttempt: null,
      quizAttempt: null,
    })),
  };

  return (
    <AssignmentDetail
      assignment={formattedAssignment}
      studentId={user.student.id}
    />
  );
} 