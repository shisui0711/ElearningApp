"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ProfileFormValues, profileSchema } from "@/lib/validation";

export async function UpdateProfile(input: ProfileFormValues) {
  try {
    const { user } = await validateRequest();
    if (!user) throw Error("Bạn chưa xác thực");

    await prisma.user.update({
        where: { id: user.id},
        data: profileSchema.parse(input)
    })
  } catch (error) {
    console.log(error)
    throw new Error("Có lỗi xảy ra. Vui lòng thử lại.")
  }
}
