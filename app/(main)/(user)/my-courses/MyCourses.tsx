"use client";

import { GraduationCap } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import CourseCard from "@/components/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import PaginationControls from "@/components/PaginationControls";
import { useQuery } from "@tanstack/react-query";
import { CourseWithDetails, PaginationResponse } from "@/types";
import axios from "axios";
import dynamic from 'next/dynamic';
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";

// Dynamically import CourseCompletionStatus
const CourseCompletionStatus = dynamic(() => import('@/components/CourseCompletionStatus'), {
  loading: () => <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
});

const MyCourses = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { data, isLoading, error } = useQuery<PaginationResponse<CourseWithDetails>>({
    queryKey: ["enroll-courses", pageNumber, pageSize],
    queryFn: async () => {
      const response = await axios.get(`/api/courses/enroll?pageNumber=${pageNumber}&pageSize=${pageSize}`);
      return response.data;
    },
  });
  const courses = data?.data || [];
  const pagination = data?.pagination || {
    pageNumber: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  };

  return (
    <div className="h-full pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <GraduationCap className="size-8 text-primary" />
          <h1 className="text-3xl font-bold">Các môn học của tôi</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p>{error.message}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">
              Bạn chưa đăng ký môn học nào.
            </h2>
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Đăng ký môn học
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
            {courses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-40 relative">
                      <Image
                        src={course.imageUrl || "/images/course-placeholder.png"}
                        alt={course.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1">
                      <div className="mb-2">
                        <span className="text-sm font-medium px-3 py-1 bg-primary/10 rounded-full text-primary">
                          {course.department?.name || "Khoa"}
                        </span>
                      </div>
                      <Link href={`/course/${course.id}`} prefetch={false}>
                        <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">{course.name}</h3>
                      </Link>
                      <p className="text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                      
                      {/* Course Completion Status */}
                      <div className="mt-auto">
                        <CourseCompletionStatus courseId={course.id} />
                      </div>
                    </div>
                    <div className="p-5 border-l md:w-64 flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-4">
                        <UserAvatar size="sm" avatarUrl={course.teacher?.user?.avatarUrl} />
                        <div className="text-sm text-muted-foreground">
                          <p>{course.teacher?.user?.displayName || "Giảng viên"}</p>
                        </div>
                      </div>
                      <Link 
                        href={`/course/${course.id}`}
                        className="w-full mt-auto px-4 py-2 bg-primary text-white rounded-md text-center text-sm hover:bg-primary/90 transition-colors"
                      >
                        Tiếp tục học
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {courses.length > 0 && (
          <div className="mt-8">
            <PaginationControls
              pagination={pagination}
              onPageChange={setPageNumber}
              onPageSizeChange={handlePageSizeChange}
              itemCount={courses.length}
              itemName="khóa học"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
