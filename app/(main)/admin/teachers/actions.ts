"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  createTeacherSchema,
  CreateTeacherValues,
  updateTeacherSchema,
  UpdateTeacherValues,
} from "@/lib/validation";
import { Teacher, UserRole } from "@prisma/client";
import { encryptSha256 } from "@/lib/utils";
import * as XLSX from "xlsx";
import { teacherFields } from "@/lib/excel";

export async function createTeacher(input: CreateTeacherValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const { username, firstName, lastName, email, password } = createTeacherSchema.parse(input);
  
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

  // Create user and teacher in a transaction
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
        role: UserRole.TEACHER,
      },
    });

    // Create teacher profile
    const newTeacher = await tx.teacher.create({
      data: {
        userId: newUser.id,
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
      },
    });

    return newTeacher;
  });

  return result;
}

export async function updateTeacher(input: UpdateTeacherValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const { id, firstName, lastName, email } = updateTeacherSchema.parse(input);
  
  // Find the teacher
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id },
    include: { user: true },
  });
  
  if (!existingTeacher) {
    throw new Error("Giảng viên không tồn tại");
  }

  // Check if email is being changed and if it already exists
  if (email && email !== existingTeacher.user.email) {
    const userWithEmail = await prisma.user.findUnique({
      where: { email },
    });
    
    if (userWithEmail && userWithEmail.id !== existingTeacher.user.id) {
      throw new Error("Email đã tồn tại");
    }
  }

  // Update the user
  await prisma.user.update({
    where: { id: existingTeacher.userId },
    data: {
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
    },
  });

  // Return the updated teacher with user info
  const updatedTeacher = await prisma.teacher.findUnique({
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
    },
  });

  return updatedTeacher;
}

export async function deleteTeacher(id: string): Promise<Teacher> {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  if (user.role !== "ADMIN") throw Error("Bạn không có quyền thực hiện hành động này");

  const existingTeacher = await prisma.teacher.findUnique({
    where: { id },
    include: { user: true, courses: true },
  });
  
  if (!existingTeacher) {
    throw new Error("Giảng viên không tồn tại");
  }

  // Check if teacher has courses
  if (existingTeacher.courses.length > 0) {
    throw new Error("Không thể xóa giảng viên đã có khóa học. Vui lòng xóa các khóa học trước.");
  }

  // Delete the teacher and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete teacher
    const deletedTeacher = await tx.teacher.delete({
      where: { id },
    });

    // Delete user
    await tx.user.delete({
      where: { id: existingTeacher.userId },
    });

    return deletedTeacher;
  });

  return result;
}

// Create a teacher template Excel file
export async function generateTeacherExcelTemplate(): Promise<Buffer> {
  // Create worksheet with headers based on teacher fields
  const headers = teacherFields.map(field => field.label);
  
  // Create empty rows for examples
  const exampleRows = [
    {
      "Họ tên đầy đủ": "Nguyễn Văn A",
      "Email": "nguyenvana@example.com",
      "Tên đăng nhập": "nguyenvana",
      "Mật khẩu": "Teacher@123"
    },
    {
      "Họ tên đầy đủ": "Trần Thị B",
      "Email": "tranthib@example.com",
      "Tên đăng nhập": "tranthib",
      "Mật khẩu": "Teacher@123"
    }
  ];
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exampleRows, {
    header: headers,
  });
  
  // Auto-fit column widths
  const colWidths = headers.map(header => {
    // Calculate the max width between header and example data
    let maxLength = header.length;
    
    for (const row of exampleRows) {
      const cellValue = row[header as keyof typeof row] || "";
      const cellLength = cellValue.toString().length;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    }
    
    return { wch: maxLength + 2 }; // +2 for padding
  });
  
  worksheet["!cols"] = colWidths;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Giảng viên");
  
  // Create a buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  return buffer;
} 