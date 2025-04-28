import { Lucia, Session, User } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import prisma from "./lib/prisma";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      username: attributes.username,
      displayName: attributes.displayName,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      location: attributes.location,
      bio: attributes.bio,
      email: attributes.email,
      avatarUrl: attributes.avatarUrl,
      role: attributes.role,
      student: attributes.student,
      teacher: attributes.teacher
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | undefined;
  firstName: string;
  email: string | undefined;
  lastName: string;
  location: string | undefined;
  bio: string | undefined;
  role: "STUDENT" | "TEACHER" | "ADMIN"
  student: {
    id: string;
    classId: string | null;
  } | undefined | null,
  teacher?: {
    id: string;
  } | undefined | null
}

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId =
      (await cookies()).get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return { user: null, session: null };
    }
    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        (await cookies()).set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        );
      }
    } catch (error) {
      console.log(error);
    }

    if(!result.session || !result.user) return { user: null, session: null };

    const user = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        student: true,
        teacher: true,
      },
    });

    if(!user) return { user: null, session: null };

    return { session: result.session,
      user: {
        teacher: user.teacher,
        student: user.student,
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || undefined,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        location: user.location || undefined,
        bio: user.bio || undefined,
        email: user.email || undefined
      }
    };
  }
);
