"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
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
import { DateRange } from "react-day-picker";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "@/types";
import { Department } from "@prisma/client";
interface CourseCompletion {
  id: string;
  name: string;
  completion: number;
  students: number;
  avgDuration: string;
}

interface CompletionStats {
  averageCompletionRate: number;
  averageCompletionTime: number;
  totalCompletions: number;
  achievementRate: number;
  growthRates: {
    completionRate: string;
    completionTime: string;
    totalCompletions: string;
    achievementRate: string;
  };
  courseCompletions: CourseCompletion[];
}

interface ChartData {
  lineData?: { name: string; completion: number }[];
  pieData?: { name: string; value: number }[];
}

const CourseCompletionStats = () => {
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  const { data: departments } = useQuery<PaginationResponse<Department>>({
    queryKey: ["departments-all"],
    queryFn: async () => {
      const response = await axios.get("/api/departments", {
        params: {
          pageSize: 100,
          pageNumber: 1,
        },
      });
      return response.data;
    },
  });

  useEffect(() => {
    fetchCompletionStats();
    fetchChartData();
  }, [departmentFilter, dateRange]);

  const fetchCompletionStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('departmentId', departmentFilter !== "all" ? departmentFilter : "");
      
      if (dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`/api/analytics/completions?${params.toString()}`);
      setCompletionStats(response.data);
    } catch (error) {
      console.error("Failed to fetch completion stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('departmentId', departmentFilter !== "all" ? departmentFilter : "");
      params.append('chartType', 'completion');
      
      if (dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`/api/analytics/charts?${params.toString()}`);
      setChartData(response.data);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">
          Phân tích mức độ hoàn thành khóa học
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <CustomDateRangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Select defaultValue="all" onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toàn trường</SelectItem>
              {departments?.data.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
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
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completionStats?.averageCompletionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {completionStats?.growthRates.completionRate || '0%'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Thời gian hoàn thành trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completionStats?.averageCompletionTime || 0} tuần</div>
                <p className="text-xs text-muted-foreground">
                  {completionStats?.growthRates.completionTime || '0'} tuần so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số khóa học đã hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completionStats?.totalCompletions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {completionStats?.growthRates.totalCompletions || '0'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ thành tích của học sinh
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completionStats?.achievementRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {completionStats?.growthRates.achievementRate || '0%'} so với tháng trước
                </p>
              </>
            )}
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
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <LineChart customData={chartData?.lineData} />
            )}
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
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <PieChart customData={chartData?.pieData} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tỷ lệ hoàn thành khóa học</CardTitle>
          <CardDescription>Thống kê hoàn thành theo khóa học</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          ) : (
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
                {completionStats?.courseCompletions.map((course) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseCompletionStats;
