"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  createDepartmentSchema,
  CreateDepartmentValues,
  updateDepartmentSchema,
  UpdateDepartmentValues,
} from "@/lib/validation";
import { Department } from "@prisma/client";

export async function createDepartment(input: CreateDepartmentValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const { name } = createDepartmentSchema.parse(input);
  const newDepartment = await prisma.department.create({
    data: { name },
  });

  return newDepartment;
}

export async function updateDepartment(input: UpdateDepartmentValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  const { id, name } = updateDepartmentSchema.parse(input);
  const existDepartment = await prisma.department.findUnique({
    where: { id },
  });
  if (!existDepartment) throw new Error("Khoa không tồn tại");
  const updatedDepartment = await prisma.department.update({
    where: { id },
    data: { name },
  });

  return updatedDepartment
}

export async function deleteDepartment(id: string): Promise<Department>{
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");

  const existDepartment = await prisma.department.findUnique({
    where: { id },
  });
  if (!existDepartment) throw new Error("Khoa không tồn tại");

  const deletedDepartment = await prisma.department.delete({
    where: {id}
  })

  return deletedDepartment
}
