"use server";

import { redirect, notFound } from "next/navigation";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import QuizAttemptClient from "./QuizAttemptClient";

interface QuizPageProps {
  params: {
    id: string;
    attemptId: string;
  };
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id: assignmentId, attemptId } = params;
  const { user } = await validateRequest();

  if (!user || !user.student) {
    return redirect("/login");
  }

  // Get quiz attempt information
  const quizAttempt = await prisma.quizAttempt.findUnique({
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
            orderBy: {
              order: "asc",
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

  if (!quizAttempt) {
    return notFound();
  }

  // If the quiz attempt is already finished, redirect to results page
  if (quizAttempt.finishedAt) {
    return redirect(`/assignment/${assignmentId}/quiz-result/${attemptId}`);
  }

  // Get the assignment to verify it's a quiz assignment
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
      quizId: quizAttempt.quizId,
    },
    include: {
      submissions: {
        where: {
          studentId: user.student.id,
          quizAttemptId: attemptId,
        },
      },
    },
  });

  if (!assignment) {
    return notFound();
  }

  // Format the quiz data for the client component
  const formattedQuiz = {
    id: quizAttempt.quiz.id,
    title: quizAttempt.quiz.title,
    timeLimit: quizAttempt.quiz.timeLimit,
    questions: quizAttempt.quiz.questions.map(question => {
      const questionAttempt = quizAttempt.questionAttempts.find(
        qa => qa.questionId === question.id
      );

      return {
        id: question.id,
        content: question.content,
        answers: question.answers.map(answer => {
          const answerAttempt = questionAttempt?.answerAttempts.find(
            aa => aa.answerId === answer.id
          );

          return {
            id: answer.id,
            content: answer.content,
            isSelected: answerAttempt?.isSelected || false,
          };
        }),
      };
    }),
  };

  return (
    <QuizAttemptClient
      attemptId={attemptId}
      assignmentId={assignmentId}
      quiz={formattedQuiz}
    />
  );
} 