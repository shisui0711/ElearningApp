"use client";

import React from "react";
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

// Example exam performance data
const examData = [
  {
    id: 1,
    name: "Midterm - Introduction to CS",
    avgScore: 78,
    attempts: 420,
    passingRate: 92,
  },
  {
    id: 2,
    name: "Final - Business Analytics",
    avgScore: 82,
    attempts: 352,
    passingRate: 95,
  },
  {
    id: 3,
    name: "Quiz 3 - Digital Marketing",
    avgScore: 76,
    attempts: 330,
    passingRate: 88,
  },
  {
    id: 4,
    name: "Midterm - Data Structures",
    avgScore: 72,
    attempts: 298,
    passingRate: 86,
  },
  {
    id: 5,
    name: "Quiz 2 - Machine Learning",
    avgScore: 68,
    attempts: 275,
    passingRate: 82,
  },
];

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
  return <Badge className="bg-red-500">Poor</Badge>;
};

const ExamPerformance = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h3 className="text-2xl font-bold">Phân tích hiệu suất bài this</h3>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toàn trường</SelectItem>
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
              Điểm thi trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bài thi đã giao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,874</div>
            <p className="text-xs text-muted-foreground">
              +234 so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tỷ lệ vượt qua trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">
              +3.2% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Độ chính xác của câu hỏi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              +1.8% so với tháng trước
            </p>
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
            <BarChart />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hiệu suất bài thi</CardTitle>
            <CardDescription>Hiệu suất bài thi theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart />
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
              {examData.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell>{exam.attempts}</TableCell>
                  <TableCell className={getScoreColor(exam.avgScore)}>
                    {exam.avgScore}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{exam.passingRate}%</span>
                      {getPassingRateBadge(exam.passingRate)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <TableRow>
                <TableCell className="font-medium">
                  Explain the concept of polymorphism
                </TableCell>
                <TableCell>OOP Fundamentals</TableCell>
                <TableCell className="text-red-600">42%</TableCell>
                <TableCell>
                  <Badge className="bg-red-500">Hard</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Calculate the Time Complexity
                </TableCell>
                <TableCell>Data Structures</TableCell>
                <TableCell className="text-orange-600">48%</TableCell>
                <TableCell>
                  <Badge className="bg-orange-500">Medium</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  Market Segmentation Analysis
                </TableCell>
                <TableCell>Marketing Fundamentals</TableCell>
                <TableCell className="text-orange-600">53%</TableCell>
                <TableCell>
                  <Badge className="bg-orange-500">Medium</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamPerformance;
