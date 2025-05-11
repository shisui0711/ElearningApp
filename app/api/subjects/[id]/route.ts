import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { updateSubjectSchema } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { id } = await params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subject) {
      return new NextResponse(JSON.stringify({ error: "Môn học không tồn tại" }), {
        status: 404,
      });
    }

    return NextResponse.json(subject);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    
    const { name, description, departmentId } = updateSubjectSchema.parse({
      id,
      ...body,
    });

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });
    
    if (!existingSubject) {
      return new NextResponse(JSON.stringify({ error: "Môn học không tồn tại" }), {
        status: 404,
      });
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    
    if (!department) {
      return new NextResponse(JSON.stringify({ error: "Khoa không tồn tại" }), {
        status: 404,
      });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        description,
        departmentId,
      },
    });

    return NextResponse.json(updatedSubject);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { id } = await params;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });
    
    if (!existingSubject) {
      return new NextResponse(JSON.stringify({ error: "Môn học không tồn tại" }), {
        status: 404,
      });
    }

    // Check if subject has related courses
    const courseCount = await prisma.course.count({
      where: { subjectId: id },
    });
    
    if (courseCount > 0) {
      return new NextResponse(
        JSON.stringify({ error: "Không thể xóa môn học này vì đã có khóa học liên kết" }), 
        { status: 400 }
      );
    }

    const deletedSubject = await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json(deletedSubject);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
} 