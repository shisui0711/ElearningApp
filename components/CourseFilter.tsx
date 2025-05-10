"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import CourseCard from "./CourseCard";
import DepartmentCombobox from "./DepartmentCombobox";
import TeacherCombobox from "./TeacherCombobox";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CourseWithDetails, PaginationResponse } from "@/types";
import PaginationControls from "./PaginationControls";

const CourseFilter = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{
    name?: string;
    departmentId?: string;
    teacherId?: string;
  }>({
    name: "",
    departmentId: "",
    teacherId: "",
  });

  const { data, isLoading } = useQuery<PaginationResponse<CourseWithDetails>>({
    queryKey: [
      "courses",
      filters.name,
      filters.departmentId,
      filters.teacherId,
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("pageNumber",pageNumber.toString());
      queryParams.append("pageSize",pageSize.toString())
      if (filters.name) queryParams.append("name", filters.name);
      if (filters.departmentId)
        queryParams.append("departmentId", filters.departmentId);
      if (filters.teacherId) queryParams.append("teacherId", filters.teacherId);
      const response = await axios.get(
        `/api/courses?${queryParams.toString()}`
      );
      return response.data;
    },
  });

  const courses = data?.data || [];

  const pagination = data?.pagination || {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageNumber(1); 
  };

  const handleReset = () => {
    setFilters({
      name: "",
      departmentId: "",
      teacherId: "",
    });
  };

  return (
    <>
      <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
        <h3 className="text-lg font-medium text-gradient-1">Lọc khóa học</h3>
        <div className="flex flex-col md:flex-row  gap-4 items-start">
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Tìm theo tên khóa học"
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <DepartmentCombobox onSelect={(departmentId)=> setFilters({...filters,departmentId})} />
          </div>

          <div className="space-y-2">
            <TeacherCombobox onSelect={(teacherId)=> setFilters({...filters,teacherId})} />
          </div>
          <Button variant="outline" onClick={handleReset}>
            Đặt lại
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-[400px] bg-card/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-xl font-medium mb-2">Không tìm thấy khóa học</h3>
          <p className="text-muted-foreground">
            Vui lòng thử lại với bộ lọc khác
          </p>
        </div>
      )}
      <PaginationControls
            pagination={pagination}
            onPageChange={setPageNumber}
            onPageSizeChange={handlePageSizeChange}
            itemCount={courses.length}
            itemName="khóa học"
          />
    </>
  );
};

export default CourseFilter;
