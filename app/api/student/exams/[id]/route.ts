import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
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

    const { id: attemptId } = await params;

    // Get the exam attempt with related exam questions
    const examAttempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
        studentId: student.id, // Ensure this attempt belongs to the student
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
            showCorrectAfter: true,
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    content: true,
                    points: true,
                    imageUrl: true,
                    videoUrl: true,
                    answers: {
                      select: {
                        id: true,
                        content: true,
                        // Only include isCorrect if the exam is completed and showCorrectAfter is true
                        ...(request.nextUrl.searchParams.get("completed") === "true" ? { isCorrect: true } : {})
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        answers: {
          select: {
            answerId: true,
            questionId: true,
            question: true
          },
        },
      },
    });

    if (!examAttempt) {
      return new NextResponse(
        JSON.stringify({ error: "Exam attempt not found" }),
        { status: 404 }
      );
    }

    const isCompleted = request.nextUrl.searchParams.get("completed") === "true";

    // If exam is already finished, don't allow access without the "completed" flag
    if (examAttempt.finishedAt && !isCompleted) {
      return new NextResponse(
        JSON.stringify({ error: "This exam has already been completed" }),
        { status: 403 }
      );
    }

    // If exam is not finished, don't allow viewing results
    if (!examAttempt.finishedAt && isCompleted) {
      return new NextResponse(
        JSON.stringify({ error: "You cannot view results until you complete the exam" }),
        { status: 403 }
      );
    }

    // Format the response
    const questions = examAttempt.exam.questions.map((eq) => ({
      id: eq.question.id,
      content: eq.question.content,
      points: eq.question.points,
      imageUrl: eq.question.imageUrl,
      videoUrl: eq.question.videoUrl,
      answers: eq.question.answers,
    }));

    // Create a map of saved answers
    const savedAnswers: Record<string, string> = {};
    examAttempt.answers.forEach((answer) => {
      savedAnswers[answer.questionId] = answer.answerId;
    });

    // Get previously marked questions if any
    const markedQuestions = await prisma.markedQuestion.findMany({
      where: {
        attemptId: examAttempt.id,
      },
      select: {
        questionId: true,
      },
    });

    const response = {
      id: examAttempt.id,
      startedAt: examAttempt.startedAt,
      finishedAt: examAttempt.finishedAt,
      score: examAttempt.score,
      title: examAttempt.exam.title,
      duration: examAttempt.exam.duration,
      showCorrectAfter: examAttempt.exam.showCorrectAfter,
      questions: questions,
      savedAnswers: savedAnswers,
      markedQuestions: markedQuestions.map(mq => mq.questionId),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[STUDENT_EXAM_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 