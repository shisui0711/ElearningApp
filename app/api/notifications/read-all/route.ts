import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

// Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Mark all user's notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MARK_ALL_NOTIFICATIONS_READ]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 