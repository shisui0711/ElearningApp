import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params: { id } }: { params: { id: string } }
) {
  try {
    const { user: signedInUser } = await validateRequest();
    if (!signedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(classData);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 