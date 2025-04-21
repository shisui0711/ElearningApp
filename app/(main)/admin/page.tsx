import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UsersIcon,
  BookIcon,
  GraduationCapIcon,
  LineChartIcon,
  BuildingIcon,
  SchoolIcon,
} from "lucide-react";

const AdminPage = () => {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/analytics">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Phân tích dữ liệu
              </CardTitle>
              <LineChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Xem số liệu thống kê và phân tích chi tiết về khóa học, sinh
                viên và hiệu suất.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/students">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Quản lý sinh viên
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Quản lý tài khoản sinh viên, tình hình tuyển sinh và theo dõi
                hiệu suất.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/teachers">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Quản lý giáo viên
              </CardTitle>
              <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Quản lý tài khoản giáo viên, bài tập và trách nhiệm của khóa
                học.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/courses">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Quản lý khóa học
              </CardTitle>
              <BookIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tạo, chỉnh sửa và quản lý khóa học, bài học và chương trình
                giảng dạy.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/departments">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Quản lý khoa
              </CardTitle>
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tổ chức và quản lý các khoa và khóa học.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/classes">
          <Card className="hover:bg-muted/50 transition cursor-pointer h-32">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Quản lý lớp học
              </CardTitle>
              <SchoolIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tạo và quản lý lớp học, nhóm học sinh và danh sách ghi danh.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;
