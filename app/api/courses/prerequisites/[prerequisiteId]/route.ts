import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ prerequisiteId: string }> }
) {
  try {
    const session = await validateRequest();
    
    if (!session?.user || session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized - Only admins and teachers can manage prerequisites" },
        { status: 401 }
      );
    }

    const { prerequisiteId } = await params;
    
    // Check if the prerequisite exists
    const prerequisite = await prisma.coursePrerequisite.findUnique({
      where: { id: prerequisiteId },
    });

    if (!prerequisite) {
      return NextResponse.json(
        { error: "Prerequisite not found" },
        { status: 404 }
      );
    }

    // If user is a teacher, check if they own the course
    if (session.user.role === "TEACHER") {
      const course = await prisma.course.findUnique({
        where: { id: prerequisite.courseId },
        include: { teacher: true },
      });

      const teacher = await prisma.teacher.findFirst({
        where: { userId: session.user.id },
      });

      if (!teacher || !course || course.teacherId !== teacher.id) {
        return NextResponse.json(
          { error: "You can only manage prerequisites for your own courses" },
          { status: 403 }
        );
      }
    }

    // Delete the prerequisite
    await prisma.coursePrerequisite.delete({
      where: { id: prerequisiteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prerequisite:", error);
    return NextResponse.json(
      { error: "Failed to delete prerequisite" },
      { status: 500 }
    );
  }
} 