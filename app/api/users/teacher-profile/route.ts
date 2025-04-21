import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET() {
  try {
    const { user } = await validateRequest()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      return new NextResponse("Teacher not found", { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 