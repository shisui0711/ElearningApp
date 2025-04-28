import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - courseId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Lesson title
 *               description:
 *                 type: string
 *                 description: Lesson description
 *               videoUrl:
 *                 type: string
 *                 description: URL to the lesson video
 *               courseId:
 *                 type: string
 *                 description: ID of the course this lesson belongs to
 *     responses:
 *       200:
 *         description: Lesson created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Title and courseId are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only teachers can create lessons
 *       404:
 *         description: Teacher not found or Course not found
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
      return new NextResponse("Forbidden - Only teachers can create lessons", { status: 403 });
    }
    
    const body = await req.json();
    const { title, description, courseId, videoUrl } = body;
    
    if (!title || !courseId) {
      return new NextResponse("Title and courseId are required", { status: 400 });
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
    
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id,
      },
    });
    
    if (!course) {
      return new NextResponse("Course not found or you don't have permission", { status: 404 });
    }
    
    // Get the highest position in the course
    const highestPosition = await prisma.lesson.findFirst({
      where: {
        courseId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });
    
    const position = highestPosition ? highestPosition.position + 1 : 1;
    
    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        videoUrl,
        position,
        courseId,
      },
    });
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[LESSONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * @swagger
 * /api/lessons:
 *   put:
 *     summary: Update a lesson
 *     tags: [Lessons]
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
 *               - title
 *               - courseId
 *             properties:
 *               id:
 *                 type: string
 *                 description: Lesson ID
 *               title:
 *                 type: string
 *                 description: Lesson title
 *               description:
 *                 type: string
 *                 description: Lesson description
 *               videoUrl:
 *                 type: string
 *                 description: URL to the lesson video
 *               position:
 *                 type: integer
 *                 description: Position of the lesson in the course
 *               courseId:
 *                 type: string
 *                 description: ID of the course this lesson belongs to
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: ID, title, and courseId are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only teachers can update lessons
 *       404:
 *         description: Teacher, course, or lesson not found
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
    
    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Only teachers can update lessons", { status: 403 });
    }
    
    const body = await req.json();
    const { id, title, description, position, courseId, videoUrl } = body;
    
    if (!id || !title || !courseId) {
      return new NextResponse("ID, title, and courseId are required", { status: 400 });
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
    
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id,
      },
    });
    
    if (!course) {
      return new NextResponse("Course not found or you don't have permission", { status: 404 });
    }
    
    // Verify lesson exists and belongs to the course
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        id,
        courseId,
      },
    });
    
    if (!existingLesson) {
      return new NextResponse("Lesson not found", { status: 404 });
    }
    
    // Update the lesson
    const updatedLesson = await prisma.lesson.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        videoUrl,
        position: position || existingLesson.position,
      },
    });
    
    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error("[LESSONS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 