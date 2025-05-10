import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // Validate pagination parameters
    if (isNaN(pageNumber) || pageNumber < 1 || isNaN(pageSize) || pageSize < 1) {
      return new NextResponse("Invalid pagination parameters", { status: 400 });
    }

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await prisma.course.count({
      where: {
        enrollments: {
          some: {
            studentId: user.student?.id,
          },
        },
      },
    });

    const courses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: {
            studentId: user.student?.id,
          },
        },
      },
      take: pageSize,
      skip: skip,
      orderBy: {
        name: 'asc',
      },
      include: {
        department: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: courses,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      // Verify authentication
      const { user } = await validateRequest();
      if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      
      // Check if user is a teacher
      if (user.role !== "STUDENT") {
        return new NextResponse("Forbidden - Only students can enroll course", { status: 403 });
      }
    
      const body = await req.json();

      const { courseId, studentId } = body;
      console.log(studentId)

      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        return new NextResponse("Course not found", { status: 404 });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        return new NextResponse("Student not found", { status: 404 });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          courseId,
          studentId,
        },
      });
  
      return NextResponse.json(enrollment);
    } catch (error) {
      console.error("[ENROLL_POST]", error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  }