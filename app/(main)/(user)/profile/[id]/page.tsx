import React from 'react';
import { validateRequest } from '@/auth';
import { notFound } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { CalendarDays, Mail, MapPin, Pencil, School, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import prisma from '@/lib/prisma';

export default async function ProfilePage({
  params,
}: {
  params: { id?: string };
}) {
  const { user: currentUser } = await validateRequest();
  
  // If no ID provided, use the current user's profile
  const userId = params.id || currentUser?.id;
  
  if (!userId) {
    notFound();
  }

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
    notFound();
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

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with user info */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex flex-col items-center md:items-start gap-4">
            <UserAvatar avatarUrl={user.avatarUrl} size="lg" />
            <div>
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <p className="text-muted-foreground">{user.username}</p>
            </div>
            
            {isOwnProfile && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings/information" className="flex items-center gap-2">
                  <Pencil size={16} /> 
                  Chỉnh sửa hồ sơ
                </Link>
              </Button>
            )}
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            {user.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            )}
            
            {user.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground" />
                <span>{user.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-muted-foreground" />
              <span>Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="font-medium mb-2">Vai trò</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.role === 'STUDENT' ? 'default' : 'outline'}>Học viên</Badge>
              <Badge variant={user.role === 'TEACHER' ? 'default' : 'outline'}>Giảng viên</Badge>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>Quản trị viên</Badge>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3 space-y-6">
          {/* Bio section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User size={20} /> Giới thiệu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {user.bio || 'Người dùng này chưa cập nhật thông tin giới thiệu.'}
              </p>
            </CardContent>
          </Card>
          
          {/* Courses section */}
          {user.teacher && user.teacher.courses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Khóa học đang dạy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.teacher.courses.map((course) => (
                    <Link key={course.id} href={`/course/${course.id}`}>
                      <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <h3 className="font-medium">{course.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
                {user.teacher.courses.length > 3 && (
                  <Button variant="link" className="mt-4 px-0" asChild>
                    <Link href={`/teacher/${user.teacher.id}/courses`}>Xem tất cả khóa học</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Enrolled courses section for students */}
          {user.student && enrolledCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Khóa học đang học</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledCourses.map(({ course }) => (
                    <Link key={course.id} href={`/course/${course.id}`}>
                      <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
                        <h3 className="font-medium">{course.name}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
                {enrolledCourses.length > 3 && (
                  <Button variant="link" className="mt-4 px-0" asChild>
                    <Link href={`/my-courses`}>Xem tất cả khóa học</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
