import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    // Verify user is authenticated and has admin privileges
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Default date ranges if not provided
    let dateFilter: any = {};
    let previousPeriodFilter: any = {};
    let now = new Date();

    if (startDate && endDate) {
      // Use custom date range if provided
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate previous period with same duration
      const duration = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = new Date(start);
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end,
        },
      };
      
      previousPeriodFilter = {
        createdAt: {
          gte: prevStart,
          lte: prevEnd,
        },
      };
    } else {
      // Use timeRange parameter
      switch (timeRange) {
        case "week":
          // Past 7 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          // Previous 7 days
          previousPeriodFilter.createdAt = {
            gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
        case "month":
          // Past 30 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          // Previous 30 days
          previousPeriodFilter.createdAt = {
            gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          };
          break;
        case "quarter":
          // Past 90 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          // Previous 90 days
          previousPeriodFilter.createdAt = {
            gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          };
          break;
        case "year":
          // Past 365 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          // Previous 365 days
          previousPeriodFilter.createdAt = {
            gte: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          };
          break;
        default:
          // Default to 30 days if invalid timeRange
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          previousPeriodFilter.createdAt = {
            gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          };
      }
    }

    // Get current period data
    const enrollments = await prisma.enrollment.count({
      where: dateFilter,
    });

    const enrollmentsByDepartment = await prisma.enrollment.findMany({
      where: dateFilter,
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
    });

    // Get unique student count
    const uniqueStudents = await prisma.enrollment.groupBy({
      by: ['studentId' as Prisma.EnrollmentScalarFieldEnum],
      where: dateFilter,
      _count: true,
    });

    // Get unique returning students
    const returningStudentsCount = await prisma.student.count({
      where: {
        enrollments: {
          some: dateFilter,
        },
        AND: {
          enrollments: {
            some: {
              createdAt: {
                lt: dateFilter.createdAt.gte,
              },
            },
          },
        },
      },
    });

    // Get previous period data for comparison
    const previousEnrollments = await prisma.enrollment.count({
      where: previousPeriodFilter,
    });

    const previousUniqueStudents = await prisma.enrollment.groupBy({
      by: ['studentId' as Prisma.EnrollmentScalarFieldEnum],
      where: previousPeriodFilter,
      _count: true,
    });

    const previousReturningStudentsCount = await prisma.student.count({
      where: {
        enrollments: {
          some: previousPeriodFilter,
        },
        AND: {
          enrollments: {
            some: {
              createdAt: {
                lt: previousPeriodFilter.createdAt.gte,
              },
            },
          },
        },
      },
    });

    // Get top courses by enrollment count
    const topCourses = await prisma.course.findMany({
      where: {
        enrollments: {
          some: dateFilter,
        },
      },
      include: {
        department: true,
        _count: {
          select: {
            enrollments: {
              where: dateFilter,
            },
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get previous period enrollments for the top courses for growth calculation
    const topCourseIds = topCourses.map((course) => course.id);
    const previousTopCoursesEnrollments = await prisma.enrollment.groupBy({
      by: ['courseId' as Prisma.EnrollmentScalarFieldEnum],
      where: {
        courseId: {
          in: topCourseIds,
        },
        ...previousPeriodFilter,
      },
      _count: true,
    });

    // Create a map for quick lookup
    const previousCourseEnrollmentsMap = previousTopCoursesEnrollments.reduce((map: Record<string, number>, item: any) => {
      map[item.courseId] = item._count;
      return map;
    }, {} as Record<string, number>);

    // Calculate metrics
    const totalStudents = uniqueStudents.length;
    const avgEnrollmentsPerStudent = totalStudents > 0 
      ? enrollments / totalStudents 
      : 0;
    
    const enrollmentRate = totalStudents > 0 
      ? Math.round((returningStudentsCount / totalStudents) * 100) 
      : 0;

    // Format top courses with growth rates
    const formattedTopCourses = topCourses.map((course) => {
      const currentEnrollments = course._count.enrollments;
      const previousEnrollments = previousCourseEnrollmentsMap[course.id] || 0;
      
      let growthPercent = 0;
      if (previousEnrollments > 0) {
        growthPercent = ((currentEnrollments - previousEnrollments) / previousEnrollments) * 100;
      } else if (currentEnrollments > 0) {
        growthPercent = 100; // 100% growth if there were no previous enrollments
      }
      
      return {
        id: course.id,
        name: course.name, // According to schema, it's 'name' not 'title'
        enrollments: currentEnrollments,
        department: course.department.name,
        growth: `${growthPercent > 0 ? '+' : ''}${growthPercent.toFixed(0)}%`,
      };
    });

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const growthRate = ((current - previous) / previous) * 100;
      return `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
    };

    const previousAvgEnrollmentsPerStudent = previousUniqueStudents.length > 0 
      ? previousEnrollments / previousUniqueStudents.length 
      : 0;
    
    const previousEnrollmentRate = previousUniqueStudents.length > 0
      ? Math.round((previousReturningStudentsCount / previousUniqueStudents.length) * 100)
      : 0;

    // Prepare response data
    const responseData = {
      newEnrollments: enrollments,
      enrollmentRate: enrollmentRate,
      averagePerStudent: parseFloat(avgEnrollmentsPerStudent.toFixed(1)),
      retentionRate: Math.round((returningStudentsCount / totalStudents) * 100) || 0,
      growthRates: {
        newEnrollments: calculateGrowthRate(enrollments, previousEnrollments),
        enrollmentRate: calculateGrowthRate(enrollmentRate, previousEnrollmentRate),
        averagePerStudent: calculateGrowthRate(avgEnrollmentsPerStudent, previousAvgEnrollmentsPerStudent),
        retentionRate: calculateGrowthRate(
          (returningStudentsCount / totalStudents) || 0, 
          (previousReturningStudentsCount / previousUniqueStudents.length) || 0
        ),
      },
      topCourses: formattedTopCourses,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[ANALYTICS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 