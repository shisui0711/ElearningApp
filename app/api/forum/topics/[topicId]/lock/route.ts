import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Toggle lock status of a topic (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { topicId } = await params;

    if (!topicId) {
      return new NextResponse("Topic ID is required", { status: 400 });
    }

    // Check if topic exists
    const topic = await prisma.forumTopic.findUnique({
      where: {
        id: topicId,
      },
    });

    if (!topic) {
      return new NextResponse("Topic not found", { status: 404 });
    }

    // Toggle isLocked status
    const updatedTopic = await prisma.forumTopic.update({
      where: {
        id: topicId,
      },
      data: {
        isLocked: !topic.isLocked,
      },
    });

    return NextResponse.json({
      isLocked: updatedTopic.isLocked,
    });
  } catch (error) {
    console.error("[TOPIC_LOCK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 