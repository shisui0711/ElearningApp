import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCourseSchema, updateCourseSchema } from "@/lib/validation";
import { validateRequest } from "@/auth";

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with pagination
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter courses by name
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter courses by department ID
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter courses by teacher ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Course ID
 *                       name:
 *                         type: string
 *                         description: Course name
 *                       description:
 *                         type: string
 *                         description: Course description
 *                       imageUrl:
 *                         type: string
 *                         description: Course image URL
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     pageNumber:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const name = url.searchParams.get("name") || "";
    const departmentId = url.searchParams.get("departmentId") || "";
    const teacherId = url.searchParams.get("teacherId") || "";

    // Validate pagination parameters
    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(pageSize) ||
      pageSize < 1
    ) {
      return new NextResponse("Invalid pagination parameters", { status: 400 });
    }

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await prisma.course.count();

    const courses = await prisma.course.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
        ...(departmentId && { departmentId }),
        ...(teacherId && { teacherId }),
      },
      take: pageSize,
      skip: skip,
      orderBy: {
        name: "asc",
      },
      include: {
        department: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: courses,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - departmentId
 *               - teacherId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Course name
 *               description:
 *                 type: string
 *                 description: Course description
 *               imageUrl:
 *                 type: string
 *                 description: Course image URL
 *               departmentId:
 *                 type: string
 *                 description: Department ID
 *               teacherId:
 *                 type: string
 *                 description: Teacher ID
 *     responses:
 *       200:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Course ID
 *                 name:
 *                   type: string
 *                   description: Course name
 *                 description:
 *                   type: string
 *                   description: Course description
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only teachers can create courses
 *       404:
 *         description: Teacher or department not found
 *       500:
 *         description: Internal Server Error
 */
export async function POST(req: Request) {
  try {
    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can create courses", {
        status: 403,
      });
    }

    const body = await req.json();

    const { name, description, imageUrl, departmentId, teacherId } = body;

    // Validate input
    const validatedFields = createCourseSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse("Dữ liệu không hợp lệ", { status: 400 });
    }

    // Verify that teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return new NextResponse("Giáo viên không tồn tại", { status: 404 });
    }

    // Verify that the authenticated user is the teacher
    if (teacher.user.id !== user.id) {
      return new NextResponse(
        "Forbidden - You can only create courses as yourself",
        { status: 403 }
      );
    }

    // Verify that department exists
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

    if (!department) {
      return new NextResponse("Danh mục không tồn tại", { status: 404 });
    }

    // Create new course
    const course = await prisma.course.create({
      data: {
        name,
        description,
        imageUrl,
        departmentId,
        teacherId,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("[COURSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * @swagger
 * /api/courses:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Course ID
 *               name:
 *                 type: string
 *                 description: Course name
 *               description:
 *                 type: string
 *                 description: Course description
 *               imageUrl:
 *                 type: string
 *                 description: Course image URL
 *               departmentId:
 *                 type: string
 *                 description: Department ID
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the teacher who created the course or an admin can update it
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal Server Error
 */
export async function PUT(req: Request) {
  try {
    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, imageUrl, departmentId } = body;

    if (!id) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Validate input
    const validatedFields = updateCourseSchema.safeParse(body);
    if (!validatedFields.success) {
      return new NextResponse("Dữ liệu không hợp lệ", { status: 400 });
    }

    // Get the course to verify permissions
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return new NextResponse("Khóa học không tồn tại", { status: 404 });
    }

    // Check if user is an admin or the teacher who created the course
    const isAdmin = user.role === "ADMIN";
    const isTeacherOwner =
      user.role === "TEACHER" && existingCourse.teacher.user.id === user.id;

    if (!isAdmin && !isTeacherOwner) {
      return new NextResponse(
        "Forbidden - Only admin or the teacher who created this course can update it",
        { status: 403 }
      );
    }

    // Verify that department exists if changing it
    if (departmentId && departmentId !== existingCourse.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return new NextResponse("Danh mục không tồn tại", { status: 404 });
      }
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        departmentId,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("[COURSES_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * @swagger
 * /api/courses:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to delete
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Course ID is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the teacher who created the course or an admin can delete it
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(req: Request) {
  try {
    // Get courseId from URL
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const courseId = searchParams.get("id");

    if (!courseId) {
      return new NextResponse("Course ID is required", { status: 400 });
    }

    // Verify authentication
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the course to verify permissions
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return new NextResponse("Khóa học không tồn tại", { status: 404 });
    }

    // Check if user is an admin or the teacher who created the course
    const isAdmin = user.role === "ADMIN";
    const isTeacherOwner =
      user.role === "TEACHER" && existingCourse.teacher.user.id === user.id;

    if (!isAdmin && !isTeacherOwner) {
      return new NextResponse(
        "Forbidden - Only admin or the teacher who created this course can delete it",
        { status: 403 }
      );
    }

    // Delete the course
    await prisma.course.delete({
      where: { id: courseId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COURSES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
