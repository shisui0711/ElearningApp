import React from 'react'
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookOpen } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import PaginationControls from "@/components/PaginationControls";
import { CourseWithDetails, PaginationResponse } from "@/types";

const SearchPage = async ({ searchParams }: { searchParams: { query?: string, departmentId?: string, teacherId?: string, page?: string, pageSize?: string } }) => {
  const query = searchParams.query || "";
  const departmentId = searchParams.departmentId || "";
  const teacherId = searchParams.teacherId || "";
  const page = parseInt(searchParams.page || "1");
  const pageSize = parseInt(searchParams.pageSize || "8");

  // Build query params for API call
  const queryParams = new URLSearchParams();
  queryParams.append("pageNumber", page.toString());
  queryParams.append("pageSize", pageSize.toString());
  if (query) queryParams.append("name", query);
  if (departmentId) queryParams.append("departmentId", departmentId);
  if (teacherId) queryParams.append("teacherId", teacherId);

  // Fetch courses from API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/courses?${queryParams.toString()}`, {
    cache: 'no-store'
  });
  
  const data: PaginationResponse<CourseWithDetails> = await response.json();
  const courses = data.data || [];
  const pagination = data.pagination;

  // Fetch departments for select options
  const departmentsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/departments`, {
    cache: 'no-store'
  });
  const departments = await departmentsRes.json();
  
  // Fetch teachers for select options
  const teachersRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/teachers`, {
    cache: 'no-store'
  });
  const teachers = await teachersRes.json();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">
        {query ? `Kết quả tìm kiếm cho: "${query}"` : "Tìm kiếm khóa học"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc tìm kiếm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action="/search" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="query" className="text-sm font-medium">Tên khóa học</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="query"
                      name="query"
                      placeholder="Tìm kiếm khóa học"
                      defaultValue={query}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="departmentId" className="text-sm font-medium">Khoa/Bộ môn</label>
                  <Select name="departmentId" defaultValue={departmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khoa/bộ môn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả</SelectItem>
                      {departments?.data?.map((department: any) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="teacherId" className="text-sm font-medium">Giảng viên</label>
                  <Select name="teacherId" defaultValue={teacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giảng viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả</SelectItem>
                      {teachers?.data?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    Tìm kiếm
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Không tìm thấy khóa học nào</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Hãy thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm lại
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/search'}>
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Hiển thị {courses.length} trên {pagination.totalCount} kết quả
                </p>
                <Select 
                  defaultValue={pageSize.toString()}
                  onValueChange={(value) => {
                    const params = new URLSearchParams(searchParams as Record<string, string>);
                    params.set("pageSize", value);
                    params.set("page", "1");
                    window.location.href = `/search?${params.toString()}`;
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Số lượng hiển thị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 khóa học</SelectItem>
                    <SelectItem value="8">8 khóa học</SelectItem>
                    <SelectItem value="12">12 khóa học</SelectItem>
                    <SelectItem value="16">16 khóa học</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <PaginationControls 
                  pagination={pagination}
                  onPageChange={(newPage) => {
                    const params = new URLSearchParams(searchParams as Record<string, string>);
                    params.set("page", newPage.toString());
                    window.location.href = `/search?${params.toString()}`;
                  }}
                  onPageSizeChange={(newSize) => {
                    const params = new URLSearchParams(searchParams as Record<string, string>);
                    params.set("pageSize", newSize.toString());
                    params.set("page", "1");
                    window.location.href = `/search?${params.toString()}`;
                  }}
                  itemCount={courses.length}
                  itemName="khóa học"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage