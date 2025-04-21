"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  createClassSchema,
  CreateClassValues,
  updateClassSchema,
  UpdateClassValues,
} from "@/lib/validation";

export async function createClass(input: CreateClassValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { name, departmentId } = createClassSchema.parse(input);

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const newClass = await prisma.class.create({
    data: {
      name,
      departmentId,
    },
  });

  return newClass;
}

export async function updateClass(input: UpdateClassValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { id, name, departmentId } = updateClassSchema.parse(input);

  const existClass = await prisma.class.findUnique({
    where: { id },
  });
  if (!existClass) throw new Error("Lớp không tồn tại");

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new Error("Khoa không tồn tại");

  const updatedClass = await prisma.class.update({
    where: { id },
    data: {
      name,
      departmentId,
    },
  });

  return updatedClass;
}

export async function deleteClass(id: string) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const existClass = await prisma.class.findUnique({
    where: { id },
  });
  if (!existClass) throw new Error("Lớp không tồn tại");

  // Check if there are students associated with this class
  const studentsCount = await prisma.student.count({
    where: { classId: id },
  });

  if (studentsCount > 0) {
    throw new Error("Không thể xóa lớp này vì có sinh viên đang học");
  }

  const deletedClass = await prisma.class.delete({
    where: { id },
  });

  return deletedClass;
}
