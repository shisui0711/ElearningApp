// Client component for UI rendering with animations
"use client";

import React, { useEffect, useRef } from 'react';
import { CalendarDays, Mail, MapPin, Pencil, User, BookOpen, GraduationCap, UserCog, School } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import UserAvatar from '@/components/UserAvatar';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard, CardContent, CardHeader, CardTitle } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { useAnimation } from '@/provider/AnimationProvider';
import { cn } from '@/lib/utils';

export default function ProfileClient({
  user,
  enrolledCourses,
  isOwnProfile
}: {
  user: any;
  enrolledCourses: any[];
  isOwnProfile: boolean;
}) {
  const { gsap, isReady } = useAnimation();

  // Refs for animations
  const pageRef = useRef<HTMLDivElement>(null);
  const profileHeaderRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const bioCardRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  // Apply animations when component mounts
  useEffect(() => {
    if (!isReady || !pageRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate profile header
    if (profileHeaderRef.current) {
      tl.fromTo(
        profileHeaderRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );
    }

    // Animate sidebar
    if (sidebarRef.current) {
      tl.fromTo(
        sidebarRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    // Animate bio card
    if (bioCardRef.current) {
      tl.fromTo(
        bioCardRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.2"
      );
    }

    // Animate courses section
    if (coursesRef.current) {
      tl.fromTo(
        coursesRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.2"
      );
    }

    return () => {
      // Clean up animations
      tl.kill();
    };
  }, [isReady, gsap]);

  // Custom CSS for better gradient text readability
  const gradientTextStyle = {
    textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
    fontWeight: 'bold'
  };

  return (
    <div ref={pageRef} className="min-h-screen">
      {/* Background with gradient */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/15 to-transparent -z-10" />

      <div className="container py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Sidebar with user info */}
          <div ref={sidebarRef} className="md:col-span-1 space-y-6">
            <div ref={profileHeaderRef} className="flex flex-col items-center md:items-start gap-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[hsl(var(--gradient-1-start))] to-[hsl(var(--gradient-1-end))] opacity-70 blur-sm"></div>
                <UserAvatar avatarUrl={user.avatarUrl} size="lg" className="border-2 border-background" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gradient-1 tracking-tight" style={gradientTextStyle}>{user.displayName}</h1>
                <p className="text-base text-foreground/80 mt-1">{user.username}</p>
              </div>

              {isOwnProfile && (
                <AnimatedButton
                  asChild
                  variant="outline"
                  className="w-full"
                  animationVariant="hover"
                  gradientVariant="gradient1"
                >
                  <Link href="/settings/information" className="flex items-center gap-2">
                    <Pencil size={16} />
                    Chỉnh sửa hồ sơ
                  </Link>
                </AnimatedButton>
              )}
            </div>

            <AnimatedCard
              className="overflow-hidden"
              animationVariant="hover"
              glassMorphism
            >
              <CardContent className="p-5 space-y-4">
                {user.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex-center size-9 rounded-full bg-primary/10">
                      <Mail size={16} className="text-primary" />
                    </div>
                    <span className="text-base font-medium">{user.email}</span>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-center gap-3">
                    <div className="flex-center size-9 rounded-full bg-primary/10">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <span className="text-base font-medium">{user.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-center size-9 rounded-full bg-primary/10">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <span className="text-base">Tham gia từ <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></span>
                </div>
              </CardContent>
            </AnimatedCard>

            <AnimatedCard
              className="overflow-hidden"
              animationVariant="hover"
              gradientBorder
            >
              <CardHeader className='bg-card'>
                <CardTitle className="text-xl flex items-center gap-3 font-bold">
                  <div className="flex-center size-10 rounded-full bg-primary/10">
                    <User size={20} className="text-primary" />
                  </div>
                  <span className="text-gradient-1 tracking-tight" style={gradientTextStyle}>Vai trò</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-card">
                <div className="flex flex-col gap-4">
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                    user.role === 'STUDENT'
                      ? "bg-gradient-to-r from-[hsl(var(--gradient-1-start))/0.15] to-[hsl(var(--gradient-1-end))/0.05] border-l-4 border-[hsl(var(--gradient-1-start))]"
                      : "hover:bg-accent"
                  )}>
                    <div className={cn(
                      "flex-center size-10 rounded-full",
                      user.role === 'STUDENT' ? "bg-gradient-1" : "bg-muted"
                    )}>
                      <GraduationCap size={20} className={user.role === 'STUDENT' ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-base",
                        user.role === 'STUDENT' && "text-gradient-1"
                      )}>Học viên</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.role === 'STUDENT' ? 'Vai trò hiện tại' : 'Không có quyền'}
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                    user.role === 'TEACHER'
                      ? "bg-gradient-to-r from-[hsl(var(--gradient-2-start))/0.15] to-[hsl(var(--gradient-2-end))/0.05] border-l-4 border-[hsl(var(--gradient-2-start))]"
                      : "hover:bg-accent"
                  )}>
                    <div className={cn(
                      "flex-center size-10 rounded-full",
                      user.role === 'TEACHER' ? "bg-gradient-2" : "bg-muted"
                    )}>
                      <School size={20} className={user.role === 'TEACHER' ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-base",
                        user.role === 'TEACHER' && "text-gradient-2"
                      )}>Giảng viên</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.role === 'TEACHER' ? 'Vai trò hiện tại' : 'Không có quyền'}
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                    user.role === 'ADMIN'
                      ? "bg-gradient-to-r from-[hsl(var(--gradient-3-start))/0.15] to-[hsl(var(--gradient-3-end))/0.05] border-l-4 border-[hsl(var(--gradient-3-start))]"
                      : "hover:bg-accent"
                  )}>
                    <div className={cn(
                      "flex-center size-10 rounded-full",
                      user.role === 'ADMIN' ? "bg-gradient-3" : "bg-muted"
                    )}>
                      <UserCog size={20} className={user.role === 'ADMIN' ? "text-white" : "text-muted-foreground"} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-semibold text-base",
                        user.role === 'ADMIN' && "text-gradient-3"
                      )}>Quản trị viên</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.role === 'ADMIN' ? 'Vai trò hiện tại' : 'Không có quyền'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Main content */}
          <div className="md:col-span-3 space-y-8">
            {/* Bio section */}
            <AnimatedCard
              ref={bioCardRef}
              className="overflow-hidden"
              animationVariant="hover"
              gradientBorder
            >
              <CardHeader className='bg-card'>
                <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                  <div className="flex-center size-10 rounded-full bg-primary/10">
                    <User size={20} className="text-primary" />
                  </div>
                  <span className="text-gradient-1 tracking-tight" style={gradientTextStyle}>Giới thiệu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-card">
                <p className="text-base text-foreground/80 leading-relaxed">
                  {user.bio || 'Người dùng này chưa cập nhật thông tin giới thiệu.'}
                </p>
              </CardContent>
            </AnimatedCard>

            {/* Courses section */}
            <div ref={coursesRef}>
              {user.teacher && user.teacher.courses.length > 0 && (
                <AnimatedCard
                  className="overflow-hidden"
                  animationVariant="hover"
                  gradientBorder
                >
                  <CardHeader className='bg-card'>
                    <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                      <div className="flex-center size-10 rounded-full bg-primary/10">
                        <BookOpen size={20} className="text-primary" />
                      </div>
                      <span className="text-gradient-1 tracking-tight" style={gradientTextStyle}>Khóa học đang dạy</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {user.teacher.courses.map((course: any) => (
                        <Link key={course.id} href={`/course/${course.id}`} className="group">
                          <div className="relative h-24 rounded-lg overflow-hidden border border-border group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-md">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative h-full w-full p-4 flex items-center">
                              <div className="relative size-12 mr-3 rounded-md overflow-hidden flex-shrink-0 border border-border">
                                <Image
                                  src={course.imageUrl || "/images/course-placeholder.png"}
                                  alt={course.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <h3 className="text-base font-semibold group-hover:text-primary transition-colors duration-300 line-clamp-2">{course.name}</h3>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {user.teacher.courses.length > 3 && (
                      <AnimatedButton
                        variant="link"
                        className="mt-4 px-0"
                        asChild
                        animationVariant="hover"
                      >
                        <Link href={`/teacher/${user.teacher.id}/courses`} className="text-gradient-1 text-base font-medium" style={gradientTextStyle}>
                          Xem tất cả khóa học
                        </Link>
                      </AnimatedButton>
                    )}
                  </CardContent>
                </AnimatedCard>
              )}

              {/* Enrolled courses section for students */}
              {user.student && enrolledCourses.length > 0 && (
                <AnimatedCard
                  className="overflow-hidden mt-6"
                  animationVariant="hover"
                  gradientBorder
                >
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                      <div className="flex-center size-10 rounded-full bg-primary/10">
                        <BookOpen size={20} className="text-primary" />
                      </div>
                      <span className="text-gradient-1 tracking-tight" style={gradientTextStyle}>Khóa học đang học</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {enrolledCourses.map(({ course }) => (
                        <Link key={course.id} href={`/course/${course.id}`} className="group">
                          <div className="relative h-24 rounded-lg overflow-hidden border border-border group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-md">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative h-full w-full p-4 flex items-center">
                              <div className="relative size-12 mr-3 rounded-md overflow-hidden flex-shrink-0 border border-border">
                                <Image
                                  src={course.imageUrl || "/images/course-placeholder.png"}
                                  alt={course.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <h3 className="text-base font-semibold group-hover:text-primary transition-colors duration-300 line-clamp-2">{course.name}</h3>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {enrolledCourses.length > 3 && (
                      <AnimatedButton
                        variant="link"
                        className="mt-4 px-0"
                        asChild
                        animationVariant="hover"
                      >
                        <Link href={`/my-courses`} className="text-gradient-1 text-base font-medium" style={gradientTextStyle}>
                          Xem tất cả khóa học
                        </Link>
                      </AnimatedButton>
                    )}
                  </CardContent>
                </AnimatedCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
