import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Create a new topic
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, categoryId } = await request.json();

    if (!title || !content || !categoryId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if category exists
    const category = await prisma.forumCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    const topic = await prisma.forumTopic.create({
      data: {
        title,
        content,
        userId: user.id,
        categoryId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          }
        },
        category: true,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPICS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 