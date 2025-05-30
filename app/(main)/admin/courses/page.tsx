"use client";

import { useState, useRef, useEffect } from "react";
import { Course } from "@prisma/client";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Building,
  GraduationCap,
  BookOpen,
} from "lucide-react";

// Components
import { AnimatedButton } from "@/components/ui/animated-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnimation } from "@/provider/AnimationProvider";
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
import { Button } from "@/components/ui/button";

export default function CoursesPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const router = useRouter();
  const { gsap, isReady } = useAnimation();

  // Create refs for animations
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableRowElement[]>([]);

  // GSAP animations
  useEffect(() => {
    if (!isReady || !pageRef.current) return;

    // Create a timeline for page animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Animate the header
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );
    }

    // Animate the search section
    if (searchRef.current) {
      tl.fromTo(
        searchRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }

    // Animate the table
    if (tableRef.current) {
      tl.fromTo(
        tableRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.2"
      );
    }

    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap]);

  // Function to add table row to refs
  const addRowRef = (el: HTMLTableRowElement | null, index: number) => {
    if (el && tableRowsRef.current) {
      tableRowsRef.current[index] = el;
    }
  };

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
      <div className="p-6 space-y-4">
        <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
        <AnimatedButton
          variant="destructive"
          onClick={() => router.refresh()}
          animationVariant="hover"
        >
          Tải lại
        </AnimatedButton>
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
    <div ref={pageRef} className="p-6 space-y-6">
      {/* Header section with gradient text */}
      <div ref={headerRef} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient-1 mb-1">Quản lý khóa học</h1>
          <p className="text-muted-foreground">Quản lý danh sách các khóa học trong hệ thống</p>
        </div>
        <AnimatedButton
          onClick={() => router.push("/admin/courses/create")}
          animationVariant="hover"
          gradientVariant="gradient1"
          className="text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm khóa học mới
        </AnimatedButton>
      </div>

      {/* Search and filter section */}
      <div ref={searchRef} className="flex gap-4 p-4 glass rounded-lg">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên khóa học"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-9 border-primary/20 focus-visible:ring-primary/30"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        </div>

        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <DepartmentCombobox onSelect={setDepartmentId} />
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <TeacherCombobox onSelect={setTeacherId} />
        </div>
        <Button variant="outline" onClick={() => {
          setName("");
          setDepartmentId("");
          setTeacherId("");
        }}>
          Đặt lại
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 glass rounded-lg">
          <p className="text-primary animate-pulse-slow">Đang tải...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 glass rounded-lg">
          <BookOpen className="h-12 w-12 text-primary/50 mb-2" />
          <p className="text-muted-foreground mb-4">
            Không tìm thấy khóa học nào.
          </p>
          <AnimatedButton
            variant="outline"
            className="border-primary/20"
            animationVariant="hover"
            onClick={() => {
              setName("");
              setDepartmentId("");
              setTeacherId("");
            }}
          >
            Xóa bộ lọc
          </AnimatedButton>
        </div>
      ) : (
        <>
          <div ref={tableRef} className="glass rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableHead className="w-[80px] font-semibold text-primary">STT</TableHead>
                  <TableHead className="font-semibold text-primary">Tên khóa học</TableHead>
                  <TableHead className="font-semibold text-primary">Mô tả</TableHead>
                  <TableHead className="font-semibold text-primary">Khoa</TableHead>
                  <TableHead className="font-semibold text-primary">Giảng viên</TableHead>
                  <TableHead className="text-right w-[180px] font-semibold text-primary">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course: any, index: number) => (
                  <TableRow
                    key={course.id}
                    ref={(el) => addRowRef(el, index)}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {course.description || "Không có mô tả"}
                    </TableCell>
                    <TableCell>{course.department?.name || "N/A"}</TableCell>
                    <TableCell>
                      {course.teacher?.user?.displayName || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-primary/20 hover:border-primary/50 hover:bg-primary/10"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsEditDialogOpen(true);
                          }}
                          animationVariant="hover"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                          <span className="sr-only">Sửa</span>
                        </AnimatedButton>
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsDeleteDialogOpen(true);
                          }}
                          animationVariant="hover"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Xóa</span>
                        </AnimatedButton>
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
