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

  const { name, description, departmentId } = createSubjectSchema.parse(input);

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const newSubject = await prisma.subject.create({
    data: {
      name,
      description,
      departmentId,
    },
  });

  return newSubject;
}

export async function updateSubject(input: UpdateSubjectValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { id, name, description, departmentId } = updateSubjectSchema.parse(input);

  // Check if subject exists
  const existingSubject = await prisma.subject.findUnique({
    where: { id },
  });
  if (!existingSubject) throw new Error("Môn học không tồn tại");

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const updatedSubject = await prisma.subject.update({
    where: { id },
    data: {
      name,
      description,
      departmentId,
    },
  });

  return updatedSubject;
}

export async function deleteSubject(id: string) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  // Check if subject exists
  const existingSubject = await prisma.subject.findUnique({
    where: { id },
  });
  if (!existingSubject) throw new Error("Môn học không tồn tại");

  // Check if subject has related courses
  const courseCount = await prisma.course.count({
    where: { subjectId: id },
  });
  if (courseCount > 0) {
    throw new Error("Không thể xóa môn học này vì đã có khóa học liên kết");
  }

  const deletedSubject = await prisma.subject.delete({
    where: { id },
  });

  return deletedSubject;
} 