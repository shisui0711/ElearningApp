import { validateRequest } from '@/auth';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import React from 'react'

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{courseId: string;}>
}

const CourseLayout = async ({ children, params}:CourseLayoutProps) => {
  const { user } = await validateRequest();
  const { courseId } = await params;

  if(!user) return redirect("/")

  // TODO: Check course access permission

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
  if(!course) return redirect("/my-course");

  const completedLesson = await prisma.completedLesson.findMany({
    where: {
      studentId: user.student?.id,
    }
  })

  return (
  <div className='h-full'>
      <Sidebar course={course} completedLessons={completedLesson}/>
      <main className='h-full lg:pt-[64px] pl-20 lg:pl-96'>{children}</main>
    </div>
  )
}

export default CourseLayout