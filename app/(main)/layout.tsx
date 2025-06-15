import { redirect } from "next/navigation";
import React from "react";
import SessionProvider from "@/provider/SessionProvider";
import { validateRequest } from "@/auth";
import { SocketProvider } from "@/provider/SocketProvider";
import { NotificationProvider } from "@/provider/NotificationProvider";
import MagicButton from "@/components/MagicButton";
import AiAssistant from "@/components/ai-assistant";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await validateRequest();
  if (!session.user) redirect("/sign-in");

  return (
    <SessionProvider value={session}>
      {/* <SocketProvider> */}
        <NotificationProvider>
          {children}
        </NotificationProvider>
        {/* </SocketProvider> */}
        <AiAssistant className="fixed bottom-4 right-4 z-50" />
    </SessionProvider>
  );
}
