import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

// API để lấy danh sách bài tập của khóa học
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Kiểm tra quyền truy cập khóa học
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Lấy danh sách bài tập
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId,
        OR: [
          // Trường hợp học sinh đã đăng ký khóa học
          {
            course: {
              enrollments: {
                some: {
                  studentId: user.student?.id,
                },
              },
            },
          },
          // Trường hợp giáo viên của khóa học
          {
            course: {
              teacherId: user.teacher?.id,
            },
          },
          // Trường hợp admin
          ...(user.role === "ADMIN" ? [{}] : []),
        ],
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        submissions: user.student
          ? {
              where: {
                studentId: user.student.id,
              },
            }
          : undefined,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[COURSE_ASSIGNMENTS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// API để tạo bài tập mới cho khóa học
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chỉ giáo viên và admin mới có thể tạo bài tập
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { courseId } = await params;

    // Kiểm tra khóa học có tồn tại và người dùng có quyền
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        ...(user.role === "TEACHER" ? { teacherId: user.teacher?.id } : {}),
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      type,
      classId,
      examId,
      fileType,
      studentIds,
      duration,
      showCorrectAnswers,
    } = body;

    // Kiểm tra dữ liệu đầu vào
    if (!title || !dueDate || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Kiểm tra loại bài tập
    if (type === "EXAM" && !examId) {
      return NextResponse.json(
        { error: "Exam ID is required for exam assignment" },
        { status: 400 }
      );
    }

    if (type === "FILE_UPLOAD" && !fileType) {
      return NextResponse.json(
        { error: "File type is required for file upload assignment" },
        { status: 400 }
      );
    }

    let examAttemptId = null;

    // Chỉ tạo exam attempt khi type là EXAM và có examId
    if (type === "EXAM" && examId) {
      const examAttempt = await prisma.examAttempt.create({
        data: {
          examId,
          courseId,
          classId,
          duration: duration || 60, // Mặc định 60 phút nếu không chỉ định
          showCorrectAfter: showCorrectAnswers || false,
        },
      });

      examAttemptId = examAttempt.id;
    }

    // Tạo bài tập mới
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        type,
        courseId,
        classId: classId || null,
        fileType: type === "FILE_UPLOAD" ? fileType : null,
      },
    });

    // Nếu có danh sách sinh viên cụ thể, tạo các entry trong bảng assignment_submissions
    if (studentIds && studentIds.length > 0) {
      const studentSubmissions = studentIds.map((studentId: string) => ({
        assignmentId: assignment.id,
        studentId,
      }));

      await prisma.assignmentSubmission.createMany({
        data: studentSubmissions,
        skipDuplicates: true,
      });
    } else if (classId) {
      // Nếu giao cho cả lớp, tạo entry cho tất cả sinh viên trong lớp
      const students = await prisma.student.findMany({
        where: { classId },
        select: { id: true },
      });

      if (students.length > 0) {
        const studentSubmissions = students.map((student) => ({
          assignmentId: assignment.id,
          studentId: student.id,
        }));

        await prisma.assignmentSubmission.createMany({
          data: studentSubmissions,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("[COURSE_ASSIGNMENTS_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
