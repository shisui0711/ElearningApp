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
import { LineChart, BarChart } from "./charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeRange } from "@/lib/utils";

interface TopCourse {
  id: number;
  name: string;
  enrollments: number;
  department: string;
  growth: string;
}

interface EnrollmentData {
  newEnrollments: number;
  enrollmentRate: number;
  averagePerStudent: number;
  retentionRate: number;
  growthRates: {
    newEnrollments: string;
    enrollmentRate: string;
    averagePerStudent: string;
    retentionRate: string;
  };
  topCourses: TopCourse[];
}

interface ChartData {
  lineData?: { name: string; completion: number }[];
  barData?: { name: string; total: number }[];
  pieData?: { name: string; value: number }[];
}

const EnrollmentStats = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    fetchEnrollmentData();
    fetchChartData();
  }, [timeRange, dateRange]);

  const fetchEnrollmentData = async () => {
    setLoading(true);
    try {
      // Construct query params
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      
      if (dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`/api/analytics/enrollments?${params.toString()}`);
      setEnrollmentData(response.data);
    } catch (error) {
      console.error("Failed to fetch enrollment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      // Construct query params
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      params.append('chartType', 'all');
      
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
        <h3 className="text-2xl font-bold">Phân tích đăng ký học</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <CustomDateRangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Select defaultValue="month" onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần trước</SelectItem>
              <SelectItem value="month">Tháng trước</SelectItem>
              <SelectItem value="quarter">Quý trước</SelectItem>
              <SelectItem value="year">Năm trước</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lượt đăng ký mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">+{enrollmentData?.newEnrollments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {enrollmentData?.growthRates.newEnrollments || '0%'} so với {formatTimeRange(timeRange)} trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỉ lệ đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{enrollmentData?.enrollmentRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {enrollmentData?.growthRates.enrollmentRate || '0%'} so với {formatTimeRange(timeRange)} trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Số lượt đăng ký trên mỗi sinh viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{enrollmentData?.averagePerStudent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {enrollmentData?.growthRates.averagePerStudent || '0'} so với {formatTimeRange(timeRange)} trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỉ lệ giữ chân sinh viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{enrollmentData?.retentionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {enrollmentData?.growthRates.retentionRate || '0%'} so với {formatTimeRange(timeRange)} trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Xu hướng đăng ký học tập</CardTitle>
            <CardDescription>
              Tổng số lượt đăng ký khóa học theo thời gian
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
            <CardTitle>Số lượng đăng ký theo khoa</CardTitle>
            <CardDescription>
              Phân bố số lượng đăng ký giữa các khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <BarChart customData={chartData?.barData} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Các khóa học hàng đầu theo số lượng đăng ký học</CardTitle>
          <CardDescription>
            Các khóa học có số lượt đăng ký cao nhất
          </CardDescription>
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
                  <TableHead>Tên khóa học</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Số lượt đăng ký</TableHead>
                  <TableHead className="text-right">Tăng trưởng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentData?.topCourses?.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.enrollments}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {course.growth}
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

export default EnrollmentStats;
