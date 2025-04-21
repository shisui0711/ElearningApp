import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check if the user is a student
    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!student) {
      return new NextResponse(
        JSON.stringify({ error: "Student profile not found" }),
        { status: 404 }
      );
    }

    const { id: attemptId } = params;

    // Check if the attempt exists and belongs to the student
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: student.id,
      },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    answers: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return new NextResponse(
        JSON.stringify({ error: "Exam attempt not found" }),
        { status: 404 }
      );
    }

    // If exam is already finished, don't allow submitting again
    if (attempt.finishedAt) {
      return new NextResponse(
        JSON.stringify({ error: "This exam has already been submitted" }),
        { status: 403 }
      );
    }

    // Calculate the score
    let totalPoints = 0;
    let earnedPoints = 0;

    // Create a map for faster lookup of student answers
    const studentAnswers = attempt.answers.reduce((map, answer) => {
      map[answer.questionId] = answer.answerId;
      return map;
    }, {} as Record<string, string>);

    // Score each question
    for (const examQuestion of attempt.exam.questions) {
      const question = examQuestion.question;
      totalPoints += question.points;

      const selectedAnswerId = studentAnswers[question.id];
      if (selectedAnswerId) {
        // Find if the selected answer is correct
        const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
        if (selectedAnswer && selectedAnswer.isCorrect) {
          earnedPoints += question.points;
        }
      }
    }

    // Update the attempt with the score and mark as finished
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        finishedAt: new Date(),
        score: earnedPoints,
      },
    });

    return NextResponse.json({
      success: true,
      score: earnedPoints,
      totalPoints,
      percentage: Math.round((earnedPoints / totalPoints) * 100),
    });
  } catch (error) {
    console.error("[STUDENT_EXAM_SUBMIT]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 