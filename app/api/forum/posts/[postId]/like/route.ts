import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { postId } = params;

    if (!postId) {
      return new NextResponse("Post ID is required", { status: 400 });
    }

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: {
        id: postId,
      },
      include: {
        topic: true,
      },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if topic is locked
    if (post.topic.isLocked && user.role !== "ADMIN") {
      return new NextResponse("Topic is locked", { status: 403 });
    }

    // Check if user already liked the post
    const existingLike = await prisma.forumLike.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.forumLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.forumLike.create({
        data: {
          userId: user.id,
          postId,
        },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("[POST_LIKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 