import { PrismaClient, UserRole, AssignmentType } from "@prisma/client";
import { createHash } from "crypto";

// Password encryption function using SHA-256
function encryptSha256(text: string) {
  const hash = createHash("sha256");
  hash.update(text);
  return hash.digest("hex");
}

const prisma = new PrismaClient();

// Helper function to generate random date within a range
function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper function to generate random score
function randomScore(min = 40, max = 100) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Helper function to pick random items from an array
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log("Starting database seeding process...");

  try {
    // ==================== Create Departments ====================
    console.log("Creating departments...");
    const departments = [
      { name: "Computer Science" },
      { name: "Fashion Technology" },
      { name: "Economics" },
      { name: "English Language" },
      { name: "Education" },
    ];

    for (const deptData of departments) {
      const existingDept = await prisma.department.findFirst({
        where: { name: deptData.name },
      });

      if (!existingDept) {
        await prisma.department.create({
          data: deptData,
        });
        console.log(`Created department: ${deptData.name}`);
      }
    }

    // Get department IDs for reference
    const deptIds = await prisma.department.findMany({
      select: { id: true },
    });

    // ==================== Create Admin Account ====================
    console.log("Creating admin account...");
    const adminExists = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (!adminExists) {
      const passwordHash = encryptSha256("admin123");
      await prisma.user.create({
        data: {
          username: "admin",
          displayName: "System Administrator",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          passwordHash,
          role: UserRole.ADMIN,
          bio: "System administrator with full access privileges",
          location: "Main Campus",
        },
      });
      console.log("Admin account created");
    }

    // ==================== Create Forum Categories ====================
    console.log("Creating forum categories...");
    const forumCategories = [
      { name: "General Discussion", description: "Talk about anything related to the school" },
      { name: "Academic Help", description: "Get help with your studies" },
      { name: "Campus Life", description: "Discuss campus events and activities" },
      { name: "Career Development", description: "Job opportunities and career advice" },
      { name: "Technical Support", description: "Get help with technical issues" },
    ];

    for (const category of forumCategories) {
      const existingCategory = await prisma.forumCategory.findFirst({
        where: { name: category.name },
      });

      if (!existingCategory) {
        await prisma.forumCategory.create({
          data: category,
        });
        console.log(`Created forum category: ${category.name}`);
      }
    }

    // ==================== Create Subjects ====================
    console.log("Creating subjects...");
    const subjectsByDepartment = [
      // Computer Science subjects
      [
        { name: "Programming Fundamentals", description: "Introduction to programming concepts" },
        { name: "Data Structures & Algorithms", description: "Advanced data structures and algorithms" },
        { name: "Database Systems", description: "Design and implementation of database systems" },
        { name: "Web Development", description: "Modern web technologies and frameworks" },
        { name: "Artificial Intelligence", description: "Introduction to AI concepts and algorithms" },
      ],
      // Fashion Technology subjects
      [
        { name: "Textile Design", description: "Principles of textile design and production" },
        { name: "Fashion Illustration", description: "Techniques for fashion sketching and illustration" },
        { name: "Garment Construction", description: "Fundamentals of garment making" },
        { name: "Fashion Marketing", description: "Marketing strategies for fashion products" },
        { name: "Sustainable Fashion", description: "Eco-friendly practices in fashion design" },
      ],
      // Economics subjects
      [
        { name: "Microeconomics", description: "Study of individual economic agents" },
        { name: "Macroeconomics", description: "Study of economy-wide phenomena" },
        { name: "International Trade", description: "Principles of global trade and finance" },
        { name: "Econometrics", description: "Statistical methods for economic data analysis" },
        { name: "Development Economics", description: "Economic growth in developing countries" },
      ],
      // English Language subjects
      [
        { name: "English Literature", description: "Study of classic and contemporary literature" },
        { name: "Academic Writing", description: "Advanced techniques for academic writing" },
        { name: "Public Speaking", description: "Effective communication and presentation skills" },
        { name: "Linguistics", description: "Scientific study of language structure" },
        { name: "Creative Writing", description: "Fiction, poetry, and creative non-fiction" },
      ],
      // Education subjects
      [
        { name: "Educational Psychology", description: "Understanding how students learn" },
        { name: "Curriculum Development", description: "Designing effective educational curricula" },
        { name: "Classroom Management", description: "Strategies for effective teaching" },
        { name: "Educational Technology", description: "Technology tools for modern classrooms" },
        { name: "Special Education", description: "Working with diverse learning needs" },
      ],
    ];

    for (let i = 0; i < deptIds.length; i++) {
      const deptId = deptIds[i].id;
      const subjects = subjectsByDepartment[i];

      for (const subject of subjects) {
        const existingSubject = await prisma.subject.findFirst({
          where: { name: subject.name, departmentId: deptId },
        });

        if (!existingSubject) {
          await prisma.subject.create({
            data: {
              ...subject,
              departmentId: deptId,
            },
          });
          console.log(`Created subject: ${subject.name}`);
        }
      }
    }

    // ==================== Create Classes ====================
    console.log("Creating classes...");
    const classCount = await prisma.class.count();
    
    if (classCount < 25) {
      for (let i = 0; i < 25; i++) {
        const deptId = deptIds[i % 5].id;
        const classYear = 2023 + Math.floor(i / 5);
        const classSuffix = String.fromCharCode(65 + (i % 5)); // A, B, C, D, E
        
        await prisma.class.create({
          data: {
            name: `${classYear}-${classSuffix}`,
            departmentId: deptId,
          },
        });
        console.log(`Created class: ${classYear}-${classSuffix}`);
      }
    }

    // Get classes for reference
    const classes = await prisma.class.findMany();

    // ==================== Create Teachers ====================
    console.log("Creating teachers...");
    const teacherCount = await prisma.teacher.count();
    
    if (teacherCount < 25) {
      const degrees = ["Master's", "Ph.D.", "Professor"];
      const locations = ["Main Campus", "East Wing", "West Wing", "North Building", "South Building"];
      const bios = [
        "Experienced educator with a passion for innovative teaching methods",
        "Researcher and instructor with industry experience",
        "Award-winning teacher with publications in leading journals",
        "Dedicated mentor focused on student success",
        "Teaching professional with interdisciplinary expertise"
      ];
      
      for (let i = 0; i < 25; i++) {
        const deptIndex = i % 5;
        const teacherNumber = i + 1;
        const deptId = deptIds[deptIndex].id;
        
        // Create user record
        const passwordHash = encryptSha256("teacher123");
        const createdAt = randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31));
        
        const firstName = `Teacher${teacherNumber}First`;
        const lastName = `${teacherNumber}Last`;
        const displayName = `${firstName} ${lastName}`;
        
        const user = await prisma.user.create({
          data: {
            username: `teacher${teacherNumber}`,
            displayName,
            firstName,
            lastName,
            email: `teacher${teacherNumber}@example.edu`,
            passwordHash,
            role: UserRole.TEACHER,
            location: locations[Math.floor(Math.random() * locations.length)],
            bio: bios[Math.floor(Math.random() * bios.length)],
            createdAt,
            avatarUrl: `https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${(i % 70) + 1}.jpg`,
          },
        });
        
        // Create teacher record
        await prisma.teacher.create({
          data: {
            userId: user.id,
            degree: degrees[Math.floor(Math.random() * degrees.length)],
          },
        });
        
        console.log(`Created teacher: ${displayName}`);
      }
    }

    // Get teachers for reference
    const teachers = await prisma.teacher.findMany({
      include: { user: true }
    });

    // ==================== Create Students ====================
    console.log("Creating students...");
    const studentCount = await prisma.student.count();
    
    if (studentCount < 200) {
      const locations = ["On Campus", "Off Campus", "International Residence", "City Center", "Suburban Area"];
      const bios = [
        "Hard-working student with interests in multiple disciplines",
        "Passionate learner focusing on research opportunities",
        "Active student involved in campus activities",
        "Seeking to apply classroom knowledge to real-world problems",
        "Dedicated student with a focus on academic excellence"
      ];
      
      for (let i = 0; i < 200; i++) {
        const classId = classes[i % classes.length].id;
        const studentNumber = i + 1;
        
        // Create user record
        const passwordHash = encryptSha256("student123");
        const createdAt = randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31));
        
        const firstName = `Student${studentNumber}First`;
        const lastName = `${studentNumber}Last`;
        const displayName = `${firstName} ${lastName}`;
        
        const user = await prisma.user.create({
          data: {
            username: `student${studentNumber}`,
            displayName,
            firstName,
            lastName,
            email: `student${studentNumber}@example.edu`,
            passwordHash,
            role: UserRole.STUDENT,
            location: locations[Math.floor(Math.random() * locations.length)],
            bio: bios[Math.floor(Math.random() * bios.length)],
            createdAt,
            avatarUrl: `https://randomuser.me/api/portraits/${i % 2 ? 'women' : 'men'}/${(i % 70) + 30}.jpg`,
          },
        });
        
        // Create student record
        await prisma.student.create({
          data: {
            userId: user.id,
            classId,
          },
        });
        
        if (i % 20 === 0) {
          console.log(`Created ${i} students`);
        }
      }
      console.log("Student creation completed");
    }

    // Get students for reference
    const students = await prisma.student.findMany({
      include: { user: true }
    });

    // ==================== Create Courses ====================
    console.log("Creating courses...");
    const subjects = await prisma.subject.findMany();
    const courseCount = await prisma.course.count();
    
    if (courseCount < 75) {
      for (let i = 0; i < teachers.length; i++) {
        const teacher = teachers[i];
        const deptIndex = i % 5;
        const deptId = deptIds[deptIndex].id;
        
        // Find subjects for this department
        const deptSubjects = subjects.filter(s => s.departmentId === deptId);
        
        for (let j = 0; j < 3; j++) {
          const courseNumber = i * 3 + j + 1;
          const randomSubject = deptSubjects[Math.floor(Math.random() * deptSubjects.length)];
          
          await prisma.course.create({
            data: {
              name: `Course ${courseNumber}: Advanced ${randomSubject.name}`,
              description: `In-depth exploration of ${randomSubject.name} concepts and applications`,
              teacherId: teacher.id,
              departmentId: deptId,
              subjectId: randomSubject.id,
              imageUrl: `https://picsum.photos/seed/${courseNumber}/800/600`,
              createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
              createdBy: teacher.userId,
            },
          });
          
          console.log(`Created course: Course ${courseNumber}`);
        }
      }
    }

    // Get courses for reference
    const courses = await prisma.course.findMany();

    // ==================== Create Course Enrollments ====================
    console.log("Creating course enrollments...");
    const enrollmentCount = await prisma.enrollment.count();
    
    if (enrollmentCount < 600) {
      // Clear existing enrollments
      await prisma.enrollment.deleteMany({});
      
      for (const student of students) {
        // Each student enrolls in 3-5 courses
        const numCourses = Math.floor(Math.random() * 3) + 3;
        const selectedCourses = pickRandom(courses, numCourses);
        
        for (const course of selectedCourses) {
          const enrollmentDate = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
          
          await prisma.enrollment.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              createdAt: enrollmentDate,
            },
          });
        }
      }
      console.log("Course enrollments created");
    }

    // ==================== Create Lessons ====================
    console.log("Creating lessons...");
    const lessonCount = await prisma.lesson.count();
    
    if (lessonCount < 500) {
      for (const course of courses) {
        const numLessons = Math.floor(Math.random() * 6) + 5; // 5-10 lessons per course
        
        for (let i = 0; i < numLessons; i++) {
          const position = i + 1;
          const courseTeacher = await prisma.teacher.findFirst({
            where: { id: course.teacherId },
            include: { user: true }
          });
          
          await prisma.lesson.create({
            data: {
              title: `Lesson ${position}: ${course.name.split(':')[1] || 'Advanced Topics'} - Part ${position}`,
              description: `This lesson covers advanced concepts related to ${course.name.split(':')[1] || 'the subject'}. Students will learn through theory and practical examples.`,
              position,
              courseId: course.id,
              videoUrl: i % 3 === 0 ? `https://example.com/videos/course${course.id}/lesson${position}.mp4` : null,
              createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
              createdBy: courseTeacher?.userId,
            },
          });
        }
        console.log(`Created lessons for course: ${course.name}`);
      }
    }

    // Get lessons for reference
    const lessons = await prisma.lesson.findMany();

    // ==================== Create Documents ====================
    console.log("Creating documents...");
    const documentCount = await prisma.document.count();
    
    if (documentCount < 300) {
      const documentTypes = ["PDF", "DOCX", "PPTX", "XLSX", "ZIP"];
      
      // Documents for courses
      for (const course of courses) {
        const numDocs = Math.floor(Math.random() * 3) + 1; // 1-3 docs per course
        
        for (let i = 0; i < numDocs; i++) {
          const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
          
          await prisma.document.create({
            data: {
              name: `${course.name} - Study Material ${i + 1}`,
              description: `Reference material for ${course.name}`,
              fileUrl: `https://example.com/files/courses/${course.id}/document${i + 1}.${docType.toLowerCase()}`,
              type: docType,
              courseId: course.id,
              createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
            },
          });
        }
      }
      
      // Documents for lessons
      for (const lesson of lessons) {
        if (Math.random() > 0.3) { // 70% of lessons have documents
          const numDocs = Math.floor(Math.random() * 2) + 1; // 1-2 docs per lesson
          
          for (let i = 0; i < numDocs; i++) {
            const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
            
            await prisma.document.create({
              data: {
                name: `${lesson.title} - Material ${i + 1}`,
                description: `Supporting material for ${lesson.title}`,
                fileUrl: `https://example.com/files/lessons/${lesson.id}/document${i + 1}.${docType.toLowerCase()}`,
                type: docType,
                lessonId: lesson.id,
                createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
              },
            });
          }
        }
      }
      
      console.log("Documents created");
    }

    // ==================== Create Completed Lessons ====================
    console.log("Creating completed lessons...");
    const completedLessonCount = await prisma.completedLesson.count();
    
    if (completedLessonCount < 2000) {
      // Clear existing completed lessons
      await prisma.completedLesson.deleteMany({});
      
      for (const student of students) {
        // Get courses this student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { courseId: true },
        });
        
        // Get lessons for enrolled courses
        for (const enrollment of enrollments) {
          const courseLessons = await prisma.lesson.findMany({
            where: { courseId: enrollment.courseId },
          });
          
          // Complete 40-80% of lessons randomly
          const completionPercentage = Math.random() * 0.4 + 0.4;
          const lessonsToComplete = Math.floor(courseLessons.length * completionPercentage);
          const selectedLessons = pickRandom(courseLessons, lessonsToComplete);
          
          for (const lesson of selectedLessons) {
            await prisma.completedLesson.create({
              data: {
                studentId: student.id,
                lessonId: lesson.id,
                courseId: lesson.courseId,
                createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
              },
            });
          }
        }
      }
      console.log("Completed lessons created");
    }

    // ==================== Create Lesson Comments ====================
    console.log("Creating lesson comments...");
    const lessonCommentCount = await prisma.lessonComment.count();
    
    if (lessonCommentCount < 500) {
      const commentContents = [
        "This lesson was very informative. Thank you!",
        "I have a question about the concept explained at 15:30 in the video.",
        "Could you provide more examples for this topic?",
        "The explanation was clear and easy to follow.",
        "I'm struggling with understanding the last part of this lesson.",
        "Great content! Looking forward to the next lesson.",
        "How does this relate to what we learned in the previous lesson?",
        "Is there additional reading material available for this topic?",
        "This helped me understand the concept I was struggling with.",
        "Will this be covered in the exam?",
      ];
      
      // Generate 500 random comments
      for (let i = 0; i < 500; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        
        // Find a lesson from a course the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { courseId: true },
        });
        
        if (enrollments.length > 0) {
          const randomEnrollment = enrollments[Math.floor(Math.random() * enrollments.length)];
          const courseLessons = await prisma.lesson.findMany({
            where: { courseId: randomEnrollment.courseId },
          });
          
          if (courseLessons.length > 0) {
            const randomLesson = courseLessons[Math.floor(Math.random() * courseLessons.length)];
            const content = commentContents[Math.floor(Math.random() * commentContents.length)];
            const commentDate = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
            
            await prisma.lessonComment.create({
              data: {
                content,
                lessonId: randomLesson.id,
                userId: student.user.id,
                createdAt: commentDate,
                updatedAt: commentDate,
              },
            });
          }
        }
      }
      console.log("Lesson comments created");
    }

    // ==================== Create Forum Content ====================
    console.log("Creating forum content...");
    const forumTopicCount = await prisma.forumTopic.count();
    
    if (forumTopicCount < 50) {
      const categories = await prisma.forumCategory.findMany();
      
      const topicTitles = [
        "Tips for studying effectively",
        "Looking for study group partners",
        "How to balance work and studies",
        "Question about course prerequisites",
        "Campus events this weekend",
        "Best resources for learning programming",
        "Career advice for new graduates",
        "Internship opportunities discussion",
        "Help with difficult assignment",
        "Software recommendations for students",
      ];
      
      const topicContents = [
        "I'm looking for advice on how to improve my study habits. What techniques work best for you?",
        "Would anyone be interested in forming a study group for the upcoming exams?",
        "I'm struggling to balance my part-time job and coursework. Any suggestions?",
        "Can someone clarify the prerequisites for the advanced courses?",
        "Does anyone know what events are happening on campus this weekend?",
        "I'm looking for recommendations on the best resources to learn programming outside of class.",
        "As a soon-to-be graduate, I'd appreciate any career advice from alumni or professors.",
        "Let's share information about available internship opportunities in our field.",
        "I'm stuck on the latest assignment. Can someone provide some guidance?",
        "What software tools do you recommend for students in our field?",
      ];
      
      // Create forum topics
      for (let i = 0; i < 50; i++) {
        const randomUser = i % 5 === 0 
          ? teachers[Math.floor(Math.random() * teachers.length)].user 
          : students[Math.floor(Math.random() * students.length)].user;
        
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const titleIndex = i % topicTitles.length;
        const contentIndex = i % topicContents.length;
        
        const title = `${topicTitles[titleIndex]} ${i + 1}`;
        const content = `${topicContents[contentIndex]} This is additional detail for topic ${i + 1}.`;
        const createdAt = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
        
        const topic = await prisma.forumTopic.create({
          data: {
            title,
            content,
            userId: randomUser.id,
            categoryId: randomCategory.id,
            views: Math.floor(Math.random() * 200),
            isPinned: i < 5, // First 5 topics are pinned
            isLocked: i > 45, // Last 5 topics are locked
            createdAt,
            updatedAt: createdAt,
          },
        });
        
        // Add 2-8 posts to each topic
        const numPosts = Math.floor(Math.random() * 7) + 2;
        for (let j = 0; j < numPosts; j++) {
          const postUser = j % 2 === 0
            ? students[Math.floor(Math.random() * students.length)].user
            : teachers[Math.floor(Math.random() * teachers.length)].user;
          
          const postContent = `This is reply #${j + 1} to the topic. ${
            j % 3 === 0 
              ? "I agree with your point and would like to add..."
              : j % 3 === 1
                ? "Have you considered looking into..."
                : "From my experience, I would recommend..."
          }`;
          
          const postDate = randomDate(createdAt, new Date(2023, 11, 31));
          
          const post = await prisma.forumPost.create({
            data: {
              content: postContent,
              userId: postUser.id,
              topicId: topic.id,
              createdAt: postDate,
              updatedAt: postDate,
            },
          });
          
          // Add likes to some posts
          if (Math.random() > 0.5) {
            const numLikes = Math.floor(Math.random() * 5) + 1;
            const likers = pickRandom(students, numLikes).map(s => s.user.id);
            
            for (const userId of likers) {
              try {
                await prisma.forumLike.create({
                  data: {
                    userId,
                    postId: post.id,
                    createdAt: randomDate(postDate, new Date(2023, 11, 31)),
                  },
                });
              } catch (e) {
                // Skip if unique constraint violated
              }
            }
          }
        }
      }
      console.log("Forum content created");
    }

    // ==================== Create Exams ====================
    console.log("Creating exams...");
    const examCount = await prisma.exam.count();
    
    if (examCount < 30) {
      const examTitles = [
        "Midterm Examination",
        "Final Examination",
        "Quiz",
        "Assessment Test",
        "Practical Evaluation",
        "Knowledge Check"
      ];
      
      for (let i = 0; i < 30; i++) {
        const titleIndex = i % examTitles.length;
        const subjectIndex = i % subjects.length;
        
        await prisma.exam.create({
          data: {
            title: `${examTitles[titleIndex]}: ${subjects[subjectIndex].name}`,
            createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
          },
        });
      }
      console.log("Exams created");
    }

    // Get exams for reference
    const exams = await prisma.exam.findMany();

    // ==================== Create Questions and Answers ====================
    console.log("Creating questions and answers...");
    const questionCount = await prisma.question.count();
    
    if (questionCount < 300) {
      const questionPrefixes = [
        "What is the definition of",
        "Explain the concept of",
        "Compare and contrast",
        "Analyze the following scenario about",
        "Evaluate the importance of",
        "How would you implement",
        "Describe the process of",
        "What are the key components of",
        "Calculate the result when",
        "Identify the main characteristics of"
      ];
      
      const questionTopics = [
        "object-oriented programming",
        "database normalization",
        "responsive design",
        "algorithm complexity",
        "user experience design",
        "statistical analysis",
        "research methodology",
        "project management",
        "ethical considerations",
        "market segmentation",
        "literary analysis",
        "historical events",
        "scientific method",
        "behavioral psychology",
        "economic theory"
      ];
      
      for (const exam of exams) {
        // 8-12 questions per exam
        const numQuestions = Math.floor(Math.random() * 5) + 8;
        
        for (let i = 0; i < numQuestions; i++) {
          const prefixIndex = Math.floor(Math.random() * questionPrefixes.length);
          const topicIndex = Math.floor(Math.random() * questionTopics.length);
          const content = `${questionPrefixes[prefixIndex]} ${questionTopics[topicIndex]}?`;
          
          // Create question
          const question = await prisma.question.create({
            data: {
              content,
              points: Math.floor(Math.random() * 5) + 1, // 1-5 points
              difficulty: ["EASY", "MEDIUM", "HARD"][Math.floor(Math.random() * 3)],
              imageUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/q${exam.id}${i}/400/300` : null,
              createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
            },
          });
          
          // Link question to exam
          await prisma.examQuestion.create({
            data: {
              examId: exam.id,
              questionId: question.id,
              order: i + 1,
            },
          });
          
          // Create 4 answers for the question (1 correct, 3 incorrect)
          const correctAnswerIndex = Math.floor(Math.random() * 4);
          
          for (let j = 0; j < 4; j++) {
            // Create 4 answers for the question (1 correct, 3 incorrect)
          const correctAnswerIndex = Math.floor(Math.random() * 4);
          
          for (let j = 0; j < 4; j++) {
            const isCorrect = j === correctAnswerIndex;
            let content;
            
            if (isCorrect) {
              content = `This is the correct answer for question about ${questionTopics[topicIndex]}.`;
            } else {
              content = `This is an incorrect answer option ${j + 1} for the question about ${questionTopics[topicIndex]}.`;
            }
            
            await prisma.answer.create({
              data: {
                content,
                isCorrect,
                questionId: question.id,
                createdAt: randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31)),
              },
            });
          }
        }
        console.log(`Created questions and answers for exam: ${exam.title}`);
      }
    }

    // ==================== Create Exam Attempts ====================
    console.log("Creating exam attempts...");
    const examAttemptCount = await prisma.examAttempt.count();
    
    if (examAttemptCount < 500) {
      for (const student of students) {
        // Each student attempts 2-3 exams
        const numAttempts = Math.floor(Math.random() * 2) + 2;
        const selectedExams = pickRandom(exams, numAttempts);
        
        // Get student's class
        const studentClass = await prisma.class.findUnique({
          where: { id: student.classId! },
        });
        
        if (!studentClass) continue;
        
        for (const exam of selectedExams) {
          // Get exam questions
          const examQuestions = await prisma.examQuestion.findMany({
            where: { examId: exam.id },
            include: { question: { include: { answers: true } } },
          });
          
          if (examQuestions.length === 0) continue;
          
          const startDate = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
          const duration = Math.floor(Math.random() * 30) + 30; // 30-60 minutes
          const finishDate = new Date(startDate.getTime() + duration * 60 * 1000);
          
          // Get a random course (to link with the attempt)
          const studentEnrollments = await prisma.enrollment.findMany({
            where: { studentId: student.id },
            select: { courseId: true },
          });
          
          const courseId = studentEnrollments.length > 0
            ? studentEnrollments[Math.floor(Math.random() * studentEnrollments.length)].courseId
            : null;
          
          // Create attempt
          const attempt = await prisma.examAttempt.create({
            data: {
              name: `${student.user.firstName}'s attempt at ${exam.title}`,
              studentId: student.id,
              examId: exam.id,
              startedAt: startDate,
              finishedAt: finishDate,
              expirateAt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000), // +24 hours
              duration,
              showCorrectAfter: Math.random() > 0.5,
              courseId,
              classId: studentClass.id,
              score: null, // Will be calculated after answers are created
              createdAt: startDate,
            },
          });
          
          // Create exam attempt questions
          for (const examQuestion of examQuestions) {
            await prisma.examAttemptQuestion.create({
              data: {
                attemptId: attempt.id,
                questionId: examQuestion.questionId,
              },
            });
          }
          
          // Create student answers (answer 80-100% of questions)
          const totalQuestions = examQuestions.length;
          const questionsToAnswer = Math.floor(totalQuestions * (0.8 + Math.random() * 0.2));
          const selectedQuestions = pickRandom(examQuestions, questionsToAnswer);
          
          let correctAnswers = 0;
          
          for (const examQuestion of selectedQuestions) {
            const question = examQuestion.question;
            const answers = question.answers;
            
            if (answers.length === 0) continue;
            
            // 70% chance to select the correct answer, 30% chance to select a random answer
            const selectCorrect = Math.random() < 0.7;
            let selectedAnswer;
            
            if (selectCorrect) {
              selectedAnswer = answers.find(a => a.isCorrect);
              correctAnswers++;
            } else {
              selectedAnswer = answers[Math.floor(Math.random() * answers.length)];
              if (selectedAnswer.isCorrect) correctAnswers++;
            }
            
            if (selectedAnswer) {
              await prisma.studentAnswer.create({
                data: {
                  attemptId: attempt.id,
                  questionId: question.id,
                  answerId: selectedAnswer.id,
                },
              });
            }
            
            // 30% chance to mark a question
            if (Math.random() < 0.3) {
              try {
                await prisma.markedQuestion.create({
                  data: {
                    attemptId: attempt.id,
                    questionId: question.id,
                  },
                });
              } catch (e) {
                // Skip if unique constraint violated
              }
            }
          }
          
          // Calculate and update score
          const score = Math.round((correctAnswers / totalQuestions) * 100);
          await prisma.examAttempt.update({
            where: { id: attempt.id },
            data: { score },
          });
        }
      }
      console.log("Exam attempts created");
    }

    // ==================== Create Assignments ====================
    console.log("Creating assignments...");
    const assignmentCount = await prisma.assignment.count();
    
    if (assignmentCount < 100) {
      const assignmentTitles = [
        "Research Paper on",
        "Case Study Analysis of",
        "Project Implementation for",
        "Critical Review of",
        "Practical Application of",
        "Presentation on",
        "Report on",
        "Analysis of",
        "Group Project on",
        "Individual Assignment on",
      ];
      
      const assignmentTopics = [
        "Modern Web Development Frameworks",
        "Database Management Systems",
        "Machine Learning Algorithms",
        "User Interface Design Principles",
        "Software Testing Methodologies",
        "Network Security Protocols",
        "Project Management Methodologies",
        "Business Analysis Techniques",
        "Marketing Strategies",
        "Financial Analysis Methods",
        "Environmental Impact Assessment",
        "Historical Research Methods",
        "Literary Analysis Techniques",
        "Scientific Experimental Design",
        "Data Visualization Techniques",
      ];
      
      // Create assignments for each course
      for (const course of courses) {
        // 1-3 assignments per course
        const numAssignments = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numAssignments; i++) {
          const titleIndex = Math.floor(Math.random() * assignmentTitles.length);
          const topicIndex = Math.floor(Math.random() * assignmentTopics.length);
          const title = `${assignmentTitles[titleIndex]} ${assignmentTopics[topicIndex]}`;
          
          const createdAt = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
          const dueDate = new Date(createdAt.getTime() + (Math.floor(Math.random() * 30) + 15) * 24 * 60 * 60 * 1000); // 15-45 days after creation
          
          // Get classes related to the course's department
          const relatedClasses = await prisma.class.findMany({
            where: { departmentId: course.departmentId },
          });
          
          // 50% chance to assign to a specific class
          const classId = Math.random() > 0.5 && relatedClasses.length > 0
            ? relatedClasses[Math.floor(Math.random() * relatedClasses.length)].id
            : null;
          
          await prisma.assignment.create({
            data: {
              title,
              description: `This assignment requires students to ${title.toLowerCase()}. Students should submit their work following the provided guidelines.`,
              dueDate,
              type: AssignmentType.FILE_UPLOAD,
              courseId: course.id,
              classId,
              fileType: "PDF,DOCX,ZIP",
              createdAt,
              updatedAt: createdAt,
            },
          });
        }
      }
      console.log("Assignments created");
    }

    // Get assignments for reference
    const assignments = await prisma.assignment.findMany();

    // ==================== Create Assignment Submissions ====================
    console.log("Creating assignment submissions...");
    const submissionCount = await prisma.assignmentSubmission.count();
    
    if (submissionCount < 1000) {
      // Each student submits 60-80% of their assignments
      for (const student of students) {
        // Get courses the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { courseId: true },
        });
        
        if (enrollments.length === 0) continue;
        
        // Get assignments for these courses
        let studentAssignments:any = [];
        for (const enrollment of enrollments) {
          const courseAssignments = assignments.filter(a => a.courseId === enrollment.courseId);
          studentAssignments = [...studentAssignments, ...courseAssignments];
        }
        
        // Filter assignments by class if applicable
        const classSpecificAssignments = assignments.filter(a => a.classId === student.classId);
        studentAssignments = [...new Set([...studentAssignments, ...classSpecificAssignments])];
        
        if (studentAssignments.length === 0) continue;
        
        // Submit 60-80% of assignments
        const submissionRate = 0.6 + Math.random() * 0.2;
        const assignmentsToSubmit = Math.floor(studentAssignments.length * submissionRate);
        const selectedAssignments: any = pickRandom(studentAssignments, assignmentsToSubmit);
        
        for (const assignment of selectedAssignments) {
          const submittedAt = randomDate(
            new Date(assignment.createdAt.getTime() + 24 * 60 * 60 * 1000), // at least 1 day after creation
            new Date(assignment.dueDate.getTime() - 24 * 60 * 60 * 1000)    // at least 1 day before due date
          );
          
          const fileType = assignment.fileType?.split(',')[0].toLowerCase() || 'pdf';
          
          const submission = await prisma.assignmentSubmission.create({
            data: {
              assignmentId: assignment.id,
              studentId: student.id,
              fileUrl: `https://example.com/submissions/${student.id}/${assignment.id}.${fileType}`,
              submittedAt,
            },
          });
          
          // 70% chance of being graded
          if (Math.random() < 0.7) {
            const gradedAt = new Date(submittedAt.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000); // 1-5 days after submission
            const grade = randomScore(60, 100); // grades between 60-100
            
            // Get teacher of the course
            const course = await prisma.course.findUnique({
              where: { id: assignment.courseId },
              include: { teacher: { include: { user: true } } },
            });
            
            await prisma.assignmentSubmission.update({
              where: { id: submission.id },
              data: {
                grade,
                feedback: grade > 85 
                  ? "Excellent work! You've demonstrated a thorough understanding of the topic."
                  : grade > 75
                    ? "Good job. Some areas could be improved, but overall a solid submission."
                    : "Acceptable work, but there are several areas that need improvement.",
                gradedAt,
                gradedBy: course?.teacher?.userId,
              },
            });
          }
        }
      }
      console.log("Assignment submissions created");
    }

    // ==================== Create Course Comments ====================
    console.log("Creating course comments...");
    const courseCommentCount = await prisma.courseComment.count();
    
    if (courseCommentCount < 300) {
      const commentContents = [
        "This course has been very helpful in understanding the subject.",
        "I'm enjoying the practical approach of this course.",
        "The course materials are well-organized and easy to follow.",
        "I'd like to see more real-world examples in this course.",
        "The assignments are challenging but rewarding.",
        "The instructor explains complex concepts in a clear manner.",
        "Looking forward to the advanced topics in the upcoming lessons.",
        "I appreciate the prompt feedback on assignments.",
        "This course exceeded my expectations.",
        "I would recommend this course to other students interested in this field.",
      ];
      
      // Generate 300 random comments
      for (let i = 0; i < 300; i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        
        // Find a course the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { courseId: true },
        });
        
        if (enrollments.length > 0) {
          const randomEnrollment = enrollments[Math.floor(Math.random() * enrollments.length)];
          const content = commentContents[Math.floor(Math.random() * commentContents.length)];
          const commentDate = randomDate(new Date(2023, 0, 1), new Date(2023, 11, 31));
          
          // 80% standalone comments, 20% replies
          if (Math.random() > 0.2) {
            await prisma.courseComment.create({
              data: {
                content,
                courseId: randomEnrollment.courseId,
                userId: student.user.id,
                createdAt: commentDate,
                updatedAt: commentDate,
              },
            });
          } else {
            // Find an existing comment to reply to
            const existingComments = await prisma.courseComment.findMany({
              where: { 
                courseId: randomEnrollment.courseId,
                parentId: null,  // Only top-level comments
              },
              take: 10,
            });
            
            if (existingComments.length > 0) {
              const parentComment = existingComments[Math.floor(Math.random() * existingComments.length)];
              
              await prisma.courseComment.create({
                data: {
                  content: `In response to the previous comment: ${content}`,
                  courseId: randomEnrollment.courseId,
                  userId: student.user.id,
                  parentId: parentComment.id,
                  createdAt: randomDate(parentComment.createdAt, new Date(2023, 11, 31)),
                  updatedAt: commentDate,
                },
              });
            }
          }
        }
      }
      console.log("Course comments created");
    }
  }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
