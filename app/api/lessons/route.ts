import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can create lessons", { status: 403 });
    }
    
    const body = await req.json();
    const { title, description, courseId, videoUrl } = body;
    
    if (!title || !courseId) {
      return new NextResponse("Title and courseId are required", { status: 400 });
    }
    
    // Find the teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: user.id,
      },
    });
    
    if (!teacher) {
      return new NextResponse("Teacher not found", { status: 404 });
    }
    
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id,
      },
    });
    
    if (!course) {
      return new NextResponse("Course not found or you don't have permission", { status: 404 });
    }
    
    // Get the highest position in the course
    const highestPosition = await prisma.lesson.findFirst({
      where: {
        courseId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });
    
    const position = highestPosition ? highestPosition.position + 1 : 1;
    
    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        videoUrl,
        position,
        courseId,
      },
    });
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[LESSONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can update lessons", { status: 403 });
    }
    
    const body = await req.json();
    const { id, title, description, position, courseId, videoUrl } = body;
    
    if (!id || !title || !courseId) {
      return new NextResponse("ID, title, and courseId are required", { status: 400 });
    }
    
    // Find the teacher
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: user.id,
      },
    });
    
    if (!teacher) {
      return new NextResponse("Teacher not found", { status: 404 });
    }
    
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id,
      },
    });
    
    if (!course) {
      return new NextResponse("Course not found or you don't have permission", { status: 404 });
    }
    
    // Verify lesson exists and belongs to the course
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id,
        courseId,
      },
    });
    
    if (!existingLesson) {
      return new NextResponse("Lesson not found", { status: 404 });
    }
    
    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        videoUrl,
        position: position || existingLesson.position,
      },
    });
    
    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("[LESSONS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 