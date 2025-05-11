import { redirect } from "next/navigation";
import React from "react";
import SessionProvider from "@/provider/SessionProvider";
import { validateRequest } from "@/auth";
import { SocketProvider } from "@/provider/SocketProvider";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await validateRequest();
  if (!session.user) redirect("/sign-in");

  return (
    <SessionProvider value={session}>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
