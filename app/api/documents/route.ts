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
      return new NextResponse("Forbidden - Only teachers can create documents", { status: 403 });
    }
    const body = await req.json();
    const { title, description, url, type, lessonId } = body;
    
    if (!title || !url || !lessonId || !type) {
      return new NextResponse("Title, URL, type, and lessonId are required", { status: 400 });
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
    
    // Verify lesson exists and belongs to the teacher's course
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
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
      return new NextResponse("You don't have permission to add documents to this lesson", { status: 403 });
    }
    
    // Create the document
    const document = await prisma.document.create({
      data: {
        name: title,
        description,
        fileUrl: url,
        type,
        lessonId,
      },
    });
    return NextResponse.json(document);
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error);
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
      return new NextResponse("Forbidden - Only teachers can update documents", { status: 403 });
    }
    
    const body = await req.json();
    const { id, title, description, url, type, lessonId } = body;
    
    if (!id || !title || !url || !type || !lessonId) {
      return new NextResponse("ID, title, URL, type, and lessonId are required", { status: 400 });
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
    const existingDocument = await prisma.document.findUnique({
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
    
    if (!existingDocument) {
      return new NextResponse("Document not found", { status: 404 });
    }
    
    // Verify course ownership
    if (existingDocument.lesson?.course.teacherId !== teacher.id) {
      return new NextResponse("You don't have permission to update this document", { status: 403 });
    }
    
    // If changing lessonId, verify new lesson belongs to the same course
    if (lessonId !== existingDocument.lessonId) {
      const newLesson = await prisma.lesson.findUnique({
        where: {
          id: lessonId,
        },
        include: {
          course: true,
        },
      });
      
      if (!newLesson) {
        return new NextResponse("New lesson not found", { status: 404 });
      }
      
      if (newLesson.course.teacherId !== teacher.id) {
        return new NextResponse("You don't have permission to move the document to this lesson", { status: 403 });
      }
    }
    
    // Update the document
    const updatedDocument = await prisma.document.update({
      where: {
        id,
      },
      data: {
        name: title,
        description,
        fileUrl: url,
        type,
        lessonId,
      },
    });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("[DOCUMENTS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Get documentId from URL
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const documentId = searchParams.get("id");
    
    if (!documentId) {
      return new NextResponse("Document ID is required", { status: 400 });
    }
    
    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can delete documents", { status: 403 });
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
    
    // Verify document exists and belongs to the teacher's course
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
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
      return new NextResponse("You don't have permission to delete this document", { status: 403 });
    }
    
    // Delete the document
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DOCUMENTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 