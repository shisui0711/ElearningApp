"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, PieChart } from "./charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Example completion data for courses
const courseCompletionData = [
  {
    id: 1,
    name: "Introduction to Computer Science",
    completion: 82,
    students: 450,
    avgDuration: "4 weeks",
  },
  {
    id: 2,
    name: "Business Analytics",
    completion: 76,
    students: 378,
    avgDuration: "5 weeks",
  },
  {
    id: 3,
    name: "Digital Marketing Fundamentals",
    completion: 65,
    students: 356,
    avgDuration: "3 weeks",
  },
  {
    id: 4,
    name: "Data Structures and Algorithms",
    completion: 58,
    students: 312,
    avgDuration: "7 weeks",
  },
  {
    id: 5,
    name: "Machine Learning Basics",
    completion: 45,
    students: 298,
    avgDuration: "6 weeks",
  },
];

const CourseCompletionStats = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">
          Phân tích mức độ hoàn thành khóa học
        </h3>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toàn bộ khoa</SelectItem>
              <SelectItem value="cs">Computer Science</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="arts">Arts</SelectItem>
              <SelectItem value="medicine">Medicine</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ hoàn thành trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              +4.2% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Thời gian hoàn thành trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8 tuần</div>
            <p className="text-xs text-muted-foreground">
              -0.5 tuần so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số khóa học đã hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">583</div>
            <p className="text-xs text-muted-foreground">
              +87 so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ thành tích của học sinh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              +5% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tỉ lệ hoàn thành theo thời gian</CardTitle>
            <CardDescription>
              Sự tăng trưởng của tỷ lệ hoàn thành khóa học
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tỉ lệ hoàn thành theo khoa</CardTitle>
            <CardDescription>
              Phân tích việc hoàn thành khóa học giữa các khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tỷ lệ hoàn thành khóa học</CardTitle>
          <CardDescription>Thống kê hoàn thành theo khóa học</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khóa học</TableHead>
                <TableHead>Số sinh viên</TableHead>
                <TableHead>Thời gian hoàn thành trung bình</TableHead>
                <TableHead>Tỷ lệ hoàn thành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseCompletionData.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.students}</TableCell>
                  <TableCell>{course.avgDuration}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={course.completion}
                        className="h-2 w-full"
                      />
                      <span className="w-12 text-xs">{course.completion}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseCompletionStats;
