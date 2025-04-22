import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.student) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id: attemptId } = await params;
    
    // Get the quiz attempt with all questions and answers
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: user.student.id,
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        questionAttempts: {
          include: {
            question: true,
            answerAttempts: {
              include: {
                answer: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return new NextResponse(JSON.stringify({ error: "Attempt not found" }), {
        status: 404,
      });
    }

    if (attempt.finishedAt) {
      return new NextResponse(JSON.stringify({ error: "Attempt already finished" }), {
        status: 400,
      });
    }

    // Calculate score
    let totalScore = 0;
    let totalPoints = 0;

    attempt.questionAttempts.forEach(qa => {
      const question = qa.question;
      totalPoints += question.points;

      // Get correct answers for this question
      const correctAnswerIds = new Set(
        attempt.quiz.questions
          .find(q => q.id === question.id)?.answers
          .filter(a => a.isCorrect)
          .map(a => a.id) || []
      );

      // Get student's selected answers
      const selectedAnswerIds = new Set(
        qa.answerAttempts
          .filter(aa => aa.isSelected)
          .map(aa => aa.answer.id)
      );

      // Check if selected answers match correct answers exactly
      const correctAnswersCount = correctAnswerIds.size;
      let studentCorrectCount = 0;

      // Count correct selections
      for (const answerId of selectedAnswerIds) {
        if (correctAnswerIds.has(answerId)) {
          studentCorrectCount++;
        } else {
          // If student selected a wrong answer, they get 0 for this question
          studentCorrectCount = 0;
          break;
        }
      }

      // Award points only if student selected all correct answers and no wrong ones
      if (studentCorrectCount === correctAnswersCount && studentCorrectCount === selectedAnswerIds.size) {
        totalScore += question.points;
      }
    });

    // Update attempt with score and finish time
    const updatedAttempt = await prisma.quizAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        finishedAt: new Date(),
        score: totalScore,
      },
      include: {
        quiz: true,
      },
    });

    // Use the attempt data to check if this is for an assignment
    const assignmentSubmission = await prisma.assignment.findFirst({
      where: {
        quizId: updatedAttempt.quizId,
      },
      include: {
        submissions: {
          where: {
            studentId: user.student.id,
          },
        },
      },
    });

    // If there's an assignment, update or create a submission
    if (assignmentSubmission) {
      if (assignmentSubmission.submissions.length > 0) {
        // Update existing submission
        await prisma.assignmentSubmission.update({
          where: {
            id: assignmentSubmission.submissions[0].id,
          },
          data: {
            quizAttemptId: attemptId,
            submittedAt: new Date(),
          },
        });
      } else {
        // Create new submission
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignmentSubmission.id,
            studentId: user.student.id,
            quizAttemptId: attemptId,
          },
        });
      }
    }

    return NextResponse.json({
      ...updatedAttempt,
      totalPoints,
      percentScore: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
    });
  } catch (error) {
    console.error("[QUIZ_FINISH_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 