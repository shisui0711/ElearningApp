"use client";

import React, { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";

// Define types for our data
interface Department {
  id: number;
  name: string;
  students: number;
  courses: number;
  avgCompletion: number;
  avgScore: number;
  growth: string;
}

interface TopCourse {
  department: string;
  courseName: string;
  score: number;
}

interface DepartmentStatsData {
  departments: Department[];
  topCourses: TopCourse[];
  lowCourses: TopCourse[];
  totalDepartments: number;
  avgCoursesPerDepartment: number;
  avgStudentsPerDepartment: number;
  highestScoringDepartment: {
    name: string;
    score: number;
  };
}

const DepartmentStats = () => {
  const [data, setData] = useState<DepartmentStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/departments');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
        console.error('Error fetching department stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentStats();
  }, []);

  // Convert department data for charts
  const preparePieChartData = () => {
    if (!data) return [];
    return data.departments.map(dept => ({
      name: dept.name,
      value: dept.students
    }));
  };

  const prepareBarChartData = () => {
    if (!data) return [];
    return data.departments.map(dept => ({
      name: dept.name,
      total: dept.courses
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

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
            <div className="text-2xl font-bold">{data.totalDepartments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số khóa học trung bình theo khoa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgCoursesPerDepartment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số sinh viên trung bình mỗi khoa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgStudentsPerDepartment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khoa có điểm trung bình cao nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.highestScoringDepartment.name}</div>
            <p className="text-xs text-muted-foreground">{data.highestScoringDepartment.score}% trung bình điểm</p>
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
            <PieChart customData={preparePieChartData()} />
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
            <BarChart customData={prepareBarChartData()} />
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
              {data.departments.map((dept) => (
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
                {data.topCourses.map((course, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.score}%</TableCell>
                  </TableRow>
                ))}
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
                {data.lowCourses.map((course, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.courseName}</TableCell>
                    <TableCell>{course.score}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepartmentStats;
