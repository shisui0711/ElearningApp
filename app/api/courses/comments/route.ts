import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get comments for a course
export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId");

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Get top-level comments for the course
    const comments = await prisma.courseComment.findMany({
      where: {
        courseId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          }
        },
        // Include replies
        replies: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                role: true,
              }
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COURSE_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Add a new comment to a course
export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { courseId, content, parentId } = body;

    if (!courseId || !content) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        teacher: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check user permission to comment
    const isTeacher = course.teacherId === user.teacher?.id;
    const isAdmin = user.role === "ADMIN";
    
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId: user.student?.id,
      },
    });
    
    const isEnrolled = !!enrollment;

    // Only allow comments from enrolled students, the teacher, or admins
    if (!isEnrolled && !isTeacher && !isAdmin) {
      return new NextResponse("You must be enrolled in this course to comment", { status: 403 });
    }

    // If it's a reply, verify the parent comment exists
    if (parentId) {
      const parentComment = await prisma.courseComment.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!parentComment) {
        return new NextResponse("Parent comment not found", { status: 404 });
      }
    }

    // Create the comment
    const comment = await prisma.courseComment.create({
      data: {
        content,
        courseId,
        userId: user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          }
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COURSE_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Delete a comment
export async function DELETE(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const commentId = url.searchParams.get("id");

    if (!commentId) {
      return new NextResponse("Comment ID is required", { status: 400 });
    }

    // Find the comment
    const comment = await prisma.courseComment.findUnique({
      where: {
        id: commentId,
      },
      include: {
        course: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user is the comment author, course teacher, or admin
    const isCommentAuthor = comment.userId === user.id;
    const isTeacher = comment.course.teacherId === user.teacher?.id;
    const isAdmin = user.role === "ADMIN";

    if (!isCommentAuthor && !isTeacher && !isAdmin) {
      return new NextResponse("You don't have permission to delete this comment", { status: 403 });
    }

    // Delete the comment and its replies
    if (!comment.parentId) {
      // If it's a parent comment, delete all replies first
      await prisma.courseComment.deleteMany({
        where: {
          parentId: commentId,
        },
      });
    }

    // Delete the comment itself
    await prisma.courseComment.delete({
      where: {
        id: commentId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COURSE_COMMENTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 