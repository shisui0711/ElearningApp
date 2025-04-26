import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, description, courseId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Sử dụng ID của người dùng đăng nhập làm người tạo
    const createdBy = user.id;

    const questionBank = await prisma.questionBank.create({
      data: {
        name,
        description,
        courseId: courseId || null,
        createdBy,
      },
    });

    return NextResponse.json(questionBank, { status: 201 });
  } catch (error) {
    console.error("Error creating question bank:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const questionBanks = await prisma.questionBank.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        course: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return NextResponse.json(questionBanks);
  } catch (error) {
    console.error("Error fetching question banks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 