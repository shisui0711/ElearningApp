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

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id: quizId } = await params;

    if (!quizId) {
      return new NextResponse(JSON.stringify({ error: "Missing quiz ID" }), {
        status: 400,
      });
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return new NextResponse(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
      });
    }

    const body = await request.json();
    const { content, points = 1, answers, imageUrl } = body;

    if (!content || typeof content !== "string") {
      return new NextResponse(JSON.stringify({ error: "Invalid question content" }), {
        status: 400,
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length < 2) {
      return new NextResponse(JSON.stringify({ error: "At least 2 answers required" }), {
        status: 400,
      });
    }

    // Validate answers
    const hasCorrectAnswer = answers.some(answer => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return new NextResponse(JSON.stringify({ error: "At least one answer must be correct" }), {
        status: 400,
      });
    }

    // Transaction to create question, answers
    const result = await prisma.$transaction(async (tx) => {
      // Get the current max order for questions in this quiz
      const maxOrderResult = await tx.quizQuestion.aggregate({
        where: {
          quizId,
        },
        _max: {
          order: true,
        },
      });

      const nextOrder = (maxOrderResult._max.order || 0) + 1;

      // Create the question with answers
      const question = await tx.quizQuestion.create({
        data: {
          quizId,
          content,
          points,
          imageUrl,
          order: nextOrder,
          answers: {
            create: answers.map(answer => ({
              content: answer.content,
              isCorrect: answer.isCorrect,
            })),
          },
        },
        include: {
          answers: true,
        },
      });

      return question;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[QUIZ_QUESTIONS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function GET(
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

    const { id: quizId } = await params;

    const questions = await prisma.quizQuestion.findMany({
      where: {
        quizId,
      },
      include: {
        answers: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("[QUIZ_QUESTIONS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 