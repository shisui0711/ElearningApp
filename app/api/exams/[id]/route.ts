import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return new NextResponse(JSON.stringify({ error: "Exam not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAM_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function PATCH(
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

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id } = params;
    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    const body = await request.json();
    const { title, duration, showCorrectAfter } = body;

    if (!title || typeof title !== "string") {
      return new NextResponse(JSON.stringify({ error: "Invalid title" }), {
        status: 400,
      });
    }

    const updateData: any = { title };
    
    // Add duration if provided and valid
    if (duration !== undefined) {
      if (typeof duration !== 'number' || duration <= 0) {
        return new NextResponse(JSON.stringify({ error: "Invalid duration" }), {
          status: 400,
        });
      }
      updateData.duration = duration;
    }
    
    // Add showCorrectAfter if provided and valid
    if (showCorrectAfter !== undefined) {
      if (typeof showCorrectAfter !== 'boolean') {
        return new NextResponse(JSON.stringify({ error: "Invalid showCorrectAfter value" }), {
          status: 400,
        });
      }
      updateData.showCorrectAfter = showCorrectAfter;
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAM_PATCH]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function DELETE(
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

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id } = params;
    if (!id) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    // Find all related exam questions
    const examQuestions = await prisma.examQuestion.findMany({
      where: { examId: id },
      select: { questionId: true },
    });

    // Delete the exam (will cascade delete the exam questions)
    await prisma.exam.delete({
      where: { id },
    });

    // Delete any questions that were only used in this exam (to avoid orphaned questions)
    // This will cascade delete associated answers
    for (const { questionId } of examQuestions) {
      const otherExamUsingThisQuestion = await prisma.examQuestion.findFirst({
        where: { questionId },
      });

      if (!otherExamUsingThisQuestion) {
        await prisma.question.delete({
          where: { id: questionId },
        });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[EXAM_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 