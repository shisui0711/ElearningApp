import { validateRequest } from '@/auth';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';

// Server component to fetch data
async function getProfileData(userId: string) {
  // Fetch user data including student and teacher information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      teacher: {
        include: {
          courses: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
            take: 4,
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Get enrolled courses for students
  const enrolledCourses = user.student
    ? await prisma.enrollment.findMany({
        where: { studentId: user.student.id },
        select: {
          course: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
        take: 4,
      })
    : [];

  return { user, enrolledCourses };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { user: currentUser } = await validateRequest();

  // If no ID provided, use the current user's profile
  const userId = (await params).id || currentUser?.id;

  if (!userId) {
    notFound();
  }

  const data = await getProfileData(userId);

  if (!data) {
    notFound();
  }

  const { user, enrolledCourses } = data;
  const isOwnProfile = currentUser?.id === user.id;

  return <ProfileClient user={user} enrolledCourses={enrolledCourses} isOwnProfile={isOwnProfile} />;
}

