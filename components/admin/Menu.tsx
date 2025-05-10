'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  School,
  GraduationCap,
  Users,
  LineChart,
  Building,
  FileCheck,
  BookOpen,
  Calendar,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: Home,
        label: "Bảng điều khiển",
        href: "/admin"
      },
      {
        icon: School,
        label: "Lớp học",
        href: "/admin/classes"
      },
      {
        icon: GraduationCap,
        label: "Giáo viên",
        href: "/admin/teachers"
      },
      {
        icon: Users,
        label: "Học sinh",
        href: "/admin/students"
      },
      {
        icon: LineChart,
        label: "Phân tích dữ liệu",
        href: "/admin/analytics"
      },
      {
        icon: Building,
        label: "Khoa",
        href: "/admin/departments"
      },
      {
        icon: FileCheck,
        label: "Kiểm tra",
        href: "/admin/exams"
      },
      {
        icon: BookOpen,
        label: "Khóa học",
        href: "/admin/courses"
      },
      {
        icon: Calendar,
        label: "Môn học",
        href: "/admin/subjects"
      },
      // {
      //   icon: Bell,
      //   label: "Thông báo",
      //   href: "/admin/announcements"
      // },
    ],
  },
  {
    title: "Khác",
    items: [
      // {
      //   icon: Settings,
      //   label: "Cài đặt",
      //   href: "/admin/settings"
      // },
      {
        icon: LogOut,
        label: "Đăng xuất",
        href: "/logout"
      },
    ],
  },
];

const Menu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gradient-1 font-medium my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-all group relative overflow-hidden",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-500 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-opacity",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}></div>

                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-0.5 bg-primary",
                    isActive ? "opacity-100" : "opacity-0"
                  )}></div>

                  <Icon className={cn(
                    "w-5 h-5 transition-colors z-10",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} />

                  <span className={cn(
                    "hidden lg:block transition-all z-10",
                    isActive ? "text-gradient-1 font-medium" : "group-hover:text-gradient-1"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
