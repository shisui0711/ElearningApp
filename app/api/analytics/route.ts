import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Only admin users can access analytics
  if (user.role !== UserRole.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");

    // Parse dates if provided
    const startDateTime = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDateTime = endDate ? new Date(endDate) : new Date();

    // Filter conditions based on department
    const departmentFilter = departmentId ? { departmentId } : {};

    // Get general statistics
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalCourses = await prisma.course.count();
    const totalDepartments = await prisma.department.count();
    const totalClasses = await prisma.class.count();

    // Get student growth over time (by month for the last year)
    const studentGrowth = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        role: UserRole.STUDENT,
        createdAt: {
          gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // Get course enrollments
    const courseEnrollments = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        department: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        students: {
          _count: "desc"
        }
      },
      take: 10
    });

    // Get completion statistics
    const completedLessons = await prisma.completedLesson.groupBy({
      by: ["lessonId"],
      _count: {
        studentId: true
      }
    });

    // Get exam performance data
    const examPerformance = await prisma.examAttempt.groupBy({
      by: ["examId"],
      _avg: {
        score: true
      },
      _count: {
        id: true
      }
    });

    // Get department statistics
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            id: true
          }
        },
        Class: {
          select: {
            students: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    const formattedDepartmentStats = departmentStats.map(dept => {
      // Count students across all classes in the department
      const studentCount = dept.Class.reduce((acc, cls) => acc + cls.students.length, 0);
      
      return {
        id: dept.id,
        name: dept.name,
        courseCount: dept.courses.length,
        studentCount
      };
    });

    // Return analytics data
    return NextResponse.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalDepartments,
        totalClasses
      },
      studentGrowth,
      courseEnrollments: courseEnrollments.map(course => ({
        name: course.name,
        department: course.department.name,
        enrollments: course._count.students
      })),
      completionStats: completedLessons,
      examPerformance: examPerformance,
      departmentStats: formattedDepartmentStats
    });
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 