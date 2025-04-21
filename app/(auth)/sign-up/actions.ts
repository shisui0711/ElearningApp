"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { encryptSha256 } from "@/lib/utils";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(
  credentials: SignUpValues
): Promise<{ error: string }> {
  try {
    const { username, email, password, repassword, firstName, lastName } = signUpSchema.parse(credentials);

    if(password !== repassword) return { error: "Mật khẩu không khớp" };

    const isUsernameExist = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if(isUsernameExist) return { error: "Tên đăng nhập đã tồn tại" };

    const isEmailExist = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    })

    if(isEmailExist) return { error: "Email đã tồn tại" };

    const passwordHash = encryptSha256(password)

    const newUser = await prisma.user.create({
      data: {
        username,
        displayName: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        role: "STUDENT",
        email,
        passwordHash,
      }
    })

    const session = await lucia.createSession(newUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    ;(await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

    return redirect('/')
  } catch (error) {
    if(isRedirectError(error)) throw error
    console.log("Error throwed while sign up: ", error);
    return {
      error: "Lỗi không xác định",
    };
  }
}