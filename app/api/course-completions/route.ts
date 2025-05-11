import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// GET: Get completion status for a course
export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    
    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // For students, get their own completion status
    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!student) {
        return new NextResponse("Student not found", { status: 404 });
      }

      const completion = await prisma.courseCompletion.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: student.id,
          },
        },
      });

      // Check if the student has completed all lessons in the course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: true,
        },
      });

      if (!course) {
        return new NextResponse("Course not found", { status: 404 });
      }

      const completedLessons = await prisma.completedLesson.findMany({
        where: {
          courseId,
          studentId: student.id,
        },
      });

      const allLessonsCompleted = course.lessons.length > 0 && 
        completedLessons.length === course.lessons.length;

      // Check if the student has rated the course
      const hasRated = await prisma.courseRating.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: student.id,
          },
        },
      });

      return NextResponse.json({
        completion,
        allLessonsCompleted,
        hasRated: !!hasRated,
        canComplete: allLessonsCompleted && !completion?.isRated && !hasRated,
        isFullyCompleted: allLessonsCompleted && !!hasRated,
      });
    }

    // For teachers/admins, get all completions for the course
    const completions = await prisma.courseCompletion.findMany({
      where: {
        courseId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                displayName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    return NextResponse.json(completions);
  } catch (error) {
    console.error("[COURSE_COMPLETIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Mark a course as completed (requires rating)
export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "STUDENT") {
      return new NextResponse("Only students can complete courses", { status: 403 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Get student ID from user ID
    const student = await prisma.student.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Check if the student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseId,
      },
    });

    if (!enrollment) {
      return new NextResponse("You must be enrolled in the course to complete it", { status: 403 });
    }

    // Check if the student has completed all lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    const completedLessons = await prisma.completedLesson.findMany({
      where: {
        courseId,
        studentId: student.id,
      },
    });

    const allLessonsCompleted = course.lessons.length > 0 && 
      completedLessons.length === course.lessons.length;

    if (!allLessonsCompleted) {
      return new NextResponse("You must complete all lessons before completing the course", { status: 400 });
    }

    // Check if the student has rated the course
    const hasRated = await prisma.courseRating.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
    });

    if (!hasRated) {
      return new NextResponse("You must rate the course before completing it", { status: 400 });
    }

    // Create or update course completion
    const completion = await prisma.courseCompletion.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
      update: {
        isRated: true,
        completedAt: new Date(),
      },
      create: {
        courseId,
        studentId: student.id,
        isRated: true,
      },
    });

    return NextResponse.json(completion);
  } catch (error) {
    console.error("[COURSE_COMPLETIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 