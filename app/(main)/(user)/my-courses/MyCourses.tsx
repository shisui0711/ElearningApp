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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
              />
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
