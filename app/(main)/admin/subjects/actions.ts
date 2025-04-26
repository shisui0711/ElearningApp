"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  createSubjectSchema,
  CreateSubjectValues,
  updateSubjectSchema,
  UpdateSubjectValues,
} from "@/lib/validation";

export async function createSubject(input: CreateSubjectValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { name, departmentId } = createSubjectSchema.parse(input);

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const newSubject = await prisma.subject.create({
    data: {
      name,
      departmentId,
    },
  });

  return newSubject;
}

export async function updateSubject(input: UpdateSubjectValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { id, name, departmentId } = updateSubjectSchema.parse(input);

  const existSubject = await prisma.subject.findUnique({
    where: { id },
  });
  if (!existSubject) throw new Error("Môn học không tồn tại");

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const updatedSubject = await prisma.subject.update({
    where: { id },
    data: {
      name,
      departmentId,
    },
  });

  return updatedSubject;
}

export async function deleteSubject(id: string) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const existSubject = await prisma.subject.findUnique({
    where: { id },
  });
  if (!existSubject) throw new Error("Môn học không tồn tại");

  // Check if there are courses associated with this subject
  const coursesCount = await prisma.course.count({
    where: { subjectId: id },
  });

  // Check if there are exams associated with this subject
  const examsCount = await prisma.exam.count({
    where: { subjectId: id },
  });

  if (coursesCount > 0) {
    throw new Error("Không thể xóa môn học này vì có khóa học đang tham chiếu");
  }

  if (examsCount > 0) {
    throw new Error("Không thể xóa môn học này vì có bài thi đang tham chiếu");
  }

  const deletedSubject = await prisma.subject.delete({
    where: { id },
  });

  return deletedSubject;
} 