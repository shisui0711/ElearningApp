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
    const chartType = searchParams.get("chartType") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId") || undefined;

    // Default date ranges if not provided
    let dateFilter: any = {};
    let completionsDateFilter: any = {};
    let now = new Date();

    if (startDate && endDate) {
      // Use custom date range if provided
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end,
        },
      };
      
      completionsDateFilter = {
        completedAt: {
          gte: start,
          lte: end,
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
          completionsDateFilter.completedAt = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          break;
        case "month":
          // Past 30 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          completionsDateFilter.completedAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          break;
        case "quarter":
          // Past 90 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          completionsDateFilter.completedAt = {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          break;
        case "year":
          // Past 365 days
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          completionsDateFilter.completedAt = {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          break;
        default:
          // Default to 30 days if invalid timeRange
          dateFilter.createdAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
          completionsDateFilter.completedAt = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            lte: now,
          };
      }
    }

    // Department filter if specified
    const departmentFilter = departmentId ? {
      course: {
        departmentId: departmentId
      }
    } : {};

    // Combine filters for course completions
    const completionsWhereFilter = {
      ...completionsDateFilter,
      ...departmentFilter
    };

    // Data for line chart - enrollment trend or completion trend
    let lineData:any[] = [];
    if (chartType === "line" || chartType === "all" || chartType === "enrollment") {
      // Group enrollments by day
      const enrollmentsByDay = await prisma.enrollment.groupBy({
        by: ['createdAt' as Prisma.EnrollmentScalarFieldEnum],
        where: {
          ...dateFilter,
          ...(departmentId ? { course: { departmentId } } : {})
        },
        _count: true,
      });

      // Format data for line chart
      const groupedByDay: Record<string, number> = {};
      enrollmentsByDay.forEach((item: any) => {
        const date = new Date(item.createdAt);
        const day = date.toISOString().split('T')[0];
        groupedByDay[day] = (groupedByDay[day] || 0) + item._count;
      });

      // Convert to array and sort by date
      lineData = Object.entries(groupedByDay)
        .map(([date, count]) => {
          // Format date to be more readable (YYYY-MM-DD)
          const formattedDate = new Date(date).toISOString().split('T')[0];
          return {
            name: formattedDate,
            completion: count,
          };
        })
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    } else if (chartType === "completion") {
      // Group completions by day
      const completionsByDay = await prisma.courseCompletion.groupBy({
        by: ['completedAt' as Prisma.CourseCompletionScalarFieldEnum],
        where: completionsWhereFilter,
        _count: true,
      });

      // Format data for line chart
      const groupedByDay: Record<string, number> = {};
      completionsByDay.forEach((item: any) => {
        const date = new Date(item.completedAt);
        const day = date.toISOString().split('T')[0];
        groupedByDay[day] = (groupedByDay[day] || 0) + item._count;
      });

      // Convert to array and sort by date
      lineData = Object.entries(groupedByDay)
        .map(([date, count]) => {
          // Format date to be more readable (YYYY-MM-DD)
          const formattedDate = new Date(date).toISOString().split('T')[0];
          return {
            name: formattedDate,
            completion: count,
          };
        })
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    }

    // Data for bar chart - enrollments by department
    let barData:any[] = [];
    if (chartType === "bar" || chartType === "all" || chartType === "enrollment") {
      // Get all departments with enrollment counts
      const departments = await prisma.department.findMany({
        where: departmentId ? { id: departmentId } : {},
        include: {
          courses: {
            include: {
              enrollments: {
                where: dateFilter,
              },
            },
          },
        },
      });

      // Format data for bar chart
      barData = departments.map(dept => {
        // Sum enrollments across all courses in the department
        const totalEnrollments = dept.courses.reduce(
          (sum, course) => sum + course.enrollments.length,
          0
        );

        return {
          name: dept.name,
          total: totalEnrollments,
        };
      })
      .filter(dept => dept.total > 0) // Remove departments with 0 enrollments
      .sort((a, b) => b.total - a.total); // Sort by number of enrollments
    }

    // Data for pie chart - course completion distribution by department
    let pieData:any[] = [];
    if (chartType === "pie" || chartType === "all" || chartType === "completion") {
      // Get all departments with course completions
      const departments = await prisma.department.findMany({
        where: departmentId ? { id: departmentId } : {},
        include: {
          courses: {
            include: {
              completions: {
                where: completionsDateFilter,
              },
            },
          },
        },
      });

      // Format data for pie chart
      pieData = departments.map(dept => {
        // Sum completions across all courses in the department
        const totalCompletions = dept.courses.reduce(
          (sum, course) => sum + course.completions.length,
          0
        );

        return {
          name: dept.name,
          value: totalCompletions,
        };
      })
      .filter(dept => dept.value > 0); // Remove departments with 0 completions
    }

    // Prepare response based on requested chart type
    const responseData: any = {};
    
    if (chartType === "line" || chartType === "all" || chartType === "enrollment" || chartType === "completion") {
      responseData.lineData = lineData;
    }
    
    if (chartType === "bar" || chartType === "all" || chartType === "enrollment") {
      responseData.barData = barData;
    }
    
    if (chartType === "pie" || chartType === "all" || chartType === "completion") {
      responseData.pieData = pieData;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[CHARTS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 