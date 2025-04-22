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
      return new NextResponse(
        "Forbidden - Only teachers can delete documents",
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return new NextResponse("Document ID is required", { status: 400 });
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

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: {
        id,
      },
      include: {
        lesson: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Verify course ownership
    if (document.lesson?.course.teacherId !== teacher.id) {
      return new NextResponse(
        "You don't have permission to delete this document",
        { status: 403 }
      );
    }

    // Delete the document
    await prisma.document.delete({
      where: {
        id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
