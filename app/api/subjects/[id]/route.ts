import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const id = params.id;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subject) {
      return new NextResponse(JSON.stringify({ error: "Môn học không tồn tại" }), {
        status: 404,
      });
    }

    return NextResponse.json(subject);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
} 