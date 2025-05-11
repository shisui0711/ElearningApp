import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Layers, Library, Users } from "lucide-react";

interface CourseManagementNavProps {
  courseId: string;
}

export default function CourseManagementNav({ courseId }: CourseManagementNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  const navItems = [
    {
      href: `/manage-courses/${courseId}`,
      icon: Layers,
      label: "Overview",
      exact: true
    },
    {
      href: `/manage-courses/${courseId}/lessons`,
      icon: Library,
      label: "Lessons",
    },
    {
      href: `/manage-courses/${courseId}/assignments`,
      icon: FileText,
      label: "Assignments",
    },
    {
      href: `/manage-courses/${courseId}/students`,
      icon: Users,
      label: "Students",
    },
    {
      href: `/manage-courses/${courseId}/prerequisites`,
      icon: BookOpen,
      label: "Prerequisites",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-2 mb-6 lg:items-center">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={
            item.exact
              ? pathname === item.href
                ? "default"
                : "outline"
              : isActive(item.href)
              ? "default"
              : "outline"
          }
          size="sm"
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </div>
  );
} 