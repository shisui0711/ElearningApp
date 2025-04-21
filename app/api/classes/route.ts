import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

export async function GET(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const searchQuery = url.searchParams.get("searchQuery") || "";
    const departmentId = url.searchParams.get("departmentId") || "";

    // Validate pagination parameters
    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(pageSize) ||
      pageSize < 1
    ) {
      return new NextResponse("Invalid pagination parameters", { status: 400 });
    }

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination metadata
    const totalCount = await prisma.class.count();

    const classes = await prisma.class.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
        ...(departmentId && { departmentId }),
      },
      take: pageSize,
      skip: skip,
      orderBy: {
        name: "asc",
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: classes,
      pagination: {
        pageNumber,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
