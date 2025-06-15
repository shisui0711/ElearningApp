import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all departments
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            courses: true,
            Class: true
          }
        },
        courses: {
          include: {
            _count: {
              select: {
                enrollments: true,
                completions: true
              }
            },
            ratings: true
          }
        }
      }
    });

    // Transform department data with calculated stats
    const departmentsWithStats = await Promise.all(departments.map(async (dept) => {
      // Calculate total students for the department
      const studentsCount = await prisma.student.count({
        where: {
          class: {
            departmentId: dept.id
          }
        }
      });

      // Calculate average completion rate for courses in this department
      const completionRatePromises = dept.courses.map(async (course) => {
        const totalEnrollments = course._count.enrollments;
        if (totalEnrollments === 0) return 0;
        
        const totalCompletions = course._count.completions;
        return (totalCompletions / totalEnrollments) * 100;
      });
      
      const completionRates = await Promise.all(completionRatePromises);
      const avgCompletion = completionRates.length > 0
        ? Math.round(completionRates.reduce((acc, rate) => acc + rate, 0) / completionRates.length)
        : 0;

      // Calculate average score (from course ratings) for this department
      const allRatings = dept.courses.flatMap(course => course.ratings);
      const avgScore = allRatings.length > 0
        ? Math.round(allRatings.reduce((acc, rating) => acc + rating.rating, 0) / allRatings.length * 20) // Convert 1-5 scale to percentage
        : 0;

      // Calculate growth (comparing enrollments from the last month to previous month)
      const currentDate = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(currentDate.getMonth() - 1);
      
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
      
      const lastMonthEnrollments = await prisma.enrollment.count({
        where: {
          course: {
            departmentId: dept.id
          },
          createdAt: {
            gte: lastMonth
          }
        }
      });
      
      const previousMonthEnrollments = await prisma.enrollment.count({
        where: {
          course: {
            departmentId: dept.id
          },
          createdAt: {
            gte: twoMonthsAgo,
            lt: lastMonth
          }
        }
      });

      // Calculate growth percentage
      const growth = previousMonthEnrollments === 0
        ? '+100%' // If there were no enrollments in the previous period
        : `+${Math.round(((lastMonthEnrollments - previousMonthEnrollments) / previousMonthEnrollments) * 100)}%`;

      return {
        id: dept.id,
        name: dept.name,
        students: studentsCount,
        courses: dept._count.courses,
        avgCompletion,
        avgScore,
        growth: growth.startsWith('-') ? growth : `+${growth.replace('+', '')}`,
      };
    }));

    // Find top performing courses
    const topCoursesData = await prisma.course.findMany({
      include: {
        ratings: true,
        department: true
      },
      take: 10
    });

    // Sort courses by average rating manually
    const sortedCourses = [...topCoursesData].sort((a, b) => {
      const aAvg = a.ratings.length > 0 
        ? a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length 
        : 0;
      const bAvg = b.ratings.length > 0 
        ? b.ratings.reduce((sum, r) => sum + r.rating, 0) / b.ratings.length 
        : 0;
      return bAvg - aAvg; // Descending order
    });

    // Get top 3 and bottom 3 courses
    const topCourses = sortedCourses.slice(0, 3);
    const lowCourses = [...sortedCourses].sort((a, b) => {
      const aAvg = a.ratings.length > 0 
        ? a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length 
        : 0;
      const bAvg = b.ratings.length > 0 
        ? b.ratings.reduce((sum, r) => sum + r.rating, 0) / b.ratings.length 
        : 0;
      return aAvg - bAvg; // Ascending order
    }).slice(0, 3);

    // Transform course data
    const formattedTopCourses = topCourses.map(course => {
      const avgScore = course.ratings.length > 0
        ? Math.round(course.ratings.reduce((acc, r) => acc + r.rating, 0) / course.ratings.length * 20)
        : 0;
      
      return {
        department: course.department.name,
        courseName: course.name,
        score: avgScore
      };
    });

    const formattedLowCourses = lowCourses.map(course => {
      const avgScore = course.ratings.length > 0
        ? Math.round(course.ratings.reduce((acc, r) => acc + r.rating, 0) / course.ratings.length * 20)
        : 0;
      
      return {
        department: course.department.name,
        courseName: course.name,
        score: avgScore
      };
    });

    // Calculate overall statistics
    const totalDepartments = departments.length;
    const avgCoursesPerDepartment = Math.round(departmentsWithStats.reduce((acc, dept) => acc + dept.courses, 0) / totalDepartments * 10) / 10;
    const avgStudentsPerDepartment = Math.round(departmentsWithStats.reduce((acc, dept) => acc + dept.students, 0) / totalDepartments);
    
    // Department with highest average score
    const highestScoringDept = departmentsWithStats.reduce((highest, dept) => 
      dept.avgScore > highest.score 
        ? { name: dept.name, score: dept.avgScore } 
        : highest
    , { name: '', score: 0 });

    const departmentsData = {
      departments: departmentsWithStats,
      topCourses: formattedTopCourses,
      lowCourses: formattedLowCourses,
      totalDepartments,
      avgCoursesPerDepartment,
      avgStudentsPerDepartment,
      highestScoringDepartment: highestScoringDept
    };

    return NextResponse.json(departmentsData);
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department statistics' },
      { status: 500 }
    );
  }
} 