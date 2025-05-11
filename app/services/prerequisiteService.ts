import prisma from "@/lib/prisma";

export class PrerequisiteService {
  /**
   * Check if a student has met all prerequisites for a course
   * @param studentId - The ID of the student
   * @param courseId - The ID of the course to check prerequisites for
   * @returns Object containing validation result and details
   */
  static async validatePrerequisites(studentId: string, courseId: string) {
    // Get all prerequisites for the course
    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: { subject: true },
    });

    // If no prerequisites, student can enroll
    if (prerequisites.length === 0) {
      return {
        canEnroll: true,
        missingPrerequisites: [],
      };
    }

    // Check each prerequisite subject
    const missingPrerequisites = [];

    for (const prerequisite of prerequisites) {
      // Find all completed courses from the required subject
      const completedCourses = await prisma.completedLesson.findMany({
        where: {
          studentId,
          course: {
            subjectId: prerequisite.subjectId,
          },
        },
        distinct: ['courseId'],
        select: {
          courseId: true,
          course: {
            select: {
              name: true,
              lessons: {
                select: { id: true },
              },
            },
          },
        },
      });

      // Get all completed lessons for each course
      const validCompletedCourses = [];
      
      for (const completedCourse of completedCourses) {
        // Count the number of lessons in the course
        const totalLessons = completedCourse.course.lessons.length;
        
        // Count how many lessons the student completed in this course
        const completedLessonsCount = await prisma.completedLesson.count({
          where: {
            studentId,
            courseId: completedCourse.courseId,
          },
        });
        
        // Only consider a course completed if all lessons were completed
        if (completedLessonsCount === totalLessons && totalLessons > 0) {
          validCompletedCourses.push(completedCourse);
        }
      }

      // If no courses from this subject were completed, add to missing prerequisites
      if (validCompletedCourses.length === 0) {
        missingPrerequisites.push({
          prerequisiteId: prerequisite.id,
          subjectId: prerequisite.subjectId,
          subjectName: prerequisite.subject.name,
          description: prerequisite.description,
        });
      }
    }

    return {
      canEnroll: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  }

  /**
   * Get all courses where a student has completed all lessons
   * @param studentId - The ID of the student
   * @returns Array of completed course IDs
   */
  static async getCompletedCourses(studentId: string) {
    // Get all courses where the student has at least one completed lesson
    const coursesWithCompletedLessons = await prisma.completedLesson.findMany({
      where: {
        studentId,
      },
      distinct: ['courseId'],
      select: {
        courseId: true,
        course: {
          select: {
            id: true,
            name: true,
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Filter to only include fully completed courses
    const completedCourses = [];

    for (const courseEntry of coursesWithCompletedLessons) {
      const course = courseEntry.course;
      const totalLessons = course.lessons.length;
      
      // Count completed lessons for this course
      const completedLessonsCount = await prisma.completedLesson.count({
        where: {
          studentId,
          courseId: course.id,
        },
      });

      // If all lessons are completed, add to completed courses
      if (completedLessonsCount === totalLessons && totalLessons > 0) {
        completedCourses.push(course.id);
      }
    }

    return completedCourses;
  }
} 