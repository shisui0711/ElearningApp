import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } =  await validateRequest();
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

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Missing question ID" }), {
        status: 400,
      });
    }

    const body = await request.json();
    const { content, points, answers } = body;

    if (!content || typeof content !== "string") {
      return new NextResponse(
        JSON.stringify({ error: "Invalid question content" }),
        { status: 400 }
      );
    }

    if (!points || typeof points !== "number" || points < 1) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid points value" }),
        { status: 400 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length < 2) {
      return new NextResponse(
        JSON.stringify({ error: "At least 2 answers required" }),
        { status: 400 }
      );
    }

    // Validate answers
    const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return new NextResponse(
        JSON.stringify({ error: "At least one answer must be correct" }),
        { status: 400 }
      );
    }

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        answers: true,
      },
    });

    if (!existingQuestion) {
      return new NextResponse(
        JSON.stringify({ error: "Question not found" }),
        { status: 404 }
      );
    }

    // Transaction to update question and its answers
    const result = await prisma.$transaction(async (tx) => {
      // Update question
      const updatedQuestion = await tx.question.update({
        where: { id },
        data: {
          content,
          points,
        },
      });

      // Get existing answers
      const existingAnswerIds = existingQuestion.answers.map(
        (answer) => answer.id
      );
      const incomingAnswerIds = answers
        .filter((a) => a.id)
        .map((a) => a.id as string);

      // Delete answers that are no longer present
      const answersToDelete = existingAnswerIds.filter(
        (id) => !incomingAnswerIds.includes(id)
      );
      if (answersToDelete.length > 0) {
        await tx.answer.deleteMany({
          where: {
            id: {
              in: answersToDelete,
            },
          },
        });
      }

      // Update existing answers and create new ones
      for (const answer of answers) {
        if (answer.id) {
          // Update existing answer
          await tx.answer.update({
            where: { id: answer.id },
            data: {
              content: answer.content,
              isCorrect: answer.isCorrect,
            },
          });
        } else {
          // Create new answer
          await tx.answer.create({
            data: {
              content: answer.content,
              isCorrect: answer.isCorrect,
              questionId: id,
            },
          });
        }
      }

      // Get updated question with all answers
      return tx.question.findUnique({
        where: { id },
        include: {
          answers: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[QUESTION_PUT]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
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

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: "Missing question ID" }),
        { status: 400 }
      );
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        exams: true,
      },
    });

    if (!question) {
      return new NextResponse(
        JSON.stringify({ error: "Question not found" }),
        { status: 404 }
      );
    }

    // If question is used in multiple exams, just remove from current exam
    if (question.exams.length > 1) {
      // Get the exam ID from the request URL or query params
      const url = new URL(request.url);
      const examId = url.searchParams.get("examId");

      if (examId) {
        await prisma.examQuestion.deleteMany({
          where: {
            examId,
            questionId: id,
          },
        });
      } else {
        // If no exam ID is provided, delete the first exam-question relationship
        await prisma.examQuestion.delete({
          where: {
            id: question.exams[0].id,
          },
        });
      }
    } else {
      // If question is only used in one exam, delete the question entirely
      await prisma.question.delete({
        where: { id },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUESTION_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 