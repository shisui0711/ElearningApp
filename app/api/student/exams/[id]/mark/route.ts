import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check if the user is a student
    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!student) {
      return new NextResponse(
        JSON.stringify({ error: "Student profile not found" }),
        { status: 404 }
      );
    }

    const { id: attemptId } = await params;

    // Check if the attempt exists and belongs to the student
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: student.id,
      },
    });

    if (!attempt) {
      return new NextResponse(
        JSON.stringify({ error: "Exam attempt not found" }),
        { status: 404 }
      );
    }

    // If exam is already finished, don't allow marking questions
    if (attempt.finishedAt) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot mark questions on a completed exam" }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { markedQuestions } = body;

    if (!Array.isArray(markedQuestions)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid markedQuestions format" }),
        { status: 400 }
      );
    }

    // Delete existing marks first
    await prisma.markedQuestion.deleteMany({
      where: {
        attemptId,
      },
    });

    // Add all new marks
    if (markedQuestions.length > 0) {
      // Create all marked questions
      await prisma.$transaction(
        markedQuestions.map((questionId) =>
          prisma.markedQuestion.create({
            data: {
              attemptId,
              questionId,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STUDENT_EXAM_MARK]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 