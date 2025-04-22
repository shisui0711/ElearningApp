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
    
    const quiz = await prisma.quiz.findUnique({
      where: { id },
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

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_GET]", error);
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
    const { title, showCorrectAfter, timeLimit } = body;

    // Validate the quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      return new NextResponse(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
      });
    }

    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: title || existingQuiz.title,
        showCorrectAfter: showCorrectAfter !== undefined ? showCorrectAfter : existingQuiz.showCorrectAfter,
        timeLimit: timeLimit !== undefined ? (timeLimit ? parseInt(timeLimit) : null) : existingQuiz.timeLimit,
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("[QUIZ_PUT]", error);
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

    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!quiz) {
      return new NextResponse(JSON.stringify({ error: "Quiz not found" }), {
        status: 404,
      });
    }

    // Check if the quiz is used in any assignments
    if (quiz.assignments.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Quiz is being used in assignments and cannot be deleted",
        }),
        {
          status: 400,
        }
      );
    }

    // Delete quiz
    await prisma.quiz.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 