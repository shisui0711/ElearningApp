import { NextResponse } from "next/server";
import { generateTeacherExcelTemplate } from "@/app/(main)/admin/teachers/actions";
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

    const buffer = await generateTeacherExcelTemplate();

    // Set the appropriate headers for an Excel file download
    const headers = new Headers();
    headers.append('Content-Disposition', 'attachment; filename="mau-import-giang-vien.xlsx"');
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Convert Buffer to Uint8Array which is valid for Response
    return new Response(new Uint8Array(buffer), { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error("[TEACHER_TEMPLATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 