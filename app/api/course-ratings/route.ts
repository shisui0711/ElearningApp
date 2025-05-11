import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// GET: Get all ratings for a specific course
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

    const ratings = await prisma.courseRating.findMany({
      where: {
        courseId,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    return NextResponse.json({
      ratings,
      stats: {
        totalRatings,
        averageRating,
      },
    });
  } catch (error) {
    console.error("[COURSE_RATINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Create a new course rating
export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "STUDENT") {
      return new NextResponse("Only students can rate courses", { status: 403 });
    }

    const body = await req.json();
    const { courseId, rating, review } = body;

    if (!courseId || !rating) {
      return new NextResponse("Course ID and rating are required", { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return new NextResponse("Rating must be between 1 and 5", { status: 400 });
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
      return new NextResponse("You must be enrolled in the course to rate it", { status: 403 });
    }

    // Check if the student has already rated this course
    const existingRating = await prisma.courseRating.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
    });

    if (existingRating) {
      // Update existing rating
      const updatedRating = await prisma.courseRating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          rating,
          review,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updatedRating);
    }

    // Create new rating
    const newRating = await prisma.courseRating.create({
      data: {
        courseId,
        studentId: student.id,
        rating,
        review,
      },
    });

    // Update course completion to mark that the student has rated the course
    await prisma.courseCompletion.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
      update: {
        isRated: true,
      },
      create: {
        courseId,
        studentId: student.id,
        isRated: true,
      },
    });

    return NextResponse.json(newRating);
  } catch (error) {
    console.error("[COURSE_RATINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 