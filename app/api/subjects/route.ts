import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { createSubjectSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("searchQuery") || "";
    const departmentId = url.searchParams.get("departmentId") || "";
    const pageNumber = parseInt(url.searchParams.get("pageNumber") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Build the where clause based on search parameters
    const where: any = {};

    if (searchQuery) {
      where.name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Execute count query
    const totalCount = await prisma.subject.count({ where });

    // Execute data query with pagination, search, and filtering
    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: {
        name: "asc",
      },
    });

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    // Format response
    const response = {
      data: subjects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await req.json();
    const { name, description, departmentId } = createSubjectSchema.parse(body);

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    
    if (!department) {
      return new NextResponse(JSON.stringify({ error: "Khoa không tồn tại" }), {
        status: 404,
      });
    }

    const newSubject = await prisma.subject.create({
      data: {
        name,
        description,
        departmentId,
      },
    });

    return NextResponse.json(newSubject);
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
} 