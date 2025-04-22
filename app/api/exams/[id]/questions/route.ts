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

    const { id: examId } = await params;

    if (!examId) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return new NextResponse(JSON.stringify({ error: "Exam not found" }), {
        status: 404,
      });
    }

    const body = await request.json();
    const { content, points: rawPoints, answers, imageUrl, videoUrl } = body;
    const points = Math.max(rawPoints || 1, 1);

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

    // Transaction to create question, answers, and link to exam
    const result = await prisma.$transaction(async (tx) => {
      // Create the question
      const question = await tx.question.create({
        data: {
          content,
          points,
          imageUrl,
          videoUrl,
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

      // Get the current max order for questions in this exam
      const maxOrderResult = await tx.examQuestion.aggregate({
        where: {
          examId,
        },
        _max: {
          order: true,
        },
      });

      const nextOrder = (maxOrderResult._max.order || 0) + 1;

      // Link question to exam
      const examQuestion = await tx.examQuestion.create({
        data: {
          examId,
          questionId: question.id,
          order: nextOrder,
        },
      });

      return {
        question,
        examQuestion,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[EXAM_QUESTIONS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 