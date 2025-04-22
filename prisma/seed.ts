
import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "crypto";


function encryptSha256(text: string) {
  const hash = createHash('sha256');

  // Update the hash object with the input text
  hash.update(text);

  // Calculate the hash digest in hexadecimal format
  const digest = hash.digest('hex');

  // Return the hash digest
  return digest;
}

const prisma = new PrismaClient();

// Hàm để tạo ngày ngẫu nhiên trong phạm vi
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Hàm để tạo điểm ngẫu nhiên
function randomScore(min = 40, max = 100) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function main() {
  console.log("Bắt đầu seeding dữ liệu...");

  // Tạo dữ liệu phòng ban
  const departments = [
    { name: "Công nghệ thông tin" },
    { name: "Công nghệ may" },
    { name: "Kinh tế" },
    { name: "Ngôn ngữ Anh" },
    { name: "Sư phạm" }
  ];

  // Tạo các phòng ban
  for (const deptData of departments) {
    const existingDept = await prisma.department.findFirst({
      where: { name: deptData.name }
    });

    if (!existingDept) {
      await prisma.department.create({
        data: deptData
      });
      console.log(`Đã tạo phòng ban: ${deptData.name}`);
    }
  }

  // Lấy IDs của các phòng ban
  const deptIds = await prisma.department.findMany({
    select: { id: true }
  });

  // Tạo tài khoản admin nếu chưa có
  const adminExists = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN }
  });

  if (!adminExists) {
    const passwordHash = encryptSha256("123456");
    await prisma.user.create({
      data: {
        username: "admin",
        displayName: "Administrator",
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        passwordHash,
        role: UserRole.ADMIN
      }
    });
    console.log("Đã tạo tài khoản admin");
  }

  // Tạo các giáo viên (5 giáo viên cho mỗi khoa)
  const teacherCount = await prisma.teacher.count();
  if (teacherCount < 25) {
    for (let i = 0; i < 25; i++) {
      const deptId = deptIds[i % 5].id;
      const teacherNumber = i + 1;

      // Tạo user trước
      const passwordHash = encryptSha256(`123456`);
      const createdAt = randomDate(new Date(2023, 0, 1), new Date());

      const user = await prisma.user.create({
        data: {
          username: `teacher${teacherNumber}`,
          displayName: `Teacher ${teacherNumber}`,
          firstName: `First${teacherNumber}`,
          lastName: `Last${teacherNumber}`,
          email: `teacher${teacherNumber}@example.com`,
          passwordHash,
          role: UserRole.TEACHER,
          createdAt
        }
      });

      // Tạo teacher
      await prisma.teacher.create({
        data: {
          userId: user.id,
          degree: ["Thạc sĩ", "Tiến sĩ", "Giáo sư"][Math.floor(Math.random() * 3)]
        }
      });

      console.log(`Đã tạo giáo viên: ${user.username}`);
    }
  }

  // Tạo 5 lớp học cho mỗi khoa
  const classCount = await prisma.class.count();
  if (classCount < 25) {
    for (let i = 0; i < 25; i++) {
      const deptId = deptIds[i % 5].id;
      const classNumber = i + 1;

      await prisma.class.create({
        data: {
          name: `Class ${classNumber}`,
          departmentId: deptId
        }
      });

      console.log(`Đã tạo lớp học: Class ${classNumber}`);
    }
  }

  // Lấy danh sách lớp học
  const classes = await prisma.class.findMany();

  // Tạo sinh viên (200 sinh viên phân bổ cho các lớp)
  const studentCount = await prisma.student.count();
  if (studentCount < 200) {
    for (let i = 0; i < 200; i++) {
      const classId = classes[i % classes.length].id;
      const studentNumber = i + 1;

      // Tạo user trước
      const passwordHash = encryptSha256("123456");
      const createdAt = randomDate(new Date(2023, 0, 1), new Date());

      const user = await prisma.user.create({
        data: {
          username: `student${studentNumber}`,
          displayName: `Student ${studentNumber}`,
          firstName: `First${studentNumber}`,
          lastName: `Last${studentNumber}`,
          email: `student${studentNumber}@example.com`,
          passwordHash,
          role: UserRole.STUDENT,
          createdAt
        }
      });

      // Tạo student
      await prisma.student.create({
        data: {
          userId: user.id,
          classId
        }
      });

      if (i % 20 === 0) {
        console.log(`Đã tạo ${i} sinh viên`);
      }
    }
    console.log("Đã tạo xong sinh viên");
  }

  // Tạo khóa học (3 khóa học cho mỗi giáo viên)
  const teachers = await prisma.teacher.findMany();
  const courseCount = await prisma.course.count();

  if (courseCount < 75) {
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const deptId = deptIds[i % 5].id;

      for (let j = 0; j < 3; j++) {
        const courseNumber = i * 3 + j + 1;
        await prisma.course.create({
          data: {
            name: `Course ${courseNumber}`,
            description: `Description for course ${courseNumber}`,
            teacherId: teacher.id,
            departmentId: deptId
          }
        });
      }
    }
    console.log("Đã tạo xong khóa học");
  }

  // Đăng ký khóa học cho sinh viên (3-5 khóa học mỗi sinh viên)
  const students = await prisma.student.findMany();
  const courses = await prisma.course.findMany();

  const enrollmentCount = await prisma.enrollment.count();
  if (enrollmentCount < 600) {
    // Xóa đăng ký cũ nếu có
    await prisma.enrollment.deleteMany({});

    for (const student of students) {
      // Mỗi sinh viên đăng ký 3-5 khóa học
      const numCourses = Math.floor(Math.random() * 3) + 3;
      const shuffledCourses = [...courses].sort(() => 0.5 - Math.random());
      const selectedCourses = shuffledCourses.slice(0, numCourses);

      for (const course of selectedCourses) {
        const enrollmentDate = randomDate(new Date(2023, 0, 1), new Date());
        
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            courseId: course.id,
            createdAt: enrollmentDate
          }
        });

        // Cập nhật lại quan hệ nhiều-nhiều
        await prisma.student.update({
          where: { id: student.id },
          data: {
            enrolledCourses: {
              connect: { id: course.id }
            }
          }
        });
      }
    }
    console.log("Đã tạo xong đăng ký khóa học");
  }

  // Tạo bài học cho mỗi khóa học (5-10 bài học mỗi khóa)
  const lessonCount = await prisma.lesson.count();
  if (lessonCount < 500) {
    for (const course of courses) {
      const numLessons = Math.floor(Math.random() * 6) + 5; // 5-10 lessons
      
      for (let i = 0; i < numLessons; i++) {
        await prisma.lesson.create({
          data: {
            title: `Lesson ${i + 1} for ${course.name}`,
            description: `Description for lesson ${i + 1}`,
            position: i + 1,
            courseId: course.id
          }
        });
      }
    }
    console.log("Đã tạo xong bài học");
  }

  // Tạo hoàn thành bài học cho sinh viên (dữ liệu cho biểu đồ hoàn thành)
  const lessons = await prisma.lesson.findMany();
  const completedLessonCount = await prisma.completedLesson.count();

  if (completedLessonCount < 2000) {
    // Xóa dữ liệu hoàn thành cũ nếu có
    await prisma.completedLesson.deleteMany({});

    for (const student of students) {
      // Lấy khóa học mà sinh viên đã đăng ký
      const enrolledCourses = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        select: { courseId: true }
      });

      // Lấy bài học từ các khóa học đã đăng ký
      const enrolledLessons = await prisma.lesson.findMany({
        where: {
          courseId: {
            in: enrolledCourses.map(ec => ec.courseId)
          }
        }
      });

      // Hoàn thành ngẫu nhiên 40-80% bài học
      const completionPercentage = Math.random() * 0.4 + 0.4; // 40-80%
      const lessonsToComplete = Math.floor(enrolledLessons.length * completionPercentage);
      const shuffledLessons = [...enrolledLessons].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < lessonsToComplete; i++) {
        if (i < shuffledLessons.length) {
          await prisma.completedLesson.create({
            data: {
              studentId: student.id,
              lessonId: shuffledLessons[i].id
            }
          });
        }
      }
    }
    console.log("Đã tạo xong dữ liệu hoàn thành bài học");
  }

  // Tạo bài thi
  const examCount = await prisma.exam.count();
  if (examCount < 30) {
    for (let i = 0; i < 30; i++) {
      await prisma.exam.create({
        data: {
          title: `Exam ${i + 1}`,
          duration: Math.floor(Math.random() * 60) + 30, // 30-90 phút
          showCorrectAfter: Math.random() > 0.5
        }
      });
    }
    console.log("Đã tạo xong bài thi");
  }

  // Tạo câu hỏi cho bài thi
  const exams = await prisma.exam.findMany();
  const questionCount = await prisma.question.count();

  if (questionCount < 300) {
    for (const exam of exams) {
      // 8-12 câu hỏi mỗi bài thi
      const numQuestions = Math.floor(Math.random() * 5) + 8;
      
      for (let i = 0; i < numQuestions; i++) {
        // Tạo câu hỏi
        const question = await prisma.question.create({
          data: {
            content: `Câu ${i + 1} for ${exam.title}`,
            imageUrl: null,
            points: Math.floor(Math.random() * 5) + 1 // 1-5 điểm
          }
        });

        // Kết nối câu hỏi với bài thi
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionId: question.id,
            order: i + 1
          }
        });

        // Tạo 4 câu trả lời cho mỗi câu hỏi (1 đúng, 3 sai)
        const correctAnswerIndex = Math.floor(Math.random() * 4);
        
        for (let j = 0; j < 4; j++) {
          await prisma.answer.create({
            data: {
              content: `Answer ${j + 1} for question ${i + 1}`,
              isCorrect: j === correctAnswerIndex,
              questionId: question.id
            }
          });
        }
      }
    }
    console.log("Đã tạo xong câu hỏi và câu trả lời");
  }

  // Tạo lần thi cho sinh viên
  const examAttemptCount = await prisma.examAttempt.count();
  if (examAttemptCount < 500) {
    // Xóa dữ liệu thi cũ nếu có
    await prisma.examAttempt.deleteMany({});
    await prisma.studentAnswer.deleteMany({});
    await prisma.markedQuestion.deleteMany({});

    // Tạo dữ liệu thi mới
    for (let i = 0; i < 500; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const exam = exams[Math.floor(Math.random() * exams.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];
      const classObj = classes[Math.floor(Math.random() * classes.length)];
      
      // Thời gian thi
      const startDate = randomDate(new Date(2023, 3, 1), new Date());
      const finishDate = new Date(startDate);
      finishDate.setMinutes(finishDate.getMinutes() + exam.duration + Math.floor(Math.random() * 30));
      
      // Điểm thi (40-100)
      const score = randomScore();
      
      // Tạo lần thi
      const attempt = await prisma.examAttempt.create({
        data: {
          studentId: student.id,
          examId: exam.id,
          courseId: course.id,
          classId: classObj.id,
          startedAt: startDate,
          finishedAt: finishDate,
          score,
          createdAt: startDate
        }
      });

      // Lấy câu hỏi của bài thi
      const examQuestions = await prisma.examQuestion.findMany({
        where: { examId: exam.id },
        include: { question: true }
      });

      // Tạo câu trả lời của sinh viên
      for (const eq of examQuestions) {
        // Lấy tất cả câu trả lời cho câu hỏi này
        const answers = await prisma.answer.findMany({
          where: { questionId: eq.questionId }
        });

        // Xác định xem sinh viên trả lời đúng hay sai (tỉ lệ đúng phụ thuộc vào điểm số)
        const correctProbability = score / 100;
        const answeredCorrectly = Math.random() < correctProbability;
        
        // Nếu trả lời đúng, chọn câu trả lời đúng
        // Nếu trả lời sai, chọn một câu trả lời sai
        let selectedAnswer;
        if (answeredCorrectly) {
          selectedAnswer = answers.find(a => a.isCorrect);
        } else {
          const incorrectAnswers = answers.filter(a => !a.isCorrect);
          selectedAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
        }

        if (selectedAnswer) {
          // Tạo câu trả lời của sinh viên
          await prisma.studentAnswer.create({
            data: {
              attemptId: attempt.id,
              questionId: eq.questionId,
              answerId: selectedAnswer.id
            }
          });

          // Tạo đánh giá câu hỏi
          await prisma.markedQuestion.create({
            data: {
              attemptId: attempt.id,
              questionId: eq.questionId
            }
          });
        }
      }

      if (i % 50 === 0) {
        console.log(`Đã tạo ${i} lần thi`);
      }
    }
    console.log("Đã tạo xong dữ liệu thi");
  }

  console.log("Hoàn thành seeding dữ liệu!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 