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

    const { id: quizId } = await params;
    
    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
      });
    }

    // Check if student has any existing active attempt
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        studentId: user.student.id,
        finishedAt: null,
      },
    });

    if (existingAttempt) {
      return NextResponse.json(existingAttempt);
    }

    // Create new attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: user.student.id,
        questionAttempts: {
          create: quiz.questions.map(question => ({
            questionId: question.id,
            answerAttempts: {
              create: question.answers.map(answer => ({
                answerId: answer.id,
                isSelected: false,
              }))
            }
          }))
        }
      },
      include: {
        questionAttempts: {
          include: {
            question: {
              include: {
                answers: true,
              },
            },
            answerAttempts: {
              include: {
                answer: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(quizAttempt);
  } catch (error) {
    console.error("[QUIZ_START_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 