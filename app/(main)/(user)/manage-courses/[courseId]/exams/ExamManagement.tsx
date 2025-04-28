"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  FileCheck, 
  User, 
  Clock, 
  CalendarClock,
  FilterX,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface ExamAttempt {
  id: string;
  name: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  score: number | null;
  duration: number;
  student: Student | null;
  class: {
    id: string;
    name: string;
  };
  exam: {
    id: string;
    title: string;
    questions: {
      id: string;
      question: {
        id: string;
        content: string;
        points: number;
      };
    }[];
  };
  answers: {
    answerId: string;
    questionId: string;
    answer: {
      id: string;
      content: string;
      isCorrect: boolean;
    };
    question: {
      id: string;
      content: string;
      points: number;
    };
  }[];
  createdAt: Date;
}

interface ExamManagementProps {
  courseId: string;
  courseTitle: string;
  examAttempts: ExamAttempt[];
  classes: Class[];
  selectedClassId?: string;
  examName?: string;
  studentName?: string;
  status?: string;
}

export default function ExamManagement({
  courseId,
  courseTitle,
  examAttempts,
  classes,
  selectedClassId,
  examName,
  studentName,
  status,
}: ExamManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(examName || "");
  const [classFilter, setClassFilter] = useState(selectedClassId || "all");
  const [studentFilter, setStudentFilter] = useState(studentName || "");
  const [statusFilter, setStatusFilter] = useState(status || "all");

  // Calculate total points for an exam attempt
  const calculateTotalPoints = (attempt: ExamAttempt) => {
    return attempt.exam.questions.reduce((total, question) => {
      return total + question.question.points;
    }, 0);
  };

  // Calculate score percentage
  const calculatePercentage = (score: number | null, totalPoints: number) => {
    if (score === null || totalPoints === 0) return 0;
    return Math.round((score / totalPoints) * 100);
  };

  // Handle search
  const handleSearch = () => {
    let params = new URLSearchParams();
    
    if (classFilter && classFilter !== "all") {
      params.set("class", classFilter);
    }
    
    if (searchTerm.trim()) {
      params.set("name", searchTerm.trim());
    }
    
    if (studentFilter.trim()) {
      params.set("student", studentFilter.trim());
    }
    
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    
    router.push(`/manage-courses/${courseId}/exams?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setClassFilter("all");
    setStudentFilter("");
    setStatusFilter("all");
    router.push(`/manage-courses/${courseId}/exams`);
  };

  // Get initials from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Filter exams client-side for student name and status
  const filteredExamAttempts = examAttempts.filter(attempt => {
    // Filter by student name (if provided)
    if (studentFilter && attempt.student) {
      const studentName = attempt.student.user.displayName.toLowerCase();
      if (!studentName.includes(studentFilter.toLowerCase())) {
        return false;
      }
    }
    
    // Filter by status (if not "all")
    if (statusFilter === "completed" && !attempt.finishedAt) {
      return false;
    }
    if (statusFilter === "pending" && attempt.finishedAt) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="container py-8 mx-auto px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Link href={`/manage-courses/${courseId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Quản lý bài kiểm tra - {courseTitle}
          </h1>
        </div>

        {/* Filter controls */}
        <Card>
          <CardHeader>
            <CardTitle>Lọc bài kiểm tra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả các lớp</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo tên bài kiểm tra"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo tên sinh viên"
                      value={studentFilter}
                      onChange={(e) => setStudentFilter(e.target.value)}
                      className="pl-8"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="completed">Đã hoàn thành</SelectItem>
                      <SelectItem value="pending">Chưa hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button onClick={handleSearch}>Lọc</Button>
                <Button variant="outline" onClick={clearFilters}>
                  <FilterX className="mr-2 h-4 w-4" />
                  Xóa lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam attempts table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách bài kiểm tra trắc nghiệm</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExamAttempts.length === 0 ? (
              <div className="text-center py-10">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Không có bài kiểm tra nào
                </h3>
                <p className="text-muted-foreground">
                  Không tìm thấy bài kiểm tra nào theo điều kiện lọc.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">
                        Tên bài kiểm tra
                      </TableHead>
                      <TableHead className="text-center">Sinh viên</TableHead>
                      <TableHead className="text-center">Lớp</TableHead>
                      <TableHead className="text-center">
                        Thời gian làm bài
                      </TableHead>
                      <TableHead className="text-center">Điểm số</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExamAttempts.map((attempt) => {
                      const totalPoints = calculateTotalPoints(attempt);

                      return (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium text-center">
                            {attempt.name || attempt.exam.title}
                          </TableCell>
                          <TableCell>
                            {attempt.student ? (
                              <div className="flex items-center justify-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={attempt.student.user.avatarUrl || ""}
                                    alt={attempt.student.user.displayName}
                                  />
                                  <AvatarFallback>
                                    {getInitials(
                                      attempt.student.user.displayName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{attempt.student.user.displayName}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Không xác định
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {attempt.class.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{attempt.duration} phút</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {attempt.finishedAt ? (
                              <div className="flex flex-col items-center">
                                <span className="font-medium">
                                  {parseFloat(
                                    (
                                      (attempt.score || 0) / totalPoints * 10
                                    ).toFixed(1)
                                  )} điểm
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Chưa hoàn thành
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                attempt.finishedAt ? "default" : "outline"
                              }
                            >
                              {attempt.finishedAt
                                ? "Đã hoàn thành"
                                : "Chưa hoàn thành"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-muted-foreground">
                              <CalendarClock className="mr-1 h-4 w-4" />
                              <span>{formatDate(attempt.createdAt)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 