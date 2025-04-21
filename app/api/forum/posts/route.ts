import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Create a new post in a topic
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content, topicId } = await request.json();

    if (!content || !topicId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if topic exists and is not locked
    const topic = await prisma.forumTopic.findUnique({
      where: {
        id: topicId,
      },
    });

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 });
    }

    if (topic.isLocked && user.role !== "ADMIN") {
      return new NextResponse("Topic is locked", { status: 403 });
    }

    const post = await prisma.forumPost.create({
      data: {
        content,
        userId: user.id,
        topicId,
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
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Update the topic's updatedAt timestamp
    await prisma.forumTopic.update({
      where: {
        id: topicId,
      },
      data: {
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POSTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 