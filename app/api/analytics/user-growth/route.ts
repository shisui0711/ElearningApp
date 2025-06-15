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
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "month";
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    // Default dates based on timeRange
    let now = new Date();
    let startDate: Date;
    let endDate = now;
    
    // Set start date based on parameters or time range
    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      // Calculate start date based on timeRange
      switch (timeRange) {
        case "week":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case "quarter":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case "year":
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          // Default to past 12 months
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      }
    }
    
    // Determine the period granularity based on the date range
    const dateDiffInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let periodType: 'day' | 'week' | 'month';
    if (dateDiffInDays <= 31) {
      periodType = 'day';
    } else if (dateDiffInDays <= 90) {
      periodType = 'week';
    } else {
      periodType = 'month';
    }
    
    // Generate periods array
    const periods: any[] = [];
    
    if (periodType === 'day') {
      // For daily periods
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = new Date(d);
        periods.push({
          label: day.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
          startDate: new Date(day.getFullYear(), day.getMonth(), day.getDate()),
          endDate: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59),
          students: 0,
          teachers: 0
        });
      }
    } else if (periodType === 'week') {
      // For weekly periods
      let weekStart = new Date(startDate);
      while (weekStart <= endDate) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        periods.push({
          label: `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`,
          startDate: new Date(weekStart),
          endDate: new Date(Math.min(weekEnd.getTime(), endDate.getTime())),
          students: 0,
          teachers: 0
        });
        
        weekStart.setDate(weekStart.getDate() + 7);
      }
    } else {
      // For monthly periods
      for (let m = new Date(startDate.getFullYear(), startDate.getMonth(), 1); 
           m <= endDate; 
           m.setMonth(m.getMonth() + 1)) {
        const month = new Date(m);
        periods.push({
          label: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
          startDate: new Date(month.getFullYear(), month.getMonth(), 1),
          endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59),
          students: 0,
          teachers: 0
        });
      }
    }

    // Get student data
    const studentData = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    // Get teacher data
    const teacherData = await prisma.user.findMany({
      where: {
        role: UserRole.TEACHER,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });
    
    // Process and accumulate the data per period
    studentData.forEach(student => {
      const periodIndex = periods.findIndex(p => 
        student.createdAt >= p.startDate && student.createdAt <= p.endDate
      );
      
      if (periodIndex !== -1) {
        periods[periodIndex].students += 1;
      }
    });
    
    teacherData.forEach(teacher => {
      const periodIndex = periods.findIndex(p => 
        teacher.createdAt >= p.startDate && teacher.createdAt <= p.endDate
      );
      
      if (periodIndex !== -1) {
        periods[periodIndex].teachers += 1;
      }
    });

    // Format the data for the chart - cumulative count
    let cumulativeStudents = 0;
    let cumulativeTeachers = 0;
    
    const formattedData = periods.map(period => {
      cumulativeStudents += period.students;
      cumulativeTeachers += period.teachers;
      
      return {
        month: period.label, // Keep the key as 'month' for backward compatibility
        students: cumulativeStudents,
        teachers: cumulativeTeachers
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("[USER_GROWTH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 