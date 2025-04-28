import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const searchQuery = url.searchParams.get("searchQuery") || "";
    const classId = url.searchParams.get("classId") || "";

    // Calculate pagination values
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalCount = await prisma.student.count();

    // Get students with pagination
    const students = await prisma.student.findMany({
      where: {
        user: {
          displayName: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        ...(classId && { classId }),
      },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate pagination meta
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: students,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("[STUDENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
