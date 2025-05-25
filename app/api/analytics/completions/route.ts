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
    const departmentId = searchParams.get("departmentId") || undefined;
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
        completedAt: {
          gte: start,
          lte: end,
        },
      };
      
      previousPeriodFilter = {
        completedAt: {
          gte: prevStart,
          lte: prevEnd,
        },
      };
    } else {
      // Default to last 30 days
      dateFilter.completedAt = {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        lte: now,
      };
      
      // Previous 30 days for comparison
      previousPeriodFilter.completedAt = {
        gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    // Department filter if specified
    const departmentFilter = departmentId ? {
      course: {
        departmentId: departmentId
      }
    } : {};

    // Combine filters
    const whereFilter = {
      ...dateFilter,
      ...departmentFilter
    };

    const previousWhereFilter = {
      ...previousPeriodFilter,
      ...departmentFilter
    };

    // Get total completions
    const totalCompletions = await prisma.courseCompletion.count({
      where: whereFilter,
    });

    // Get previous period completions
    const previousTotalCompletions = await prisma.courseCompletion.count({
      where: previousWhereFilter,
    });

    // Calculate average completion rate
    // For this we need:
    // 1. Total completions
    // 2. Total enrollments (students who started but may not have completed)
    const enrollments = await prisma.enrollment.count({
      where: {
        ...departmentFilter,
        createdAt: {
          lte: dateFilter.completedAt.lte
        }
      },
    });

    const previousEnrollments = await prisma.enrollment.count({
      where: {
        ...departmentFilter,
        createdAt: {
          lte: previousPeriodFilter.completedAt.lte
        }
      },
    });

    // Calculate average completion time (in weeks)
    // We'll need to find the average time between enrollment and completion
    const courseCompletions = await prisma.courseCompletion.findMany({
      where: whereFilter,
      include: {
        course: true,
        student: true
      }
    });

    // Then for each completion, get the matching enrollment
    const courseCompletionsWithEnrollment = await Promise.all(
      courseCompletions.map(async (completion) => {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            courseId: completion.courseId,
            studentId: completion.studentId
          }
        });
        
        return {
          ...completion,
          student: {
            ...completion.student,
            enrollments: enrollment ? [enrollment] : []
          }
        };
      })
    );

    let totalWeeks = 0;
    let countWithDuration = 0;

    courseCompletionsWithEnrollment.forEach(completion => {
      if (completion.student?.enrollments && completion.student.enrollments.length > 0) {
        const enrollment = completion.student.enrollments[0];
        const completionTime = completion.completedAt.getTime() - enrollment.createdAt.getTime();
        const weeks = completionTime / (7 * 24 * 60 * 60 * 1000); // Convert ms to weeks
        totalWeeks += weeks;
        countWithDuration++;
      }
    });

    const averageCompletionTime = countWithDuration > 0 ? 
      parseFloat((totalWeeks / countWithDuration).toFixed(1)) : 
      0;

    // Calculate achievement rate (percentage of students with high grades)
    // This is a placeholder since we don't have actual grades in our model
    // In a real implementation, you would query the grades or use other metrics
    const achievementRate = 72; // Placeholder value

    // Get completions by course
    const topCourses = await prisma.course.findMany({
      where: departmentId ? { departmentId } : {},
      include: {
        completions: {
          where: dateFilter,
          include: {
            student: true
          }
        },
        enrollments: true
      },
      orderBy: {
        completions: {
          _count: "desc"
        }
      },
      take: 10
    });

    // Format top courses with completion rates
    const courseCompletionsFormatted = topCourses.map(course => {
      const completions = course.completions.length;
      const enrollments = course.enrollments.length;
      const completionRate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;

      // Calculate average completion duration for this course
      let courseTotalWeeks = 0;
      let courseCountWithDuration = 0;

      course.completions.forEach(completion => {
        const studentEnrollment = course.enrollments.find(e => e.studentId === completion.studentId);
        if (studentEnrollment) {
          const completionTime = completion.completedAt.getTime() - studentEnrollment.createdAt.getTime();
          const weeks = completionTime / (7 * 24 * 60 * 60 * 1000);
          courseTotalWeeks += weeks;
          courseCountWithDuration++;
        }
      });

      const avgDuration = courseCountWithDuration > 0 ? 
        `${(courseTotalWeeks / courseCountWithDuration).toFixed(1)} tuần` : 
        "N/A";

      return {
        id: course.id,
        name: course.name,
        completion: completionRate,
        students: enrollments,
        avgDuration
      };
    }).filter(course => course.students > 0) // Only show courses with students
      .sort((a, b) => b.completion - a.completion); // Sort by completion rate

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const growthRate = ((current - previous) / previous) * 100;
      return `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
    };

    const calculateTimeDifference = (current: number, previous: number) => {
      const difference = current - previous;
      return `${difference > 0 ? '+' : ''}${difference.toFixed(1)}`;
    };

    // For this demo, we'll use placeholder values for previous metrics that we don't calculate
    const previousAverageCompletionTime = averageCompletionTime * 0.9; // Just a placeholder
    const previousAchievementRate = 67; // Placeholder value

    // Average completion rate - completed courses as a percentage of enrollments
    const averageCompletionRate = enrollments > 0 ? 
      Math.round((totalCompletions / enrollments) * 100) : 
      0;
    
    const previousAverageCompletionRate = previousEnrollments > 0 ? 
      Math.round((previousTotalCompletions / previousEnrollments) * 100) : 
      0;

    // Prepare response data
    const responseData = {
      averageCompletionRate,
      averageCompletionTime,
      totalCompletions,
      achievementRate,
      growthRates: {
        completionRate: calculateGrowthRate(averageCompletionRate, previousAverageCompletionRate),
        completionTime: calculateTimeDifference(averageCompletionTime, previousAverageCompletionTime),
        totalCompletions: `${totalCompletions > previousTotalCompletions ? '+' : ''}${totalCompletions - previousTotalCompletions}`,
        achievementRate: calculateGrowthRate(achievementRate, previousAchievementRate),
      },
      courseCompletions: courseCompletionsFormatted
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[COMPLETION_ANALYTICS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 