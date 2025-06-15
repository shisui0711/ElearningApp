"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, LineChart } from "./charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import axios from "axios";
import { Department } from "@prisma/client";
import { PaginationResponse } from "@/types";

interface ExamResult {
  id: string;
  name: string;
  avgScore: number;
  attempts: number;
  passingRate: number;
}

interface DifficultQuestion {
  questionId: string;
  exam: string;
  text: string;
  correctRate: number;
  difficulty: string;
  total: number;
}

interface ExamStats {
  overview: {
    avgScore: number;
    totalExams: number;
    totalAttempts: number;
    passingRate: number;
    avgScoreChange: number;
    attemptsChange: number;
    passingRateChange: number;
    questionAccuracy: number;
    questionAccuracyChange: number;
  };
  examDetails: ExamResult[];
  scoreDistribution: { range: string; count: number }[];
  difficultQuestions: DifficultQuestion[];
  performanceTrend: { name: string; completion: number }[];
}

interface ChartData {
  barData?: { name: string; total: number }[];
  lineData?: { name: string; completion: number }[];
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-600";
};

const getPassingRateBadge = (rate: number) => {
  if (rate >= 90) return <Badge className="bg-green-500">Xuất sắc</Badge>;
  if (rate >= 80) return <Badge className="bg-emerald-500">Tốt</Badge>;
  if (rate >= 70) return <Badge className="bg-yellow-500">Trung bình</Badge>;
  if (rate >= 60) return <Badge className="bg-orange-500">Yếu</Badge>;
  return <Badge className="bg-red-500">Kém</Badge>;
};

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return <Badge className="bg-green-500">Dễ</Badge>;
    case 'medium':
      return <Badge className="bg-orange-500">Trung bình</Badge>;
    case 'hard':
      return <Badge className="bg-red-500">Khó</Badge>;
    default:
      return <Badge>{difficulty}</Badge>;
  }
};

const ExamPerformance = () => {
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const getQueryParams = () => {
    const params = new URLSearchParams();
    if (departmentFilter !== "all") {
      params.append('departmentId', departmentFilter);
    }
    
    if (dateRange?.from && dateRange?.to) {
      params.append('startDate', dateRange.from.toISOString());
      params.append('endDate', dateRange.to.toISOString());
    }
    
    return params.toString();
  };

  const { data: departments } = useQuery<
    PaginationResponse<Department>
  >({
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

  const { 
    data: examStats, 
    isLoading: statsLoading 
  } = useQuery<ExamStats>({
    queryKey: ['examStats', departmentFilter, dateRange],
    queryFn: async () => {
      const response = await axios.get(`/api/analytics/exams?${getQueryParams()}`);
      return response.data;
    }
  });

  const { 
    data: chartData, 
    isLoading: chartLoading 
  } = useQuery<ChartData>({
    queryKey: ['examCharts', departmentFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams(getQueryParams());
      params.append('chartType', 'exams');
      const response = await axios.get(`/api/analytics/charts?${params.toString()}`);
      return response.data;
    }
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">Phân tích hiệu suất bài thi</h3>
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
              Điểm thi trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{examStats?.overview.avgScore || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {examStats?.overview.avgScoreChange || '0%'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bài thi đã giao
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{examStats?.overview.totalAttempts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {examStats?.overview.attemptsChange || '0'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ vượt qua trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{examStats?.overview.passingRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {examStats?.overview.passingRateChange || '0%'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Độ chính xác của câu hỏi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{examStats?.overview.questionAccuracy || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {examStats?.overview.questionAccuracyChange || '0%'} so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Phân tích điểm thi</CardTitle>
            <CardDescription>Tỉ lệ điểm thi</CardDescription>
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
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hiệu suất bài thi</CardTitle>
            <CardDescription>Hiệu suất bài thi theo thời gian</CardDescription>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết về kết quả thi</CardTitle>
          <CardDescription>
            Điểm thi gần đây và số liệu thống kê
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
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
                  <TableHead>Bài thi</TableHead>
                  <TableHead>Số lượng làm bài</TableHead>
                  <TableHead>Điểm trung bình</TableHead>
                  <TableHead>Tỉ lệ vượt qua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(examStats?.examDetails) 
                  ? examStats.examDetails.map((exam, index) => (
                    <TableRow key={`exam-${index}-${exam.id || ''}`}>
                      <TableCell className="font-medium">{exam?.name || 'Unknown'}</TableCell>
                      <TableCell>{exam?.attempts || 0}</TableCell>
                      <TableCell className={getScoreColor(exam?.avgScore || 0)}>
                        {exam?.avgScore || 0}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{exam?.passingRate || 0}%</span>
                          {getPassingRateBadge(exam?.passingRate || 0)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  : <TableRow><TableCell colSpan={4}>Không có kết quả thi</TableCell></TableRow>
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Những câu hỏi khó</CardTitle>
          <CardDescription>
            Những câu hỏi có tỷ lệ trả lời đúng thấp nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Câu hỏi</TableHead>
                  <TableHead>Bài thi</TableHead>
                  <TableHead>Tỉ lệ đúng</TableHead>
                  <TableHead>Độ khó</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(examStats?.difficultQuestions)
                  ? examStats.difficultQuestions.map((question, index) => (
                    <TableRow key={`question-${index}-${question.questionId || ''}`}>
                      <TableCell className="font-medium">
                        {question?.text || 'Không xác định'}
                      </TableCell>
                      <TableCell>{question?.exam || 'Không xác định'}</TableCell>
                      <TableCell className={getScoreColor(question?.correctRate || 0)}>
                        {question?.correctRate || 0}%
                      </TableCell>
                      <TableCell>
                        {getDifficultyBadge(question?.difficulty || "medium")}
                      </TableCell>
                    </TableRow>
                  ))
                  : <TableRow><TableCell colSpan={4}>Không có câu hỏi khó</TableCell></TableRow>
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamPerformance;
