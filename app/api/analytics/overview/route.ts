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
    // Get total students, courses, completed rate, average score
    const totalStudents = await prisma.student.count();
    const totalCourses = await prisma.course.count();
    
    // Calculate completion rate
    const totalLessons = await prisma.lesson.count();
    const totalCompletedLessons = await prisma.completedLesson.count();
    const completionRate = totalLessons > 0 
      ? Math.round((totalCompletedLessons / (totalLessons * totalStudents)) * 100) 
      : 0;
    
    // Calculate average exam score
    const examScores = await prisma.examAttempt.aggregate({
      _avg: {
        score: true
      }
    });
    const averageScore = Math.round(examScores._avg.score || 0);

    // Get monthly changes
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    // Student change
    const previousMonthStudents = await prisma.student.count({
      where: {
        createdAt: {
          lt: previousMonth
        }
      }
    });
    const studentChange = totalStudents - previousMonthStudents;
    
    // Course change
    const previousMonthCourses = await prisma.course.count({
      where: {
        createdAt: {
          lt: previousMonth
        }
      }
    });
    const courseChange = totalCourses - previousMonthCourses;
    
    // Completion rate change (approximation)
    const previousMonthCompletedLessons = await prisma.completedLesson.count({
      where: {
        createdAt: {
          lt: previousMonth
        }
      }
    });
    const previousCompletionRate = totalLessons > 0 && previousMonthStudents > 0
      ? Math.round((previousMonthCompletedLessons / (totalLessons * previousMonthStudents)) * 100)
      : 0;
    const completionRateChange = completionRate - previousCompletionRate;
    
    // Average score change (approximation)
    const previousMonthScores = await prisma.examAttempt.aggregate({
      _avg: {
        score: true
      },
      where: {
        createdAt: {
          lt: previousMonth
        }
      }
    });
    const previousAverageScore = Math.round(previousMonthScores._avg.score || 0);
    const scoreChange = averageScore - previousAverageScore;

    return NextResponse.json({
      totalStudents,
      totalCourses,
      completionRate,
      averageScore,
      studentChange,
      courseChange,
      completionRateChange,
      scoreChange
    });
  } catch (error) {
    console.error("[ANALYTICS_OVERVIEW_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 