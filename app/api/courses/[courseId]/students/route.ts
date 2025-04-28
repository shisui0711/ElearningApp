import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          some: {
            courseId: courseId,
          },
        },
      },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: students,
    });
  } catch (error) {
    console.error("[COURSE_STUDENTS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}
