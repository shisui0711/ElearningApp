"use client";

import { useState } from "react";
import { Course } from "@prisma/client";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Building,
  GraduationCap,
} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationControls from "@/components/PaginationControls";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "@/types";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input } from "@/components/ui/input";
import EditCourseDialog from "./EditCourseDialog";
import DeleteCourseDialog from "./DeleteCourseDialog";
import DepartmentCombobox from "@/components/DepartmentCombobox";
import TeacherCombobox from "@/components/TeacherCombobox";

export default function CoursesPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<
    PaginationResponse<Course & { department?: any; teacher?: any }>
  >({
    queryKey: ["courses", pageNumber, pageSize, name, departmentId, teacherId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/courses?pageNumber=${pageNumber}&pageSize=${pageSize}&name=${name}&departmentId=${departmentId}&teacherId=${teacherId}`
      );
      return response.data;
    },
  });

  if (error)
    return (
      <div>
        <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
        <Button variant="destructive" onClick={() => router.refresh()}>
          Tải lại
        </Button>
      </div>
    );

  // Extract courses and pagination info from the response
  const courses = data?.data || [];
  const pagination = data?.pagination || {
    pageNumber: 1,
    pageSize: 10,
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

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="hidden lg:block text-2xl font-bold">
          Quản lý khóa học
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên khóa học"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <DepartmentCombobox onSelect={setDepartmentId} />
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <TeacherCombobox onSelect={setTeacherId} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Đang tải...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">
            Không tìm thấy khóa học nào.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">STT</TableHead>
                  <TableHead>Tên khóa học</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead className="text-right w-[180px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course: any, index: number) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {course.description || "Không có mô tả"}
                    </TableCell>
                    <TableCell>{course.department?.name || "N/A"}</TableCell>
                    <TableCell>
                      {course.teacher?.user?.displayName || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Sửa</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            pagination={pagination}
            onPageChange={setPageNumber}
            onPageSizeChange={handlePageSizeChange}
            itemCount={courses.length}
            itemName="khóa học"
          />
        </>
      )}

      {isEditDialogOpen && selectedCourse && (
        <EditCourseDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          course={selectedCourse}
          onSuccess={() => refetch()}
        />
      )}

      {isDeleteDialogOpen && selectedCourse && (
        <DeleteCourseDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          course={selectedCourse}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
