import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.student) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id: attemptId } = await params;
    
    // Get attempt to verify it belongs to this student
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: user.student.id,
        finishedAt: null,
      },
    });

    if (!attempt) {
      return new NextResponse(JSON.stringify({ error: "Attempt not found or already completed" }), {
        status: 404,
      });
    }

    const body = await request.json();
    const { questionId, answerId, isSelected } = body;

    if (!questionId || !answerId) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    // Find question attempt
    const questionAttempt = await prisma.quizQuestionAttempt.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
    });

    if (!questionAttempt) {
      return new NextResponse(JSON.stringify({ error: "Question not found in this attempt" }), {
        status: 404,
      });
    }

    // Update answer
    const answerAttempt = await prisma.quizAnswerAttempt.update({
      where: {
        questionAttemptId_answerId: {
          questionAttemptId: questionAttempt.id,
          answerId,
        },
      },
      data: {
        isSelected: isSelected === undefined ? true : isSelected,
      },
    });

    return NextResponse.json(answerAttempt);
  } catch (error) {
    console.error("[QUIZ_ANSWER_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 