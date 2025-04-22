import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Get specific topic with posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return new NextResponse("Topic ID is required", { status: 400 });
    }

    // Increment view counter
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: { views: { increment: 1 } }
    });

    const topic = await prisma.forumTopic.findUnique({
      where: {
        id: topicId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        category: true,
        posts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 });
    }

    // Get current user's likes
    const { user } = await validateRequest();
    let userLikes: any[] = [];
    
    if (user) {
      userLikes = await prisma.forumLike.findMany({
        where: {
          userId: user.id,
          post: {
            topicId: topicId,
          },
        },
        select: {
          postId: true,
        },
      });
    }

    return NextResponse.json({
      ...topic,
      userLikes: userLikes.map(like => like.postId),
    });
  } catch (error) {
    console.error("[TOPIC_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Update a topic (owner or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { topicId } = await params;
    const { title, content } = await request.json();

    if (!topicId) {
      return new NextResponse("Topic ID is required", { status: 400 });
    }

    // Get the topic to check ownership
    const existingTopic = await prisma.forumTopic.findUnique({
      where: {
        id: topicId,
      },
    });

    if (!existingTopic) {
      return new NextResponse("Topic not found", { status: 404 });
    }

    // Check if user is owner or admin
    if (existingTopic.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const topic = await prisma.forumTopic.update({
      where: {
        id: topicId,
      },
      data: {
        title,
        content,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("[TOPIC_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a topic (owner or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { topicId } = await params;

    if (!topicId) {
      return new NextResponse("Topic ID is required", { status: 400 });
    }

    // Get the topic to check ownership
    const existingTopic = await prisma.forumTopic.findUnique({
      where: {
        id: topicId,
      },
    });

    if (!existingTopic) {
      return new NextResponse("Topic not found", { status: 404 });
    }

    // Check if user is owner or admin
    if (existingTopic.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.forumTopic.delete({
      where: {
        id: topicId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TOPIC_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 