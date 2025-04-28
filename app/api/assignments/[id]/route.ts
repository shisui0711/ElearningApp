import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Get detailed information about an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assignment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - You don't have permission to access this assignment
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal Server Error
 */
// API để lấy thông tin chi tiết bài tập
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Lấy thông tin chi tiết bài tập và các bài nộp
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            teacherId: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập
    if (user.role === "TEACHER" && assignment.course.teacherId !== user.teacher?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("[ASSIGNMENT_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Assignment title
 *               description:
 *                 type: string
 *                 description: Assignment description
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Assignment due date
 *               type:
 *                 type: string
 *                 enum: [FILE, TEXT, MULTIPLE_CHOICE]
 *                 description: Assignment type
 *               classId:
 *                 type: string
 *                 description: Class ID if assignment is for a specific class
 *               examId:
 *                 type: string
 *                 description: Exam ID if assignment is related to an exam
 *               fileType:
 *                 type: string
 *                 description: Allowed file type for submissions
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of student IDs who are assigned this assignment
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assignment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only teachers who created the assignment or admins can update it
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal Server Error
 */
// API để cập nhật thông tin bài tập
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chỉ giáo viên và admin mới có thể cập nhật bài tập
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Lấy thông tin hiện tại của bài tập
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền sửa bài tập
    if (
      user.role === "TEACHER" &&
      existingAssignment.course.teacherId !== user.teacher?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    } = body;

    // Cập nhật thông tin bài tập
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        type,
        classId: classId || null,
        fileType: fileType || null,
      },
    });

    // Nếu thay đổi danh sách sinh viên được giao, cập nhật lại danh sách submissions
    if (studentIds) {
      // Xóa tất cả các submission hiện tại không có fileUrl (chưa nộp bài)
      await prisma.assignmentSubmission.deleteMany({
        where: {
          assignmentId: id,
          fileUrl: null,
          grade: null,
        },
      });

      // Thêm mới các submission cho sinh viên được chọn
      if (studentIds.length > 0) {
        const studentSubmissions = studentIds.map((studentId: string) => ({
          assignmentId: id,
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
            assignmentId: id,
            studentId: student.id,
          }));

          await prisma.assignmentSubmission.createMany({
            data: studentSubmissions,
            skipDuplicates: true,
          });
        }
      }
    }

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("[ASSIGNMENT_PUT]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID to delete
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Assignment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only teachers who created the assignment or admins can delete it
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal Server Error
 */
// API để xóa bài tập
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Chỉ giáo viên và admin mới có thể xóa bài tập
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Lấy thông tin hiện tại của bài tập
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Kiểm tra quyền xóa bài tập
    if (
      user.role === "TEACHER" &&
      existingAssignment.course.teacherId !== user.teacher?.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Xóa tất cả submissions của bài tập trước
    await prisma.assignmentSubmission.deleteMany({
      where: { assignmentId: id },
    });

    // Xóa bài tập
    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ASSIGNMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 