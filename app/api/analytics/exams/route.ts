import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== UserRole.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const departmentFilter = departmentId ? { departmentId } : {};

    const totalExams = await prisma.exam.count();
    const totalAttempts = await prisma.examAttempt.count();

    const avgScoreData = await prisma.examAttempt.aggregate({
      _avg: {
        score: true,
      },
    });
    const avgScore = Math.round(avgScoreData._avg.score || 0);

    const passingAttempts = await prisma.examAttempt.count({
      where: {
        score: {
          gte: 60,
        },
      },
    });
    const passingRate =
      totalAttempts > 0
        ? Math.round((passingAttempts / totalAttempts) * 100)
        : 0;

    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const previousMonthAvgScore = await prisma.examAttempt.aggregate({
      _avg: {
        score: true,
      },
      where: {
        createdAt: {
          lt: previousMonth,
        },
      },
    });
    const avgScoreChange = Math.round(
      (avgScoreData._avg.score || 0) - (previousMonthAvgScore._avg.score || 0)
    );

    // Calculate passing rate change
    const previousMonthAttempts = await prisma.examAttempt.count({
      where: {
        createdAt: {
          lt: previousMonth,
        },
      },
    });
    
    const previousMonthPassingAttempts = await prisma.examAttempt.count({
      where: {
        score: {
          gte: 60,
        },
        createdAt: {
          lt: previousMonth,
        },
      },
    });
    
    const previousMonthPassingRate = previousMonthAttempts > 0
      ? Math.round((previousMonthPassingAttempts / previousMonthAttempts) * 100)
      : 0;
    
    const passingRateChange = passingRate - previousMonthPassingRate;

    const attemptsChange = totalAttempts - previousMonthAttempts;

    const examDetails = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        attempts: {
          select: {
            id: true,
            score: true,
          },
        },
      },
      orderBy: {
        attempts: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const formattedExamDetails = examDetails.map((exam) => {
      const attemptCount = exam.attempts.length;
      const avgExamScore =
        attemptCount > 0
          ? Math.round(
              exam.attempts.reduce(
                (sum, attempt) => sum + (attempt.score || 1),
                0
              ) / attemptCount
            )
          : 0;
      const passingAttempts = exam.attempts.filter(
        (attempt) => (attempt.score || 1) >= 60
      ).length;
      const examPassingRate =
        attemptCount > 0
          ? Math.round((passingAttempts / attemptCount) * 100)
          : 0;

      return {
        id: exam.id,
        name: exam.title,
        avgScore: avgExamScore,
        attempts: attemptCount,
        passingRate: examPassingRate,
      };
    });

    const scoreDistribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];

    const attemptsByScore = await prisma.examAttempt.findMany({
      select: {
        score: true,
      },
    });

    attemptsByScore.forEach((attempt) => {
      const score = attempt.score;
      if (!score) return;
      if (score <= 20) scoreDistribution[0].count++;
      else if (score <= 40) scoreDistribution[1].count++;
      else if (score <= 60) scoreDistribution[2].count++;
      else if (score <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    const studentAnswerData = await prisma.studentAnswer.findMany({
      include: {
        answer: {
          select: {
            isCorrect: true,
          },
        },
        question: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    const questionStats = new Map<string, { correct: number; total: number; content: string }>();

    studentAnswerData.forEach((answer) => {
      const { questionId } = answer;
      const isCorrect = answer.answer.isCorrect ? 1 : 0;

      if (!questionStats.has(questionId)) {
        questionStats.set(questionId, {
          correct: 0,
          total: 0,
          content: answer.question.content,
        });
      }

      const stats = questionStats.get(questionId);
      if (stats) {
        stats.correct += isCorrect;
        stats.total += 1;
        questionStats.set(questionId, stats);
      }
    });

    // Calculate overall question accuracy
    let totalCorrectAnswers = 0;
    let totalAnswers = 0;
    questionStats.forEach((stats) => {
      totalCorrectAnswers += stats.correct;
      totalAnswers += stats.total;
    });

    const questionAccuracy = totalAnswers > 0
      ? Math.round((totalCorrectAnswers / totalAnswers) * 100)
      : 0;

    // Calculate question accuracy change
    const previousMonthAnswers = await prisma.studentAnswer.findMany({
      where: {
        attempt: {
          createdAt: {
            lt: previousMonth,
          }
        }
      },
      include: {
        answer: {
          select: {
            isCorrect: true,
          },
        }
      }
    });

    let previousMonthCorrect = 0;
    previousMonthAnswers.forEach(answer => {
      if (answer.answer && answer.answer.isCorrect) {
        previousMonthCorrect += 1;
      }
    });

    const previousMonthAccuracy = previousMonthAnswers.length > 0
      ? Math.round((previousMonthCorrect / previousMonthAnswers.length) * 100)
      : 0;

    const questionAccuracyChange = questionAccuracy - previousMonthAccuracy;

    const difficultQuestions = Array.from(questionStats.entries())
      .map(([questionId, stats]) => ({
        questionId,
        text: stats.content,
        correctRate:
          stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        total: stats.total,
      }))
      .filter((q) => q.total >= 5)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 5);

    const questionsWithExams = await Promise.all(
      difficultQuestions.map(async (question) => {
        const examQuestion = await prisma.examQuestion.findFirst({
          where: { questionId: question.questionId },
          include: { exam: true },
        });

        return {
          ...question,
          exam: examQuestion?.exam?.title || "Không xác định",
          difficulty:
            question.correctRate < 50
              ? "Hard"
              : question.correctRate < 70
              ? "Medium"
              : "Easy",
        };
      })
    );

    const now = new Date();
    const tenWeeksAgo = new Date(now);
    tenWeeksAgo.setDate(now.getDate() - 70);

    const weeks: Array<{
      week: string;
      startDate: Date;
      endDate: Date;
      completion: number;
      count: number;
    }> = [];

    for (let i = 0; i < 10; i++) {
      const week = new Date(tenWeeksAgo);
      week.setDate(week.getDate() + i * 7);
      const endDate = new Date(week);
      endDate.setDate(week.getDate() + 6);

      weeks.push({
        week: `Week ${i + 1}`,
        startDate: new Date(week),
        endDate: endDate,
        completion: 0,
        count: 0,
      });
    }

    const weeklyAttempts = await prisma.examAttempt.findMany({
      where: {
        createdAt: {
          gte: tenWeeksAgo,
        },
      },
      select: {
        createdAt: true,
        score: true,
      },
    });

    weeklyAttempts.forEach((attempt) => {
      const date = new Date(attempt.createdAt);
      const weekIndex = weeks.findIndex(
        (w) => date >= w.startDate && date <= w.endDate
      );

      if (weekIndex !== -1 && attempt.score) {
        weeks[weekIndex].completion += attempt.score;
        weeks[weekIndex].count++;
      }
    });

    const performanceTrend = weeks.map((w) => ({
      name: w.week,
      completion: w.count > 0 ? Math.round(w.completion / w.count) : 0,
    }));

    return NextResponse.json({
      overview: {
        avgScore,
        totalExams,
        totalAttempts,
        passingRate,
        avgScoreChange,
        attemptsChange,
        passingRateChange,
        questionAccuracy,
        questionAccuracyChange
      },
      examDetails: formattedExamDetails,
      scoreDistribution,
      difficultQuestions: questionsWithExams,
      performanceTrend,
    });
  } catch (error) {
    console.error("[EXAMS_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
