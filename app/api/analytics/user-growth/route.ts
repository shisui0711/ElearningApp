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
    // Get user growth for the past 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    
    // Initialize months array
    const months: any[] = [];
    for (let i = 0; i < 12; i++) {
      const month = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
      months.push({
        month: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        students: 0,
        teachers: 0,
        startDate: new Date(month.getFullYear(), month.getMonth(), 1),
        endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0)
      });
    }

    // Get student data by month
    const studentData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: UserRole.STUDENT,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Get teacher data by month
    const teacherData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: UserRole.TEACHER,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      _count: {
        id: true
      }
    });
    
    // Process and accumulate the data per month
    studentData.forEach(item => {
      const date = new Date(item.createdAt);
      const monthIndex = months.findIndex(m => 
        date >= m.startDate && date <= m.endDate
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].students += item._count.id;
      }
    });
    
    teacherData.forEach(item => {
      const date = new Date(item.createdAt);
      const monthIndex = months.findIndex(m => 
        date >= m.startDate && date <= m.endDate
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].teachers += item._count.id;
      }
    });

    // Format the data for the chart - cumulative count
    let cumulativeStudents = 0;
    let cumulativeTeachers = 0;
    
    const formattedData = months.map(monthData => {
      cumulativeStudents += monthData.students;
      cumulativeTeachers += monthData.teachers;
      
      return {
        month: monthData.month,
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