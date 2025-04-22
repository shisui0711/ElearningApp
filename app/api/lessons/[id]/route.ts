import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can delete lessons", { status: 403 });
    }
    
    const {id} = await params;
    
    if (!id) {
      return new NextResponse("Lesson ID is required", { status: 400 });
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
    
    // Verify lesson exists and belongs to a course owned by this teacher
    const lesson = await prisma.lesson.findUnique({
      where: {
        id,
      },
      include: {
        course: true,
      },
    });
    
    if (!lesson) {
      return new NextResponse("Lesson not found", { status: 404 });
    }
    
    // Verify course ownership
    if (lesson.course.teacherId !== teacher.id) {
      return new NextResponse("You don't have permission to delete this lesson", { status: 403 });
    }
    
    // Delete all documents in the lesson first
    await prisma.document.deleteMany({
      where: {
        lessonId: id,
      },
    });
    
    // Delete the lesson
    await prisma.lesson.delete({
      where: {
        id,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LESSON_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 