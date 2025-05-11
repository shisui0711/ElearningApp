import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const url = new URL(req.url);
    const lessonId = url.searchParams.get("lessonId");
    const studentId = url.searchParams.get("studentId");

    if (!lessonId || !studentId)
      return new NextResponse("Invalid pagination parameters", { status: 400 });

    const exist = await prisma.completedLesson.findFirst({
      where: {
        lessonId: lessonId,
        studentId: studentId,
      },
    });
    return NextResponse.json(exist !== null);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await req.json();
    const { studentId, lessonId } = body;
    if (!studentId || !lessonId) {
      return new NextResponse("studentId and lessonId are required", {
        status: 400,
      });
    }
    const student = await prisma.student.findUnique({where:{id:studentId}});
    if(!student){
      return new NextResponse("Student not found", { status: 404 });
    }
    const lesson = await prisma.lesson.findUnique({where:{id:lessonId}});
    if(!lesson){
      return new NextResponse("Lesson not found", { status: 404 });
    }

    const checkLessonCompleted = await prisma.completedLesson.findFirst({
      where: {
        lessonId: lessonId,
        studentId: studentId,
      },
    });
    
    if(checkLessonCompleted){
      return new NextResponse("Lesson already completed", { status: 400 });
    }

    const completedLesson = await prisma.completedLesson.create({
      data: {
        studentId: studentId,
        lessonId: lessonId,
        courseId: lesson.courseId,
      }
    });

    return NextResponse.json(completedLesson)
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
