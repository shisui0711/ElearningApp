"use server"
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import React from "react";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

const CoursePage = async ({ params }: CoursePageProps) => {
  const { courseId } = await params;
  let redirectPath: string | null = null
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        department: true,
        lessons: true,
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

    if (!course){
      redirectPath = `/`
    }else if(course.lessons && course.lessons.length > 0){
      redirectPath = `/dashboard/courses/${courseId}/lessons/${course.lessons[0].id}`
    }else{
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">{course.name}</h2>
            <p className="text-muted-foreground">
              Môn học này chưa có bài học nào. Vui lòng quay lại sau.
            </p>
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('Error fetching course:', error);
    redirectPath = `/`
  }finally{
    if (redirectPath)
      redirect(redirectPath)
  }
};

export default CoursePage;
