import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// Xử lý tất cả các loại HTTP requests
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Handle multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedMediaTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    // Check if it's a valid file type
    if (!file.type || !allowedMediaTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    //Handle file based on type and user's request
    if (fileType === "media") {
      // For media uploads (images/videos)
      const fileUrl = await uploadFileLocally(file);
      return NextResponse.json({ fileUrl });
    }
    else {
      return NextResponse.json({ error: "Invalid file type parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("[QUESTIONS_UPLOAD]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function uploadFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExtension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  // Đảm bảo thư mục tồn tại
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  // Trả về đường dẫn công khai để truy cập file
  return `/uploads/${fileName}`;
}
