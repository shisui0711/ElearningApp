import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get comments for a lesson
export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const lessonId = url.searchParams.get("lessonId");

    if (!lessonId) {
      return new NextResponse("Lesson ID is required", { status: 400 });
    }

    // Get comments for the lesson
    const comments = await prisma.lessonComment.findMany({
      where: {
        lessonId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[LESSON_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Add a new comment to a lesson
export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { lessonId, content } = body;

    if (!lessonId || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!lesson) {
      return new NextResponse("Lesson not found", { status: 404 });
    }

    // Create the comment
    const comment = await prisma.lessonComment.create({
      data: {
        content,
        lessonId,
        userId: user.id,
      },
      include: {
        user: true
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[LESSON_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 