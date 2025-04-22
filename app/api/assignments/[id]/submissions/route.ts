import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// API để lấy danh sách bài nộp của một bài tập
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Lấy thông tin bài tập để kiểm tra quyền
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập - chỉ giáo viên của khóa học và admin mới có quyền xem tất cả bài nộp
    if (
      user.role === "TEACHER" &&
      assignment.course.teacherId !== user.teacher?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Lấy danh sách bài nộp
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// API để cập nhật điểm số cho bài nộp
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chỉ giáo viên và admin mới có thể chấm điểm
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { submissionId, grade, feedback } = await request.json();

    if (!submissionId || grade === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Kiểm tra bài tập và quyền của giáo viên
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.assignment.id !== id) {
      return NextResponse.json(
        { error: "Submission does not belong to this assignment" },
        { status: 400 }
      );
    }

    // Kiểm tra quyền chấm bài
    if (
      user.role === "TEACHER" &&
      submission.assignment.course.teacherId !== user.teacher?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cập nhật điểm và feedback
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: grade,
        feedback,
        gradedAt: new Date(),
        gradedBy: user.id,
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMISSIONS_PUT]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 