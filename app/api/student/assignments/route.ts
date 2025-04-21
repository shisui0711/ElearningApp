import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Get all assignments (exam attempts) for the student
    const assignments = await prisma.examAttempt.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                points: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[STUDENT_ASSIGNMENTS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
