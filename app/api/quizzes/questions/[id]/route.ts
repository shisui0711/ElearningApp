import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

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

    const { id } = await params;

    const question = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        answers: true,
      },
    });

    if (!question) {
      return new NextResponse(JSON.stringify({ error: "Question not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("[QUIZ_QUESTION_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const { content, points, answers, imageUrl } = body;

    // Validate the question exists
    const existingQuestion = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        answers: true,
      },
    });

    if (!existingQuestion) {
      return new NextResponse(JSON.stringify({ error: "Question not found" }), {
        status: 404,
      });
    }

    if (answers && (!Array.isArray(answers) || answers.length < 2)) {
      return new NextResponse(JSON.stringify({ error: "At least 2 answers required" }), {
        status: 400,
      });
    }

    // Validate answers if provided
    if (answers) {
      const hasCorrectAnswer = answers.some((answer: any) => answer.isCorrect);
      if (!hasCorrectAnswer) {
        return new NextResponse(JSON.stringify({ error: "At least one answer must be correct" }), {
          status: 400,
        });
      }
    }

    // Update the question and answers
    const result = await prisma.$transaction(async (tx) => {
      // Update question
      const updatedQuestion = await tx.quizQuestion.update({
        where: { id },
        data: {
          content: content || existingQuestion.content,
          points: points || existingQuestion.points,
          imageUrl: imageUrl !== undefined ? imageUrl : existingQuestion.imageUrl,
        },
        include: {
          answers: true,
        },
      });

      // If answers are provided, replace existing answers
      if (answers) {
        // Delete existing answers
        await tx.quizAnswer.deleteMany({
          where: {
            questionId: id,
          },
        });

        // Create new answers
        const newAnswers = await Promise.all(
          answers.map((answer: any) =>
            tx.quizAnswer.create({
              data: {
                questionId: id,
                content: answer.content,
                isCorrect: answer.isCorrect,
              },
            })
          )
        );

        return {
          ...updatedQuestion,
          answers: newAnswers,
        };
      }

      return updatedQuestion;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[QUIZ_QUESTION_PUT]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function DELETE(
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

    const { id } = await params;

    // Check if the question exists
    const question = await prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return new NextResponse(JSON.stringify({ error: "Question not found" }), {
        status: 404,
      });
    }

    // Delete question (cascades to answers)
    await prisma.quizQuestion.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_QUESTION_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 