import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.student) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id: assignmentId } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return new NextResponse(JSON.stringify({ error: "Assignment not found" }), {
        status: 404,
      });
    }

    // Handle different submission types based on content type
    const contentType = request.headers.get("Content-Type") || "";

    // If the request is a JSON payload
    if (contentType.includes("application/json")) {

      // Check if student has an existing submission
      const existingSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: user.student.id,
          },
        },
      });

      if (existingSubmission) {
        // Update existing submission
        const updatedSubmission = await prisma.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            submittedAt: new Date(),
          },
        });
        return NextResponse.json(updatedSubmission);
      } else {
        // Create new submission
        const submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: user.student.id,
          },
        });
        return NextResponse.json(submission);
      }
    }
    // If the request is a file upload
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new NextResponse(JSON.stringify({ error: "No file uploaded" }), {
          status: 400,
        });
      }

      // File validation could go here...

      // Upload file logic here...
      // This would typically upload to a storage solution like S3, Cloudinary, etc.
      // For this example, we'll assume a fileUrl is generated

      const fileUrl = `https://storage.example.com/${Date.now()}_${file.name}`;

      // Check if student has an existing submission
      const existingSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: user.student.id,
          },
        },
      });

      if (existingSubmission) {
        // Update existing submission
        const updatedSubmission = await prisma.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            fileUrl,
            submittedAt: new Date(),
          },
        });
        return NextResponse.json(updatedSubmission);
      } else {
        // Create new submission
        const submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: user.student.id,
            fileUrl,
          },
        });
        return NextResponse.json(submission);
      }
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Unsupported content type" }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMIT_POST]", error);
    return new NextResponse(
      JSON.stringify({ error: "Error submitting assignment" }),
      { status: 500 }
    );
  }
}
