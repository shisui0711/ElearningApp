import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import { PrerequisiteService } from "@/app/services/prerequisiteService";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await validateRequest();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the student associated with this user
    const student = await prisma.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const { courseId } = await params;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { prerequisites: { include: { subject: true } } },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Validate prerequisites
    const validation = await PrerequisiteService.validatePrerequisites(
      student.id,
      courseId
    );

    return NextResponse.json(validation);
  } catch (error) {
    console.error("Error checking prerequisites:", error);
    return NextResponse.json(
      { error: "Failed to check prerequisites" },
      { status: 500 }
    );
  }
}

// API to get all prerequisites for a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await validateRequest();
    
    if (!session?.user || session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized - Only admins and teachers can manage prerequisites" },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Get request body
    const body = await req.json();
    const { subjectId, description } = body;

    if (!subjectId) {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      );
    }

    // Check if the subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if this prerequisite already exists
    const existingPrereq = await prisma.coursePrerequisite.findFirst({
      where: {
        courseId,
        subjectId,
      },
    });

    if (existingPrereq) {
      return NextResponse.json(
        { error: "This subject is already a prerequisite for this course" },
        { status: 400 }
      );
    }

    // Create the prerequisite
    const prerequisite = await prisma.coursePrerequisite.create({
      data: {
        courseId,
        subjectId,
        description,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(prerequisite);
  } catch (error) {
    console.error("Error adding prerequisite:", error);
    return NextResponse.json(
      { error: "Failed to add prerequisite" },
      { status: 500 }
    );
  }
} 