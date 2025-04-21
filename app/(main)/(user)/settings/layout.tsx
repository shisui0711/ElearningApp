"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { KeyRound, UserRound, Lock, Shield } from 'lucide-react';

const settingsNavItems = [
  {
    title: 'Thông tin cá nhân',
    href: '/settings/information',
    icon: UserRound,
  },
  {
    title: 'Bảo mật',
    href: '/settings/security',
    icon: Lock,
  },
  {
    title: 'Đổi mật khẩu',
    href: '/settings/password',
    icon: KeyRound,
  },
  {
    title: 'Quyền riêng tư',
    href: '/settings/privacy',
    icon: Shield,
  },
];

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="container max-w-6xl py-8 mx-auto px-4">
      <h1 className="text-2xl font-bold mb-8">Cài đặt</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar navigation */}
        <div className="md:col-span-1">
          <nav className="flex flex-col space-y-1">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
} 