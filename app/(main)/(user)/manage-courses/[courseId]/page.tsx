import React from "react";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Library, PenLine, FileText, Plus, Filter, Hash, GraduationCap } from "lucide-react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { CreateDocumentDialog } from "./CreateDocumentDialog";
import { CreateLessonDialog } from "./CreateLessonDialog";
import EditCourseDialog from "../EditCourseDialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import AssignExamButton from "./AssignExamButton";
import CreateFileAssignmentDialog from "./CreateFileAssignmentDialog";
import { ClassFilterSelect } from "./ClassFilterSelect";
import { PrerequisiteDialog } from "./PrerequisiteDialog";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    fileClassFilter?: string;
    examClassFilter?: string;
    gradeClassFilter?: string;
  }>;
}

async function getCourseDetails(courseId: string, userId: string) {
  try {
    // First, find the teacher record
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!teacher) {
      return null;
    }

    // Get the course details
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: teacher.id, // Only allow access to the teacher's own courses
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
        lessons: {
          orderBy: {
            position: "asc",
          },
          include: {
            documents: true,
          },
        },
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
            submissions: {
              select: {
                id: true,
                grade: true,
                studentId: true,
                submittedAt: true,
                student: {
                  include: {
                    user: {
                      select: {
                        displayName: true,
                      }
                    },
                    class: true
                  }
                }
              },
            },
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
        prerequisites: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            assignments: true,
            prerequisites: true,
          },
        },
      },
    });

    return course;
  } catch (error) {
    console.error("Error fetching course details:", error);
    return null;
  }
}

export default async function ManageCourseDetail({ params, searchParams }: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "TEACHER") {
    redirect("/");
  }

  const { courseId } = await params;
  const data = await searchParams;

  const course = await getCourseDetails(courseId, user.id);

  if (!course) {
    notFound();
  }

  const examAttempts = await prisma.examAttempt.findMany({
    where: {
      courseId: courseId,
    },
    include: {
      class: true,
      student: {
        include: {
          user: {
            select: {
              displayName: true
            }
          },
          class: true
        }
      },
    },
  });

  // Nhóm các bài kiểm tra theo lớp học và tên
  interface GroupedExam {
    id: string;
    name: string | null;
    class: { id: string; name: string };
    expirateAt: Date | null;
    notStarted: number;
    inProgress: number;
    completed: number;
    total: number;
  }

  // Tạo map để lưu trữ các bài kiểm tra đã được gom nhóm
  const groupedExamsMap = new Map<string, GroupedExam>();

  // Duyệt qua tất cả các lần thi và gom nhóm theo lớp và tên bài kiểm tra
  for (const attempt of examAttempts) {
    if (!attempt.class) continue;

    const key = `${attempt.classId}-${attempt.name || ""}`;

    if (!groupedExamsMap.has(key)) {
      groupedExamsMap.set(key, {
        id: key,
        name: attempt.name,
        class: attempt.class,
        expirateAt: attempt.expirateAt,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
      });
    }

    const examGroup = groupedExamsMap.get(key)!;

    // Cập nhật thông kê trạng thái
    examGroup.total++;
    if (attempt.finishedAt) {
      examGroup.completed++;
    } else if (attempt.startedAt) {
      examGroup.inProgress++;
    } else {
      examGroup.notStarted++;
    }
  }

  // Chuyển từ Map sang mảng để hiển thị
  const examsDisplay = Array.from(groupedExamsMap.values());

  // Lấy danh sách các lớp học cho chức năng tạo bài tập và lọc
  const classes = await prisma.class.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Lấy danh sách sinh viên đã đăng ký khóa học
  const enrolledStudents = await prisma.student.findMany({
    where: {
      enrollments: {
        some: {
          courseId: course.id,
        },
      },
    },
    include: {
      enrollments: true,
      class: true,
      user: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      user: {
        displayName: "asc",
      },
    },
  });

  // For each class in the course, get count of students
  const classStudentCounts = await prisma.class.findMany({
    where: {
      id: {
        in: classes.map(c => c.id)
      }
    },
    select: {
      id: true,
      _count: {
        select: {
          students: true
        }
      }
    }
  });

  // Create a map for quick lookups
  const classStudentCountMap = Object.fromEntries(
    classStudentCounts.map(c => [c.id, c._count.students])
  );

  // Filter assignments by class if a filter is selected
  const filteredFileAssignments = data.fileClassFilter 
    ? course.assignments.filter(a => a.type === "FILE_UPLOAD" && a.classId === data.fileClassFilter)
    : course.assignments.filter(a => a.type === "FILE_UPLOAD");

  // Filter exams by class if a filter is selected
  const filteredExamsDisplay = data.examClassFilter
    ? examsDisplay.filter(exam => exam.class.id === data.examClassFilter)
    : examsDisplay;

  // Process assignment statistics similar to exams
  const processedFileAssignments = filteredFileAssignments.map(assignment => {
    // Calculate submission statistics
    let totalStudents = 0;
    
    if (assignment.classId) {
      // If assignment is for a specific class, get the count from our map
      totalStudents = classStudentCountMap[assignment.classId] || 0;
    } else {
      // If assignment is not class-specific, count all enrolled students
      totalStudents = enrolledStudents.length;
    }
    
    const submitted = assignment.submissions.length;
    const graded = assignment.submissions.filter(sub => sub.grade !== null).length;
    const notSubmitted = totalStudents - submitted;

    return {
      ...assignment,
      stats: {
        notSubmitted,
        submitted,
        graded,
        total: totalStudents
      }
    };
  });

  // Get all unique classes that have either file assignments or exams
  const uniqueClassIds = new Set<string>();
  
  // Add classes from file assignments
  course.assignments.forEach(assignment => {
    if (assignment.classId) uniqueClassIds.add(assignment.classId);
  });
  
  // Add classes from exam attempts
  examAttempts.forEach(attempt => {
    if (attempt.classId) uniqueClassIds.add(attempt.classId);
  });
  
  // Get detailed class info for these classes
  const classesWithAssignments = await prisma.class.findMany({
    where: {
      id: {
        in: Array.from(uniqueClassIds)
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  // Filter grades by class if a filter is selected
  const selectedGradeClass = data.gradeClassFilter || 
    (classesWithAssignments.length > 0 ? classesWithAssignments[0].id : undefined);

  // Get all students from the selected class
  const classStudents = selectedGradeClass ? await prisma.student.findMany({
    where: {
      classId: selectedGradeClass,
      enrollments: {
        some: {
          courseId: course.id
        }
      }
    },
    include: {
      user: {
        select: {
          displayName: true
        }
      }
    },
    orderBy: {
      user: {
        displayName: 'asc'
      }
    }
  }) : [];

  // Get all exam names for the selected class
  const classExamNames = selectedGradeClass ? Array.from(
    new Set(
      examAttempts
        .filter(attempt => attempt.classId === selectedGradeClass)
        .map(attempt => attempt.name)
        .filter(Boolean) as string[]
    )
  ).sort() : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/manage-courses" className="hover:text-primary">
            Quản lý khóa học
          </Link>
          <span>/</span>
          <span>{course.name}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative h-64 w-full md:w-72 overflow-hidden rounded-lg">
            <Image
              src={course.imageUrl || "/images/course-placeholder.png"}
              alt={course.name}
              fill
              className="object-fill"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                    {course.department.name}
                  </span>
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    <UserAvatar
                      size="sm"
                      avatarUrl={course.teacher.user.avatarUrl}
                    />
                    <span className="ml-2">
                      {course.teacher.user.displayName}
                    </span>
                  </div>
                </div>
              </div>

              <EditCourseDialog course={course} />
            </div>

            <p className="text-muted-foreground mb-6">
              {course.description || "Không có mô tả"}
            </p>

            <div className="flex flex-wrap gap-4">
              <Card className="w-full md:w-48">
                <CardHeader className="py-3">
                  <CardTitle className="text-primary flex items-center justify-center">
                    <Layers className="mr-2 h-5 w-5" />
                    Bài học
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-center">
                  <p className="text-3xl font-bold">{course._count.lessons}</p>
                </CardContent>
              </Card>

              <Card className="w-full md:w-48">
                <CardHeader className="py-3">
                  <CardTitle className="text-primary flex items-center justify-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Bài tập
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-center">
                  <p className="text-3xl font-bold">
                    {course._count.assignments}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course content management */}
      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="lessons">Quản lý bài học</TabsTrigger>
          <TabsTrigger value="documents">Quản lý tài liệu</TabsTrigger>
          <TabsTrigger value="assignments">Quản lý bài tập</TabsTrigger>
          <TabsTrigger value="grades">Quản lý điểm</TabsTrigger>
          <TabsTrigger value="prerequisites">Điều kiện tiên quyết</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Danh sách bài học</h2>
            <CreateLessonDialog courseId={course.id} />
          </div>

          {course.lessons.length > 0 ? (
            <div className="space-y-4">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {index + 1}.
                      </span>
                      <h3 className="font-medium text-lg">{lesson.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {lesson.description || "Không có mô tả"}
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {lesson.documents.length} tài liệu
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/manage-courses/${course.id}/lessons/${lesson.id}`}
                    >
                      <Button variant="outline" size="sm">
                        <PenLine className="mr-1 h-4 w-4" />
                        Quản lý
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có bài học nào</h3>
              <p className="text-muted-foreground mb-6">
                Hãy thêm bài học đầu tiên cho khóa học của bạn
              </p>
              <CreateLessonDialog courseId={course.id} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Danh sách tài liệu</h2>
            <CreateDocumentDialog
              courseId={course.id}
              lessons={course.lessons}
            />
          </div>

          {course.lessons.some((lesson) => lesson.documents.length > 0) ? (
            <div className="space-y-6">
              {course.lessons.map(
                (lesson, index) =>
                  lesson.documents.length > 0 && (
                    <div key={lesson.id} className="border rounded-md p-4">
                      <h3 className="font-medium text-lg mb-4">
                        <span className="font-mono text-muted-foreground mr-2">
                          {index + 1}.
                        </span>
                        {lesson.title}
                      </h3>

                      <div className="space-y-3">
                        {lesson.documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 bg-primary/10 text-primary p-2 rounded-md">
                                <Library className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-medium">{document.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {document.description || "Không có mô tả"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  Xem
                                </Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có tài liệu nào</h3>
              <p className="text-muted-foreground mb-6">
                Hãy thêm tài liệu cho khóa học của bạn
              </p>
              <CreateDocumentDialog
                courseId={course.id}
                lessons={course.lessons}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Danh sách bài tập</h2>
            <div className="flex space-x-3">
              <CreateFileAssignmentDialog
                courseId={course.id}
                classes={classes}
                students={enrolledStudents}
              />
              <AssignExamButton courseId={course.id} />
            </div>
          </div>

          <Tabs defaultValue="file">
            <TabsList className="mb-4">
              <TabsTrigger value="file">Bài tập nộp file</TabsTrigger>
              <TabsTrigger value="exam">Bài kiểm tra trắc nghiệm</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              {course.assignments.filter((a) => a.type === "FILE_UPLOAD")
                .length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Danh sách bài tập nộp file
                    </h3>
                    <div className="flex items-center gap-3">
                      <ClassFilterSelect 
                        classes={classes} 
                        selectedClassId={data.fileClassFilter}
                        paramName="fileClassFilter"
                        courseId={course.id}
                      />
                      <CreateFileAssignmentDialog
                        courseId={course.id}
                        classes={classes}
                        students={enrolledStudents}
                      />
                    </div>
                  </div>
                  {processedFileAssignments.length > 0 ? (
                    processedFileAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">
                              {assignment.title}
                            </h3>
                          </div>

                          <p className="text-muted-foreground text-sm mt-1">
                            {assignment.description || "Không có mô tả"}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-cyan-100 text-cyan-800"
                            >
                              Nộp file
                            </Badge>

                            {assignment.class && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800"
                              >
                                Lớp: {assignment.class.name}
                              </Badge>
                            )}

                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800"
                            >
                              Hạn nộp:{" "}
                              {format(
                                new Date(assignment.dueDate),
                                "dd/MM/yyyy",
                                {
                                  locale: vi,
                                }
                              )}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800"
                            >
                              Chưa nộp: {assignment.stats.notSubmitted}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              Đã nộp: {assignment.stats.submitted}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800"
                            >
                              Đã chấm: {assignment.stats.graded}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800"
                            >
                              Tổng: {assignment.stats.total}
                            </Badge>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/manage-courses/${course.id}/assignments/${assignment.id}`}
                          >
                            <Button variant="outline" size="sm">
                              <PenLine className="mr-1 h-4 w-4" />
                              Quản lý
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">
                        Không có bài tập nào {data.fileClassFilter ? "cho lớp đã chọn" : ""}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    Chưa có bài tập nộp file nào
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Hãy thêm bài tập nộp file đầu tiên cho khóa học của bạn
                  </p>
                  <CreateFileAssignmentDialog
                    courseId={course.id}
                    classes={classes}
                    students={enrolledStudents}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="exam">
              {examsDisplay.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Danh sách bài kiểm tra
                    </h3>
                    <div className="flex items-center gap-3">
                      <ClassFilterSelect 
                        classes={classes} 
                        selectedClassId={data.examClassFilter}
                        paramName="examClassFilter"
                        courseId={course.id}
                      />
                      <AssignExamButton courseId={course.id} />
                    </div>
                  </div>
                  {filteredExamsDisplay.length > 0 ? (
                    filteredExamsDisplay.map((exam) => (
                      <div
                        key={exam.id}
                        className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{exam.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="bg-purple-100 text-purple-800"
                            >
                              Bài kiểm tra
                            </Badge>

                            {exam.class && (
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800"
                              >
                                Lớp: {exam.class.name}
                              </Badge>
                            )}

                            {exam.expirateAt && (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-800"
                              >
                                Hạn nộp:{" "}
                                {format(new Date(exam.expirateAt), "dd/MM/yyyy", {
                                  locale: vi,
                                })}
                              </Badge>
                            )}

                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800"
                            >
                              Chưa làm: {exam.notStarted}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              Đang làm: {exam.inProgress}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800"
                            >
                              Hoàn thành: {exam.completed}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800"
                            >
                              Tổng: {exam.total}
                            </Badge>
                          </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/manage-courses/${course.id}/exams?class=${
                              exam.class.id
                            }&name=${encodeURIComponent(exam.name || "")}`}
                          >
                            <Button variant="outline" size="sm">
                              <PenLine className="mr-1 h-4 w-4" />
                              Quản lý
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">
                        Không có bài kiểm tra nào {data.examClassFilter ? "cho lớp đã chọn" : ""}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    Chưa có bài kiểm tra nào
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Hãy thêm bài kiểm tra đầu tiên cho khóa học của bạn
                  </p>
                  <AssignExamButton courseId={course.id} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="grades" className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Quản lý điểm số
            </h2>
            {classesWithAssignments.length > 0 && (
              <div className="flex items-center gap-3">
                <ClassFilterSelect 
                  classes={classesWithAssignments} 
                  selectedClassId={selectedGradeClass}
                  paramName="gradeClassFilter"
                  courseId={course.id}
                />
              </div>
            )}
          </div>

          {selectedGradeClass && classStudents.length > 0 ? (
            <div className="space-y-6">
              <Card className="border rounded-md p-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {classesWithAssignments.find(c => c.id === selectedGradeClass)?.name || "Lớp học"}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-2 pb-0">
                  {classExamNames.length > 0 ? (
                    <div>
                      <h3 className="text-md font-medium mb-3">Bảng điểm bài kiểm tra</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="text-left p-2 border">Tên sinh viên</th>
                              {classExamNames.map(examName => (
                                <th key={examName} className="text-left p-2 border">
                                  {examName}
                                </th>
                              ))}
                              <th className="text-left p-2 border bg-blue-50">Điểm trung bình</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classStudents.map(student => {
                              // Find all attempts for this student
                              const studentAttempts = examAttempts.filter(
                                attempt => attempt.studentId === student.id
                              );
                              
                              // Calculate average score of completed exams
                              const completedAttempts = studentAttempts.filter(
                                attempt => attempt.finishedAt && attempt.score !== null
                              );
                              
                              const totalScore = completedAttempts.reduce(
                                (sum, attempt) => sum + (attempt.score || 0), 
                                0
                              );
                              
                              const averageScore = completedAttempts.length > 0 
                                ? (totalScore / completedAttempts.length).toFixed(2) 
                                : "-";
                              
                              return (
                                <tr key={student.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2 border font-medium">
                                    {student.user.displayName}
                                  </td>
                                  
                                  {classExamNames.map(examName => {
                                    const attempt = studentAttempts.find(
                                      a => a.name === examName
                                    );
                                    
                                    return (
                                      <td key={examName} className="p-2 border text-center">
                                        {attempt ? (
                                          attempt.finishedAt ? (
                                            <span className={attempt.score !== null ? (
                                              attempt.score >= 5 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                                            ) : "text-muted-foreground"}>
                                              {attempt.score !== null ? attempt.score : "Chưa có điểm"}
                                            </span>
                                          ) : attempt.startedAt ? (
                                            <span className="text-yellow-500">Đang làm</span>
                                          ) : (
                                            <span className="text-muted-foreground">Chưa làm</span>
                                          )
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  
                                  <td className="p-2 border text-center font-semibold bg-blue-50">
                                    {averageScore !== "-" ? (
                                      <span className={parseFloat(averageScore) >= 5 ? "text-green-600" : "text-red-600"}>
                                        {averageScore}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">
                        Không có bài kiểm tra nào cho lớp này
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có dữ liệu điểm số</h3>
              <p className="text-muted-foreground mb-6">
                {selectedGradeClass 
                  ? "Không có sinh viên nào trong lớp này hoặc sinh viên chưa tham gia bài kiểm tra" 
                  : "Thêm bài tập hoặc bài kiểm tra cho lớp học để quản lý điểm số"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="old_grades" className="hidden">
          {classesWithAssignments.length > 0 ? (
            <div className="space-y-6">
              {classesWithAssignments.map((classItem) => {
                // Filter file assignments for this class
                const fileAssignments = course.assignments.filter(
                  (a) => a.type === "FILE_UPLOAD" && a.classId === classItem.id
                );
                
                // Filter exam attempts for this class
                const classExamAttempts = examAttempts.filter(
                  (attempt) => attempt.classId === classItem.id
                );
                
                // Group exam attempts by exam name
                const examsByName = new Map<string, typeof examAttempts>();
                classExamAttempts.forEach(attempt => {
                  if (!attempt.name) return;
                  
                  if (!examsByName.has(attempt.name)) {
                    examsByName.set(attempt.name, []);
                  }
                  examsByName.get(attempt.name)!.push(attempt);
                });
                
                return (
                  <Card key={classItem.id} className="border rounded-md p-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">{classItem.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-2 pb-0">
                      {(fileAssignments.length > 0 || examsByName.size > 0) ? (
                        <div className="space-y-6">
                          {fileAssignments.length > 0 && (
                            <div>
                              <h3 className="text-md font-medium mb-3">Bài tập nộp file</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-muted">
                                      <th className="text-left p-2 border">Tên sinh viên</th>
                                      {fileAssignments.map(assignment => (
                                        <th key={assignment.id} className="text-left p-2 border">
                                          {assignment.title}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Get all unique students who have submitted any assignments */}
                                    {Array.from(new Set(
                                      fileAssignments.flatMap(a => 
                                        a.submissions.map(s => s.student.id)
                                      )
                                    )).map(studentId => {
                                      const studentInfo = fileAssignments
                                        .flatMap(a => a.submissions)
                                        .find(s => s.student.id === studentId)?.student;
                                      
                                      if (!studentInfo) return null;
                                      
                                      return (
                                        <tr key={studentId} className="border-b hover:bg-muted/50">
                                          <td className="p-2 border">
                                            {studentInfo.user.displayName}
                                          </td>
                                          {fileAssignments.map(assignment => {
                                            const submission = assignment.submissions.find(
                                              s => s.studentId === studentId
                                            );
                                            
                                            return (
                                              <td key={assignment.id} className="p-2 border">
                                                {submission ? (
                                                  submission.grade !== null ? (
                                                    <span>{submission.grade}</span>
                                                  ) : (
                                                    <span className="text-yellow-500">Chưa chấm</span>
                                                  )
                                                ) : (
                                                  <span className="text-red-500">Chưa nộp</span>
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {examsByName.size > 0 && (
                            <div>
                              <h3 className="text-md font-medium mb-3">Bài kiểm tra trắc nghiệm</h3>
                              {Array.from(examsByName.entries()).map(([examName, attempts]) => (
                                <div key={examName} className="mb-4">
                                  <h4 className="font-medium mb-2">{examName}</h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                      <thead>
                                        <tr className="bg-muted">
                                          <th className="text-left p-2 border">Tên sinh viên</th>
                                          <th className="text-left p-2 border">Điểm số</th>
                                          <th className="text-left p-2 border">Trạng thái</th>
                                          <th className="text-left p-2 border">Thời gian hoàn thành</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {attempts.map(attempt => (
                                          <tr key={attempt.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 border">
                                              {attempt.student?.user.displayName || "Không xác định"}
                                            </td>
                                            <td className="p-2 border">
                                              {attempt.score !== null ? (
                                                attempt.score
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </td>
                                            <td className="p-2 border">
                                              {attempt.finishedAt ? (
                                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                                  Đã hoàn thành
                                                </Badge>
                                              ) : attempt.startedAt ? (
                                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                                  Đang làm
                                                </Badge>
                                              ) : (
                                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                                  Chưa làm
                                                </Badge>
                                              )}
                                            </td>
                                            <td className="p-2 border">
                                              {attempt.finishedAt ? (
                                                format(new Date(attempt.finishedAt), "dd/MM/yyyy HH:mm", {
                                                  locale: vi,
                                                })
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted/30 rounded-lg">
                          <p className="text-muted-foreground">
                            Không có bài tập hoặc bài kiểm tra nào cho lớp này
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có dữ liệu điểm số</h3>
              <p className="text-muted-foreground mb-6">
                Thêm bài tập hoặc bài kiểm tra cho lớp học để quản lý điểm số
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prerequisites" className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Điều kiện tiên quyết</h2>
            <PrerequisiteDialog 
              courseId={course.id} 
              initialPrerequisites={course.prerequisites}
            />
          </div>

          {course.prerequisites.length > 0 ? (
            <div className="space-y-4">
              {course.prerequisites.map((prerequisite) => (
                <div
                  key={prerequisite.id}
                  className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-lg">{prerequisite.subject.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {prerequisite.description || "Không có mô tả"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có điều kiện tiên quyết nào</h3>
              <p className="text-muted-foreground mb-6">
                Thêm các môn học tiên quyết mà sinh viên cần hoàn thành trước khi tham gia khóa học này
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
