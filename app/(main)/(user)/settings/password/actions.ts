"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { encryptSha256 } from "@/lib/utils";
import { PasswordFormValues, passwordSchema } from "@/lib/validation";

export async function ChangePassword(input: PasswordFormValues) {
  const { user } = await validateRequest();
  if (!user) throw Error("Bạn chưa xác thực");
  const { currentPassword, newPassword } = passwordSchema.parse(input);
  const checkPassword = await prisma.user.findUnique({
    where: {
        id: user.id,
        passwordHash: encryptSha256(currentPassword)
    }
  });

  if(!checkPassword) throw new Error("Mật khẩu không chính xác");

  await prisma.user.update({
    where: { id: user.id},
    data: {
        passwordHash: encryptSha256(newPassword)
    }
  })
}
