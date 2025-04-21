"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { encryptSha256 } from "@/lib/utils";
import { signInSchema, SignInValues } from "@/lib/validation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function SignIn(
  credentials: SignInValues
): Promise<{ error: string }> {
  try {
    const { username, password } = signInSchema.parse(credentials);
    const isExist = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: username,
              mode: "insensitive",
            },
          },
          {
            email: {
              equals: username,
              mode: "insensitive",
            },
          },
        ],
      },
    });
    console.log("ok")
    if (!isExist) {
      return { error: "Tên đăng nhập hoặc email không tồn tại" };
    }

    const passwordHash = encryptSha256(password);

    if (passwordHash !== isExist.passwordHash) {
      return { error: "Mật khẩu không chính xác" };
    }

    const session = await lucia.createSession(isExist.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.log("Error throwed when sign in", error);
    return { error: "Lỗi không xác định" };
  }
}