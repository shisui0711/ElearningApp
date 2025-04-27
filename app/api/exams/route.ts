import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const { searchParams } = new URL(request.url);
    const pageNumber = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalCount = await prisma.exam.count({
      where: {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    // Get exams with pagination and search
    const exams = await prisma.exam.findMany({
      where: {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      data: exams,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error("[EXAMS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return new NextResponse(JSON.stringify({ error: "Invalid title" }), {
        status: 400,
      });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("[EXAMS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 