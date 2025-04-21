"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, BarChart } from "./charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Example department data
const departmentData = [
  {
    id: 1,
    name: "Computer Science",
    students: 850,
    courses: 42,
    avgCompletion: 72,
    avgScore: 80,
    growth: "+12%",
  },
  {
    id: 2,
    name: "Business",
    students: 720,
    courses: 38,
    avgCompletion: 68,
    avgScore: 76,
    growth: "+8%",
  },
  {
    id: 3,
    name: "Engineering",
    students: 620,
    courses: 35,
    avgCompletion: 65,
    avgScore: 78,
    growth: "+6%",
  },
  {
    id: 4,
    name: "Arts",
    students: 480,
    courses: 30,
    avgCompletion: 70,
    avgScore: 82,
    growth: "+5%",
  },
  {
    id: 5,
    name: "Medicine",
    students: 380,
    courses: 28,
    avgCompletion: 75,
    avgScore: 85,
    growth: "+4%",
  },
];

const DepartmentStats = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">Phân tích về các khoa</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số khoa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số khóa học trung bình theo khoa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34.6</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số sinh viên trung bình mỗi khoa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">610</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khoa có điểm trung bình cao nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medicine</div>
            <p className="text-xs text-muted-foreground">85% trung bình điểm</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tỉ lệ sinh viên các khoa</CardTitle>
            <CardDescription>Sinh viên theo khoa</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tỉ lệ khóa học</CardTitle>
            <CardDescription>
              Các khóa học được cung cấp bởi khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Độ hiệu quả của các khoa</CardTitle>
          <CardDescription>Số liệu hiệu suất theo khoa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khoa</TableHead>
                <TableHead>Số sinh viên</TableHead>
                <TableHead>Số khóa học</TableHead>
                <TableHead>Tỉ lệ hoàn thành trung bình</TableHead>
                <TableHead>Điểm trung bình</TableHead>
                <TableHead>Tăng trưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentData.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.students}</TableCell>
                  <TableCell>{dept.courses}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={dept.avgCompletion}
                        className="h-2 w-full"
                      />
                      <span className="w-12 text-xs">
                        {dept.avgCompletion}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{dept.avgScore}%</TableCell>
                  <TableCell className="text-green-600">
                    {dept.growth}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Các khóa học có hiệu quả cao nhất</CardTitle>
            <CardDescription>
                Các khóa học có thành tích cao nhất theo khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Human Anatomy</TableCell>
                  <TableCell>92%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Computer Science</TableCell>
                  <TableCell>Data Structures</TableCell>
                  <TableCell>88%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Arts</TableCell>
                  <TableCell>Art History</TableCell>
                  <TableCell>86%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Các khóa học có hiệu quả thấp</CardTitle>
            <CardDescription>Các khóa học cần chú ý</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Engineering</TableCell>
                  <TableCell>Advanced Calculus</TableCell>
                  <TableCell>62%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Business</TableCell>
                  <TableCell>Financial Accounting</TableCell>
                  <TableCell>65%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Computer Science</TableCell>
                  <TableCell>Machine Learning</TableCell>
                  <TableCell>68%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepartmentStats;
