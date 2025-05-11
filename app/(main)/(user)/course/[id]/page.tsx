"use server";

import EnrollButton from "@/components/EnrollButton";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CalendarIcon,
  FileText,
  Plus,
  Award,
  Eye,
  FileCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { notFound } from "next/navigation";
import { CourseWithDetails } from "@/types";
import UserAvatar from "@/components/UserAvatar";
import CourseCommentList from "@/components/CourseCommentList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import DoExamButton from "@/components/DoExamButton";
import PrerequisitesList from "@/components/courses/PrerequisitesList";
import CourseRatingWrapper from "@/components/CourseRatingWrapper";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

const CoursePage = async ({ params }: CoursePageProps) => {
  const { id } = await params;
  const { user } = await validateRequest();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold">
          Bạn cần đăng nhập để xem nội dung
        </h1>
      </div>
    );
  }

  // Fetch the course data using the slug
  const course = (await prisma.course.findUnique({
    where: { id },
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
      lessons: {
        orderBy: {
          position: "asc",
        },
        include: {
          documents: true,
        },
      },
      // Lấy thông tin bài tập
      assignments: {
        orderBy: {
          dueDate: "asc",
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              submissions: true,
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
      },
    },
  })) as CourseWithDetails | null;

  const examAttempts = await prisma.examAttempt.findMany({
    where: {
      OR: [
        {
          studentId: user.student?.id,
        },
        {
          classId: user.student?.classId ?? undefined,
          studentId: user.student?.id,
        },
      ],
      courseId: course?.id,
    },
  });

  if (!course) {
    return notFound();
  }

  // Kiểm tra người dùng đã đăng ký khóa học chưa
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      courseId: course.id,
      studentId: user.student?.id,
    },
  });

  const isEnrolled = !!enrollment;
  const isTeacher = course.teacherId === user.teacher?.id;
  const isAdmin = user.role === "ADMIN";
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[60vh] w-full">
        <Image
          src={course.imageUrl ?? ""}
          alt={course.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-black/60" />
        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-12">
          <Link
            href="/"
            prefetch={false}
            className="text-white mb-8 flex items-center hover:text-primary transition-colors w-fit"
          >
            <ArrowLeft className="mr-2 size-5" />
            Quay lại
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                  {course.department?.name || "Danh mục"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.name}
              </h1>
              <p className="text-lg text-white/90 max-w-2xl">
                {course.description}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 md:min-w-[300px]">
              <EnrollButton course={course} isEnrolled={isEnrolled} />
            </div>
          </div>
        </div>
      </div>
      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {/* Prerequisites Check */}
            {user.student && <div className="mb-8">
              <PrerequisitesList courseId={course.id} />
            </div>}
            
            {/* Course Rating Section */}
            {isEnrolled && user.student && (
              <CourseRatingWrapper courseId={course.id} />
            )}
            
            {/* Hiển thị danh sách bài tập */}
            {user.student && (<Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bài tập</CardTitle>
                  <CardDescription>
                    Danh sách bài tập của khóa học
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                {course.assignments.length === 0 &&
                examAttempts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Khóa học chưa có bài tập nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examAttempts.map((examAttempt) => {
                      return (
                        <div
                          key={examAttempt.id}
                          className="border rounded-lg p-4 transition-colors hover:border-primary"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-lg mb-1">
                                {examAttempt.name}
                              </h3>
                              <div className="flex flex-wrap gap-3 mb-3">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Badge
                                    variant="outline"
                                    className={`bg-purple-100 text-purple-800`}
                                  >
                                    Trắc nghiệm
                                  </Badge>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                  <span>
                                    Hạn nộp:{" "}
                                    {format(
                                      examAttempt.expirateAt!,
                                      "dd/MM/yyyy HH:mm",
                                      {
                                        locale: vi,
                                      }
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  <span>
                                    {isPast(examAttempt.expirateAt!)
                                      ? `Đã hết hạn ${formatDistanceToNow(
                                          examAttempt.expirateAt!,
                                          { addSuffix: true, locale: vi }
                                        )}`
                                      : `Còn ${formatDistanceToNow(
                                          examAttempt.expirateAt!,
                                          {
                                            locale: vi,
                                          }
                                        )}`}
                                  </span>
                                </div>

                                {examAttempt.finishedAt !== null && (
                                  <div className="flex items-center text-xs font-medium">
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-700"
                                    >
                                      {examAttempt.score} điểm //TODO: Điểm số
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="ml-4 flex-shrink-0">
                              <DoExamButton examAttempt={examAttempt} />

                              {(isTeacher || isAdmin) && (
                                <Link
                                  href={`/manage-courses/${course.id}`}
                                  passHref
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-2"
                                  >
                                    Quản lý
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {course.assignments.map((assignment) => {
                      const dueDate = new Date(assignment.dueDate);
                      const hasSubmission =
                        assignment.submissions &&
                        assignment.submissions.some((x) => x.fileUrl);
                      const submission = hasSubmission
                        ? assignment.submissions[0]
                        : null;
                      const isGraded = submission && submission.grade !== null;

                      // Xác định trạng thái bài tập
                      let status = {
                        status: "pending",
                        label: "Chưa nộp",
                        color: "bg-yellow-100 text-yellow-800",
                      };

                      if (hasSubmission) {
                        if (isGraded) {
                          status = {
                            status: "graded",
                            label: "Đã chấm điểm",
                            color: "bg-green-100 text-green-800",
                          };
                        } else {
                          status = {
                            status: "submitted",
                            label: "Đã nộp",
                            color: "bg-blue-100 text-blue-800",
                          };
                        }
                      } else if (isPast(dueDate)) {
                        status = {
                          status: "late",
                          label: "Đã hết hạn",
                          color: "bg-red-100 text-red-800",
                        };
                      }

                      return (
                        <div
                          key={assignment.id}
                          className="border rounded-lg p-4 transition-colors hover:border-primary"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-lg mb-1">
                                {assignment.title}
                              </h3>
                              {assignment.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {assignment.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 mb-3">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Badge
                                    variant="outline"
                                    className={"bg-cyan-100 text-cyan-800"}
                                  >
                                    Nộp file
                                  </Badge>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                  <span>
                                    Hạn nộp:{" "}
                                    {format(dueDate, "dd/MM/yyyy HH:mm", {
                                      locale: vi,
                                    })}
                                  </span>
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  <span>
                                    {isPast(dueDate)
                                      ? `Đã hết hạn ${formatDistanceToNow(
                                          dueDate,
                                          { addSuffix: true, locale: vi }
                                        )}`
                                      : `Còn ${formatDistanceToNow(dueDate, {
                                          locale: vi,
                                        })}`}
                                  </span>
                                </div>

                                {isEnrolled && (
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                )}

                                {submission && submission.grade !== null && (
                                  <div className="flex items-center text-xs font-medium">
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-700"
                                    >
                                      {submission.grade} điểm
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="ml-4 flex-shrink-0">
                              {isEnrolled && (
                                <Link
                                  href={`/assignment/${assignment.id}`}
                                  passHref
                                >
                                  <Button
                                    size="sm"
                                    variant={
                                      status.status === "submitted" ||
                                      status.status === "graded"
                                        ? "outline"
                                        : "default"
                                    }
                                  >
                                    {status.status === "submitted" ||
                                    status.status === "graded"
                                      ? "Xem bài nộp"
                                      : "Nộp bài"}
                                  </Button>
                                </Link>
                              )}

                              {(isTeacher || isAdmin) && (
                                <Link
                                  href={`/manage-courses/${course.id}/assignments/${assignment.id}`}
                                  passHref
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-2"
                                  >
                                    Quản lý
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              </Card>
              )}

            {/* Nội dung khóa học */}
            <div className="bg-card rounded-lg p-6 mb-8 border border-border">
              <h2 className="text-2xl font-bold mb-4">Nội dung môn học</h2>
              <div className="space-y-4">
                {course.lessons.length > 0 ? (
                  course.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="border border-border rounded-lg"
                    >
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">
                          Buổi {lessonIndex + 1}: {lesson.title}
                        </h3>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">
                    Chưa có bài học nào
                  </div>
                )}
              </div>
            </div>

            {/* Course Comments */}
            <CourseCommentList
              courseId={course.id}
              isEnrolled={isEnrolled}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
            />
          </div>
          {/* Sidebar */}
          <div>
            <div className="bg-card rounded-lg p-6 sticky top-4 border border-border">
              <h2 className="text-xl font-bold mb-4">Tác giả</h2>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative size-12">
                    <UserAvatar avatarUrl={course.teacher.user.avatarUrl} />
                  </div>
                  <div>
                    <div className="font-medium">
                      {course.teacher.user.displayName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {course.teacher.degree || "Giảng viên"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
