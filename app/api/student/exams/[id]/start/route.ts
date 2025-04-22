import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { formatDateToString } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } >}
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (!user.student) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id: attemptId } = await params;
    if (!attemptId) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: user.student.id,
      },
      include: {
        exam: {
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
        },
        answers: true,
      },
    });

    if (!attempt) {
      return new NextResponse(
        JSON.stringify({ error: "Exam attempt not found" }),
        { status: 404 }
      );
    }

    if (attempt.startedAt) {
      return new NextResponse(
        JSON.stringify({ error: "This exam has already been started" }),
        { status: 403 }
      );
    }

    if (attempt.finishedAt) {
      return new NextResponse(
        JSON.stringify({ error: "This exam has already been submitted" }),
        { status: 403 }
      );
    }
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        startedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAttempt);
  } catch (error) {
    console.error("[EXAM_START]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}
