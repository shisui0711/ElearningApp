"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart } from "@/components/analytics/charts";
import EnrollmentStats from "@/components/analytics/enrollment-stats";
import CourseCompletionStats from "@/components/analytics/course-completion-stats";
import ExamPerformance from "@/components/analytics/exam-performance";
import UserGrowth from "@/components/analytics/user-growth";
import DepartmentStats from "@/components/analytics/department-stats";
import { DateRange } from "react-day-picker";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { formatTimeRange } from "@/lib/utils";

interface OverviewData {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  averageScore: number;
  studentChange: number;
  courseChange: number;
  completionRateChange: number;
  scoreChange: number;
}

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [timeRange, dateRange]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // Construct query params
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      
      if (dateRange?.from && dateRange?.to) {
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`/api/analytics/overview?${params.toString()}`);
      setOverview(response.data);
    } catch (error) {
      console.error("Failed to fetch overview data:", error);
      // Set default data in case of error
      setOverview({
        totalStudents: 2350,
        totalCourses: 73,
        completionRate: 68,
        averageScore: 76,
        studentChange: 180,
        courseChange: 12,
        completionRateChange: 4,
        scoreChange: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Phân tích dữ liệu</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="enrollments">Đăng ký khóa học</TabsTrigger>
          <TabsTrigger value="completions">Tỉ lệ hoàn thành</TabsTrigger>
          <TabsTrigger value="exams">Hiệu suất bài thi</TabsTrigger>
          <TabsTrigger value="departments">Khoa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <h3 className="text-2xl font-bold">Tổng quan hệ thống</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <CustomDateRangePicker 
                value={dateRange}
                onChange={handleDateRangeChange}
              />
              <Select defaultValue="month" onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Khoảng thời gian" />
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
                  Tổng số sinh viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      +{overview?.totalStudents || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(overview?.studentChange || 0) > 0 ? "+" : ""}
                      {overview?.studentChange || 0} so với {formatTimeRange(timeRange)} trước
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Khóa học đang mở
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      +{overview?.totalCourses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(overview?.courseChange || 0) > 0 ? "+" : ""}
                      {overview?.courseChange || 0} so với {formatTimeRange(timeRange)} trước
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
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
                    <div className="text-2xl font-bold">
                      {overview?.completionRate || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(overview?.completionRateChange || 0) > 0 ? "+" : ""}
                      {overview?.completionRateChange || 0}% so với {formatTimeRange(timeRange)} trước
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Điểm thi trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {overview?.averageScore || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(overview?.scoreChange || 0) > 0 ? "+" : ""}
                      {overview?.scoreChange || 0}% so với {formatTimeRange(timeRange)} trước
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tỉ lệ người dùng hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <UserGrowth timeRange={timeRange} dateRange={dateRange} />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Tỉ lệ đăng ký khóa học</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <BarChart timeRange={timeRange} dateRange={dateRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <EnrollmentStats />
        </TabsContent>

        <TabsContent value="completions" className="space-y-4">
          <CourseCompletionStats />
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <ExamPerformance />
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <DepartmentStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
