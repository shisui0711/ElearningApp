import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: signedInUser } = await validateRequest();
  if (!signedInUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const currentLesson = await prisma.lesson.findUnique({
    where: { id },
  });

  if (!currentLesson)
    return new NextResponse("Lesson not found", { status: 404 });
  const nextLesson = await prisma.lesson.findFirst({
    where: {
      courseId: currentLesson.courseId,
      position: currentLesson.position + 1,
    },
  });

  if (!nextLesson)
    return new NextResponse("Next lesson not found", { status: 404 });

  return NextResponse.json(nextLesson);
}
