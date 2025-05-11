import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { NotificationType } from "@prisma/client";

// Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { postId } = await params;

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
      await prisma.$transaction(async (tx) => {
        // Delete the like
        await tx.forumLike.delete({
          where: {
            id: existingLike.id,
          },
        });

        // Delete any related notifications
        await tx.notification.deleteMany({
          where: {
            entityId: postId,
            entityType: "forum_post",
            type: NotificationType.FORUM,
            userId: post.userId,
          },
        });
      });

      return NextResponse.json({ liked: false, topicId: post.topicId });
    } else {
      // Like
      // Get post author to send notification
      const postAuthor = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { userId: true }
      });

      // Create like and notification in a transaction
      await prisma.$transaction(async (tx) => {
        // Create the like
        await tx.forumLike.create({
          data: {
            userId: user.id,
            postId,
          },
        });

        // Create notification for post author if it's not the same user
        if (postAuthor && postAuthor.userId !== user.id) {
          await tx.notification.create({
            data: {
              userId: postAuthor.userId,
              type: NotificationType.FORUM,
              content: "Bạn đã nhận được một lượt thích mới cho bài viết của mình",
              title: "Lượt thích mới",
              entityId: post.topicId,
              entityType: "forum_post",
              read: false,
            },
          });
        }
      });

      // Don't create the like again since we did it in the transaction
      return NextResponse.json({ liked: true, topicId: post.topicId });
    }
  } catch (error) {
    console.error("[POST_LIKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 