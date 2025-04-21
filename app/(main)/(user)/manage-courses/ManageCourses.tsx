"use client";

import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useSession } from "@/provider/SessionProvider";

import CreateCourseDialog from "./CreateCourseDialog";
import DeleteCourseDialog from "./DeleteCourseDialog";
import { Button } from "@/components/ui/button";
import PaginationControls from "@/components/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import ManageCourseCard from "@/components/ManageCourseCard";
import { CourseWithDetails, PaginationResponse } from "@/types";;
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function ManageCourses() {
  const { user } = useSession();
  if (!user.teacher) return;
  const teacherId = user.teacher.id;
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithDetails | null>(null);

  const { data, isLoading, error } = useQuery<PaginationResponse<CourseWithDetails>>({
    queryKey: ["courses", pageNumber, pageSize,teacherId],
    queryFn: async () => {
      const response = await axios.get(`/api/courses/teacher/${teacherId}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
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

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize); 
    setPageNumber(1); // Reset to first page when changing page size
  };

  // Check if user can edit or delete a course
  const canModifyCourse = (course: CourseWithDetails) => {
    if (!user) return false;
    const isAdmin = user.role === "ADMIN";
    const isTeacherOwner =
      user.role === "TEACHER" && course.teacher.user.id === user.id;
    return isAdmin || isTeacherOwner;
  };

  return (
    <div className="container py-8 mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        {teacherId && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo khóa học mới
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error.message}</div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">
                Không có khóa học nào
              </h2>
              {teacherId && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo khóa học mới
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div key={course.id} className="relative">
                  <ManageCourseCard course={course} />
                  {canModifyCourse(course) && (
                    <div className="absolute top-3 right-3 flex space-x-2 z-10">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCourse(course);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
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
        </>
      )}

      {teacherId && isCreateDialogOpen && (
        <CreateCourseDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          teacherId={teacherId}
        />
      )}  

      {isDeleteDialogOpen && selectedCourse && (
        <DeleteCourseDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          course={selectedCourse}
        />
      )}
    </div>
  );
}
