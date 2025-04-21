import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: attemptId } = params;

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

    // If exam is already finished, don't allow new answers
    if (attempt.finishedAt) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot answer questions on a completed exam" }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questionId, answerId } = body;

    if (!questionId || !answerId) {
      return new NextResponse(
        JSON.stringify({ error: "Question ID and Answer ID are required" }),
        { status: 400 }
      );
    }

    // Check if the question and answer exist
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: {
          where: { id: answerId },
        },
      },
    });

    if (!question) {
      return new NextResponse(
        JSON.stringify({ error: "Question not found" }),
        { status: 404 }
      );
    }

    if (question.answers.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Answer not found for this question" }),
        { status: 404 }
      );
    }

    // Check if an answer for this question already exists
    const existingAnswer = await prisma.studentAnswer.findFirst({
      where: {
        attemptId,
        questionId,
      },
    });

    if (existingAnswer) {
      // Update the existing answer
      await prisma.studentAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          answerId,
        },
      });
    } else {
      // Create a new answer
      await prisma.studentAnswer.create({
        data: {
          attemptId,
          questionId,
          answerId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STUDENT_EXAM_ANSWER]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 