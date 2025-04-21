"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  createStudentSchema,
  CreateStudentValues,
  updateStudentSchema,
  UpdateStudentValues,
} from "@/lib/validation";
import { Student, UserRole } from "@prisma/client";
import { encryptSha256 } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { studentFields } from "@/lib/excel";

export async function createStudent(input: CreateStudentValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const { username, firstName, lastName, email, password, classId } = createStudentSchema.parse(input);
  
  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  
  if (existingUser) {
    throw new Error("Tên đăng nhập đã tồn tại");
  }

  // Check if email already exists
  if (email) {
    const userWithEmail = await prisma.user.findUnique({
      where: { email },
    });
    
    if (userWithEmail) {
      throw new Error("Email đã tồn tại");
    }
  }
  
  // Check if class exists
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
  });
  
  if (!existingClass) {
    throw new Error("Lớp không tồn tại");
  }

  // Create user and student in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: {
        username,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        passwordHash: encryptSha256(password),
        role: UserRole.STUDENT,
      },
    });

    // Create student profile
    const newStudent = await tx.student.create({
      data: {
        userId: newUser.id,
        classId: classId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return newStudent;
  });

  return result;
}

export async function updateStudent(input: UpdateStudentValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const { id, firstName, lastName, email, classId } = updateStudentSchema.parse(input);
  
  // Find the student
  const existingStudent = await prisma.student.findUnique({
    where: { id },
    include: { user: true },
  });
  
  if (!existingStudent) {
    throw new Error("Sinh viên không tồn tại");
  }

  // Check if email is being changed and if it already exists
  if (email && email !== existingStudent.user.email) {
    const userWithEmail = await prisma.user.findUnique({
      where: { email },
    });
    
    if (userWithEmail && userWithEmail.id !== existingStudent.user.id) {
      throw new Error("Email đã tồn tại");
    }
  }
  
  // Check if class exists
  const existingClass = await prisma.class.findUnique({
    where: { id: classId },
  });
  
  if (!existingClass) {
    throw new Error("Lớp không tồn tại");
  }

  // Update the student and user in a transaction
  await prisma.$transaction(async (tx) => {
    // Update the user
    await tx.user.update({
      where: { id: existingStudent.userId },
      data: {
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
      },
    });
    
    // Update the student
    await tx.student.update({
      where: { id },
      data: {
        classId,
      },
    });
  });

  // Return the updated student with user info
  const updatedStudent = await prisma.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updatedStudent;
}

export async function deleteStudent(id: string): Promise<Student> {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const existingStudent = await prisma.student.findUnique({
    where: { id },
    include: { user: true, enrolledCourses: true },
  });
  
  if (!existingStudent) {
    throw new Error("Sinh viên không tồn tại");
  }

  // Check if student is enrolled in courses
  if (existingStudent.enrolledCourses.length > 0) {
    throw new Error("Không thể xóa sinh viên đã đăng ký khóa học. Vui lòng hủy đăng ký các khóa học trước.");
  }

  // Delete the student and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete student
    const deletedStudent = await tx.student.delete({
      where: { id },
    });

    // Delete user
    await tx.user.delete({
      where: { id: existingStudent.userId },
    });

    return deletedStudent;
  });

  return result;
}

export async function generateStudentExcelTemplate() {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  try {
    // Create a sample data row
    const sampleData = [
      {
        "Họ": "Nguyễn",
        "Tên": "Văn A",
        "Email": "nguyenvana@example.com",
        "Tên đăng nhập": "nguyenvana",
        "Mật khẩu": "Password@123",
        "Lớp": "CNTT01"
      }
    ];

    // Create worksheet from sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mẫu sinh viên");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  } catch (error) {
    console.error("Error generating template:", error);
    throw new Error("Không thể tạo file mẫu Excel.");
  }
} 