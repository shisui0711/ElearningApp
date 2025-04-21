import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Get all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.forumCategory.findMany({
      include: {
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const category = await prisma.forumCategory.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 