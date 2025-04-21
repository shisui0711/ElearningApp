import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Update a post (owner or admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { postId } = params;
    const { content } = await request.json();

    if (!postId) {
      return new NextResponse("Post ID is required", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    // Get the post to check ownership
    const existingPost = await prisma.forumPost.findUnique({
      where: {
        id: postId,
      },
      include: {
        topic: true,
      },
    });

    if (!existingPost) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if topic is locked
    if (existingPost.topic.isLocked && user.role !== "ADMIN") {
      return new NextResponse("Topic is locked", { status: 403 });
    }

    // Check if user is owner or admin
    if (existingPost.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const post = await prisma.forumPost.update({
      where: {
        id: postId,
      },
      data: {
        content,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[POST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a post (owner or admin only)
export async function DELETE(
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

    // Get the post to check ownership
    const existingPost = await prisma.forumPost.findUnique({
      where: {
        id: postId,
      },
      include: {
        topic: true,
      },
    });

    if (!existingPost) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if topic is locked
    if (existingPost.topic.isLocked && user.role !== "ADMIN") {
      return new NextResponse("Topic is locked", { status: 403 });
    }

    // Check if user is owner or admin
    if (existingPost.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.forumPost.delete({
      where: {
        id: postId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 