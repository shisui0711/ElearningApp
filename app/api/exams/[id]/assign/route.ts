import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { User } from "lucia";
import { NextRequest, NextResponse } from "next/server";

type DifficultyConfig = {
  easy: number;
  medium: number;
  hard: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { id: examId } = await params;
    if (!examId) {
      return new NextResponse(JSON.stringify({ error: "Missing exam ID" }), {
        status: 400,
      });
    }

    // Verify the exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!exam) {
      return new NextResponse(JSON.stringify({ error: "Exam not found" }), {
        status: 404,
      });
    }

    const body = await request.json();
    const {
      type,
      difficultyConfig = { easy: 0, medium: 0, hard: 0 },
      duration = 60,
      showCorrectAnswers = false,
      expirateAt,
      courseId,
      name,
    } = body;

    if (!name) {
      return new NextResponse(JSON.stringify({ error: "Missing exam name" }), {
        status: 400,
      });
    }

    if (
      !type ||
      !["department", "class", "course", "students"].includes(type)
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid assignment type" }),
        {
          status: 400,
        }
      );
    }

    // Handle different assignment types
    switch (type) {
      case "department": {
        const { departmentId } = body;
        if (!departmentId) {
          return new NextResponse(
            JSON.stringify({ error: "Department ID is required" }),
            {
              status: 400,
            }
          );
        }

        // Get all classes in the department
        const departmentClasses = await prisma.class.findMany({
          where: { departmentId },
          select: { id: true },
        });

        if (departmentClasses.length === 0) {
          return new NextResponse(
            JSON.stringify({ error: "No classes found in this department" }),
            {
              status: 400,
            }
          );
        }

        // Create exam attempts for all students in all classes of the department
        await Promise.all(
          departmentClasses.map(async (classItem) => {
            await createExamAttemptsForClass(
              examId,
              classItem.id,
              difficultyConfig,
              duration,
              showCorrectAnswers,
              user,
              name,
              expirateAt,
              courseId
            );
          })
        );

        return NextResponse.json({
          message: "Đã giao bài thi cho tất cả các lớp trong khoa thành công.",
        });
      }

      case "class": {
        const { classId } = body;
        if (!classId) {
          return new NextResponse(
            JSON.stringify({ error: "Mã lớp là bắt buộc" }),
            {
              status: 400,
            }
          );
        }

        await createExamAttemptsForClass(
          examId,
          classId,
          difficultyConfig,
          duration,
          showCorrectAnswers,
          user,
          name,
          expirateAt,
          courseId
        );

        return NextResponse.json({
          message: "Bài kiểm tra đã được giao cho lớp thành công.",
        });
      }

      case "course": {
        const { courseId } = body;
        if (!courseId) {
          return new NextResponse(
            JSON.stringify({ error: "Mã khóa học là bắt buộc" }),
            {
              status: 400,
            }
          );
        }

        // Find all students enrolled in the course
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId },
          select: { studentId: true },
        });

        if (enrollments.length === 0) {
          return new NextResponse(
            JSON.stringify({
              error: "Không có sinh viên nào đăng ký khóa học này",
            }),
            {
              status: 400,
            }
          );
        }

        // Get first student to determine class
        const firstStudent = await prisma.student.findUnique({
          where: { id: enrollments[0].studentId },
          select: { classId: true },
        });

        if (!firstStudent?.classId) {
          return new NextResponse(
            JSON.stringify({
              error: "Không thể xác định lớp cho sinh viên trong khóa học.",
            }),
            {
              status: 400,
            }
          );
        }

        // Get selected questions based on difficulty configuration
        const selectedQuestions = await selectQuestionsByDifficulty(
          examId,
          difficultyConfig
        );

        // Create exam attempts for all enrolled students
        await Promise.all(
          enrollments.map(async (enrollment) => {
            await prisma.examAttempt.create({
              data: {
                examId,
                name,
                studentId: enrollment.studentId,
                courseId,
                classId: firstStudent.classId!, // Use the class of the first student (should be the same for course students)
                duration,
                showCorrectAfter: showCorrectAnswers,
                examAttemptQuestions: {
                  create: selectedQuestions.map(questionId => ({
                    questionId
                  }))
                },
                createdBy: user.id,
                expirateAt,
              },
            });
          })
        );

        return NextResponse.json({
          message:
            "Đã giao bài kiểm tra cho sinh viên trong khóa học thành công",
        });
      }

      case "students": {
        const { studentIds } = body;
        if (
          !studentIds ||
          !Array.isArray(studentIds) ||
          studentIds.length === 0
        ) {
          return new NextResponse(
            JSON.stringify({ error: "Cần phải có ID sinh viên" }),
            {
              status: 400,
            }
          );
        }

        // Get first student to determine class
        const firstStudent = await prisma.student.findUnique({
          where: { id: studentIds[0] },
          select: { classId: true },
        });

        if (!firstStudent?.classId) {
          return new NextResponse(
            JSON.stringify({
              error: "Không thể xác định lớp cho sinh viên đã chọn",
            }),
            {
              status: 400,
            }
          );
        }

        // Get selected questions based on difficulty configuration
        const selectedQuestions = await selectQuestionsByDifficulty(
          examId,
          difficultyConfig
        );

        // Create exam attempts for selected students
        await Promise.all(
          studentIds.map(async (studentId) => {
            await prisma.examAttempt.create({
              data: {
                examId,
                name,
                studentId,
                courseId,
                classId: firstStudent.classId!, // Use the class of the first student
                duration,
                showCorrectAfter: showCorrectAnswers,
                examAttemptQuestions: {
                  create: selectedQuestions.map(questionId => ({
                    questionId
                  }))
                },
                createdBy: user.id,
                expirateAt,
              },
            });
          })
        );

        return NextResponse.json({
          message: `Đã giao bài thi cho ${studentIds.length} sinh viên thành công.`,
        });
      }

      default:
        return new NextResponse(
          JSON.stringify({ error: "Loại bài tập không hợp lệ." }),
          {
            status: 400,
          }
        );
    }
  } catch (error) {
    console.error("[EXAM_ASSIGN_POST]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}

// Helper function to select questions based on difficulty configuration
async function selectQuestionsByDifficulty(
  examId: string,
  difficultyConfig: DifficultyConfig
) {
  // If all difficulty configs are 0, return empty array (use all questions)
  if (
    difficultyConfig.easy === 0 &&
    difficultyConfig.medium === 0 &&
    difficultyConfig.hard === 0
  ) {
    return [];
  }

  // Get all questions from the exam
  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId },
    include: {
      question: true,
    },
  });

  // Group questions by difficulty
  const questionsByDifficulty = {
    EASY: examQuestions
      .filter((q) => q.question.difficulty === "EASY")
      .map((q) => q.questionId),
    MEDIUM: examQuestions
      .filter((q) => q.question.difficulty === "MEDIUM")
      .map((q) => q.questionId),
    HARD: examQuestions
      .filter((q) => q.question.difficulty === "HARD")
      .map((q) => q.questionId),
  };

  // Select random questions based on difficulty configuration
  const selectedQuestions: string[] = [];

  // Helper function to randomly select n items from an array
  const getRandomItems = (arr: string[], n: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  // Select easy questions
  if (difficultyConfig.easy > 0 && questionsByDifficulty.EASY.length > 0) {
    const count = Math.min(
      difficultyConfig.easy,
      questionsByDifficulty.EASY.length
    );
    selectedQuestions.push(
      ...getRandomItems(questionsByDifficulty.EASY, count)
    );
  }

  // Select medium questions
  if (difficultyConfig.medium > 0 && questionsByDifficulty.MEDIUM.length > 0) {
    const count = Math.min(
      difficultyConfig.medium,
      questionsByDifficulty.MEDIUM.length
    );
    selectedQuestions.push(
      ...getRandomItems(questionsByDifficulty.MEDIUM, count)
    );
  }

  // Select hard questions
  if (difficultyConfig.hard > 0 && questionsByDifficulty.HARD.length > 0) {
    const count = Math.min(
      difficultyConfig.hard,
      questionsByDifficulty.HARD.length
    );
    selectedQuestions.push(
      ...getRandomItems(questionsByDifficulty.HARD, count)
    );
  }

  return selectedQuestions;
}

// Helper function to create exam attempts for all students in a class
async function createExamAttemptsForClass(
  examId: string,
  classId: string,
  difficultyConfig: DifficultyConfig,
  duration: number,
  showCorrectAnswers: boolean,
  user: User,
  name: string,
  expirateAt?: Date,
  courseId?: string,
) {
  // Get all students in the class
  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true },
  });

  if (students.length === 0) {
    // No students in this class, but we don't want to throw an error
    return;
  }

  // Get selected questions based on difficulty configuration
  const selectedQuestions = await selectQuestionsByDifficulty(
    examId,
    difficultyConfig
  );

  // Create exam attempts for all students in the class
  await Promise.all(
    students.map(async (student) => {
      await prisma.examAttempt.create({
        data: {
          examId,
          name,
          studentId: student.id,
          classId,
          courseId,
          duration,
          showCorrectAfter: showCorrectAnswers,
          examAttemptQuestions: {
            create: selectedQuestions.map(questionId => ({
              questionId
            }))
          },
          expirateAt,
          createdBy: user.id,
        },
      });
    })
  );
}
