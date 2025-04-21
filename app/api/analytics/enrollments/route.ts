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

    // Department filter if specified
    const departmentFilter = departmentId ? {
      course: {
        departmentId
      }
    } : {};

    // Date filter
    const dateFilter = {
      createdAt: {
        gte: startDateTime,
        lte: endDateTime
      }
    };

    // Combine filters
    const whereFilter = {
      ...dateFilter,
      ...departmentFilter
    };

    // Get enrollment count for the period
    const enrollmentCount = await prisma.enrollment.count({
      where: whereFilter
    });

    // Get enrollment count for previous period (for growth calculation)
    const previousPeriodStart = new Date(startDateTime);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    
    const previousPeriodEnd = new Date(startDateTime);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    
    const previousEnrollmentCount = await prisma.enrollment.count({
      where: {
        ...departmentFilter,
        createdAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      }
    });

    // Calculate growth percentage
    const growthPercentage = previousEnrollmentCount > 0
      ? ((enrollmentCount - previousEnrollmentCount) / previousEnrollmentCount) * 100
      : 100;

    // Get enrollments by course
    const courseEnrollments = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            enrollments: {
              where: dateFilter
            }
          }
        }
      },
      where: departmentId ? {
        departmentId
      } : {},
      orderBy: {
        enrollments: {
          _count: "desc"
        }
      },
      take: 10
    });

    // Get enrollments by department
    const departmentEnrollments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        courses: {
          select: {
            enrollments: {
              where: dateFilter,
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    
    const formattedDepartmentEnrollments = departmentEnrollments.map(dept => {
      const enrollmentCount = dept.courses.reduce(
        (sum, course) => sum + course.enrollments.length, 
        0
      );
      
      return {
        id: dept.id,
        name: dept.name,
        enrollments: enrollmentCount
      };
    }).sort((a, b) => b.enrollments - a.enrollments);

    // Get enrollment trends over time (by day)
    const enrollmentTrend = await prisma.enrollment.groupBy({
      by: ["createdAt"],
      where: whereFilter,
      _count: {
        id: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // Format enrollment trend by day
    const trendByDay = enrollmentTrend.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const day = date.toISOString().split('T')[0];
      
      if (!acc[day]) {
        acc[day] = 0;
      }
      
      acc[day] += item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array for frontend
    const trendArray = Object.entries(trendByDay).map(([date, count]) => ({
      date,
      enrollments: count
    }));

    // Get average enrollments per student
    const totalStudents = await prisma.student.count();
    const totalEnrollments = await prisma.enrollment.count();
    const avgEnrollmentsPerStudent = totalStudents > 0 ? totalEnrollments / totalStudents : 0;

    // Enrollment retention rate (students who remain enrolled after 30 days)
    // This is a simplified example - in a real system you would track unenrollments or activity
    const retentionRate = 76; // Example static value - in real implementation would calculate from data

    // Return analytics data
    return NextResponse.json({
      overview: {
        enrollmentCount,
        growthPercentage: Math.round(growthPercentage * 10) / 10,
        avgEnrollmentsPerStudent: Math.round(avgEnrollmentsPerStudent * 10) / 10,
        retentionRate
      },
      topCourses: courseEnrollments.map(course => ({
        id: course.id,
        name: course.name,
        department: course.department.name,
        departmentId: course.department.id,
        enrollments: course._count.enrollments
      })),
      departmentEnrollments: formattedDepartmentEnrollments,
      enrollmentTrend: trendArray
    });
  } catch (error) {
    console.error("[ENROLLMENT_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 