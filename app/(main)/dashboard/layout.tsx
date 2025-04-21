
import SidebarProvider from "@/provider/SidebarProvider";
import React from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="h-full">{children}</div>
    </SidebarProvider>
  );
}
