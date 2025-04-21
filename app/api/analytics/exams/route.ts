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

    // Base filter for date range
    const dateFilter = {
      finishedAt: {
        gte: startDateTime,
        lte: endDateTime
      }
    };

    // Department filter if specified
    const departmentFilter = departmentId ? {
      course: {
        departmentId
      }
    } : {};

    // Combine filters
    const whereFilter = {
      ...dateFilter,
      ...departmentFilter
    };

    // Get overall exam statistics
    const examAttempts = await prisma.examAttempt.count({
      where: whereFilter
    });

    const examScores = await prisma.examAttempt.aggregate({
      where: {
        ...whereFilter,
        score: {
          not: null
        }
      },
      _avg: {
        score: true
      }
    });

    // Calculate passing rate (score >= 60)
    const passingAttempts = await prisma.examAttempt.count({
      where: {
        ...whereFilter,
        score: {
          gte: 60
        }
      }
    });
    
    const passingRate = examAttempts > 0 ? (passingAttempts / examAttempts) * 100 : 0;

    // Get top exams by score
    const topExams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        attempts: {
          select: {
            score: true
          },
          where: {
            finishedAt: {
              gte: startDateTime,
              lte: endDateTime
            },
            score: {
              not: null
            }
          }
        }
      },
      where: {
        attempts: {
          some: {
            finishedAt: {
              gte: startDateTime,
              lte: endDateTime
            }
          }
        }
      }
    });

    // Calculate average scores for each exam
    const examsWithAvgScores = topExams.map(exam => {
      const totalScore = exam.attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
      const avgScore = exam.attempts.length > 0 ? totalScore / exam.attempts.length : 0;
      const passingCount = exam.attempts.filter(attempt => (attempt.score || 0) >= 60).length;
      const passingRate = exam.attempts.length > 0 ? (passingCount / exam.attempts.length) * 100 : 0;
      
      return {
        id: exam.id,
        title: exam.title,
        attempts: exam.attempts.length,
        avgScore: Math.round(avgScore),
        passingRate: Math.round(passingRate)
      };
    });

    // Sort by average score
    const sortedExams = examsWithAvgScores.sort((a, b) => b.avgScore - a.avgScore);

    // Get challenging questions (lowest success rate)
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        content: true,
        points: true,
        studentAnswers: {
          select: {
            answer: {
              select: {
                isCorrect: true
              }
            }
          },
          where: {
            attempt: {
              finishedAt: {
                gte: startDateTime,
                lte: endDateTime
              }
            }
          }
        },
        exams: {
          select: {
            exam: {
              select: {
                title: true
              }
            }
          },
          take: 1
        }
      },
      where: {
        studentAnswers: {
          some: {
            attempt: {
              finishedAt: {
                gte: startDateTime,
                lte: endDateTime
              }
            }
          }
        }
      }
    });

    // Calculate success rate for each question
    const questionsWithSuccessRate = questions.map(question => {
      const totalAnswers = question.studentAnswers.length;
      const correctAnswers = question.studentAnswers.filter(sa => sa.answer.isCorrect).length;
      const successRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
      
      return {
        id: question.id,
        content: question.content,
        exam: question.exams[0]?.exam.title || "Unknown Exam",
        successRate: Math.round(successRate),
        difficulty: getQuestionDifficulty(successRate)
      };
    });

    // Get questions with lowest success rates
    const challengingQuestions = questionsWithSuccessRate
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 10);

    // Return analytics data
    return NextResponse.json({
      overview: {
        examAttempts,
        avgScore: Math.round(examScores._avg.score || 0),
        passingRate: Math.round(passingRate)
      },
      topExams: sortedExams.slice(0, 10),
      challengingQuestions
    });
  } catch (error) {
    console.error("[EXAM_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Helper function to determine question difficulty based on success rate
function getQuestionDifficulty(successRate: number): string {
  if (successRate >= 80) return "Easy";
  if (successRate >= 60) return "Medium";
  if (successRate >= 40) return "Hard";
  return "Very Hard";
} 