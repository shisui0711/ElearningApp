import { NextResponse } from "next/server";
import { generateStudentExcelTemplate } from "@/app/(main)/admin/students/actions";
import { validateRequest } from "@/auth";

export async function GET() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const buffer = await generateStudentExcelTemplate();

    // Set the appropriate headers for an Excel file download
    const headers = new Headers();
    headers.append('Content-Disposition', 'attachment; filename="mau-import-sinh-vien.xlsx"');
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new NextResponse(buffer, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error("[STUDENT_TEMPLATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 