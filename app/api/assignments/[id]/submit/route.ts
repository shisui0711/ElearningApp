import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kiểm tra xem người dùng có phải là sinh viên không
    if (user.role !== "STUDENT" || !user.student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: assignmentId } = await params;

    // Kiểm tra bài tập có tồn tại không
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: {
            enrollments: {
              where: {
                studentId: user.student.id,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Kiểm tra sinh viên có đăng ký khóa học không
    if (assignment.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Kiểm tra hạn nộp bài
    if (new Date() > assignment.dueDate) {
      return NextResponse.json(
        { error: "Assignment submission deadline has passed" },
        { status: 400 }
      );
    }

    // Xử lý nộp bài tập theo loại
    if (assignment.type === "FILE_UPLOAD") {
      // Xử lý nộp file
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Kiểm tra định dạng file (nếu assignment.fileType được chỉ định)
      if (assignment.fileType !== "*" && assignment.fileType && !file.type.includes(assignment.fileType)) {
        return NextResponse.json(
          { error: `Invalid file type. Expected: ${assignment.fileType}` },
          { status: 400 }
        );
      }

      // Tải file lên (reuse logic tải file hiện có)
      const fileBuffer = await file.arrayBuffer();
      const fileData = Buffer.from(fileBuffer);
      
      // Tạo tên file duy nhất
      const uniqueId = Date.now().toString();
      const fileName = `${uniqueId}-${file.name.replace(/\s+/g, '_')}`;
      
      // Lưu file vào thư mục public/uploads
      const fs = require('fs');
      const path = require('path');
      
      // Tạo thư mục nếu chưa tồn tại
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assignments');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, fileData);
      
      // Tạo URL cho file
      const fileUrl = `/uploads/assignments/${fileName}`;

      // Tìm hoặc tạo một bản ghi nộp bài
      await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: user.student.id,
          },
        },
        update: {
          fileUrl,
          submittedAt: new Date(),
        },
        create: {
          assignmentId: assignment.id,
          studentId: user.student.id,
          fileUrl,
        },
      });

      return NextResponse.json({ success: true, fileUrl });
    } else if (assignment.type === "EXAM") {
      // Xử lý bài tập trắc nghiệm (liên kết với bảng ExamAttempt)
      const { examAttemptId } = await request.json();

      if (!examAttemptId) {
        return NextResponse.json(
          { error: "Exam attempt ID is required" },
          { status: 400 }
        );
      }

      // Kiểm tra lần thi có tồn tại và thuộc về sinh viên đó không
      const examAttempt = await prisma.examAttempt.findUnique({
        where: {
          id: examAttemptId,
          studentId: user.student.id,
        },
      });

      if (!examAttempt) {
        return NextResponse.json(
          { error: "Invalid exam attempt" },
          { status: 404 }
        );
      }

      // Liên kết lần thi với bài tập
      await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: assignment.id,
            studentId: user.student.id,
          },
        },
        update: {
          examAttemptId,
          submittedAt: new Date(),
        },
        create: {
          assignmentId: assignment.id,
          studentId: user.student.id,
          examAttemptId,
        },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Invalid assignment type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMIT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 