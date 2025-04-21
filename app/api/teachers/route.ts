import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const searchQuery = url.searchParams.get("searchQuery") || "";

    // Calculate pagination values
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalCount = await prisma.teacher.count();

    // Get teachers with pagination
    const teachers = await prisma.teacher.findMany({
      where: {
        user: {
          displayName: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
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
        courses: {
          select: {
            id: true,
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
      data: teachers,
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
    console.error("[TEACHERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
