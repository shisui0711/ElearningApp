"use client";

import { useState, useRef, useEffect } from "react";
import { Student } from "@prisma/client";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Download,
  Upload,
  Search,
  GraduationCap,
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
import CreateStudentDialog from "./CreateStudentDialog";
import EditStudentDialog from "./EditStudentDialog";
import DeleteStudentDialog from "./DeleteStudentDialog";
import ImportStudentsDialog from "./ImportStudentsDialog";
import ExportStudentsDialog from "./ExportStudentsDialog";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "@/types";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Input } from "@/components/ui/input";
import ClassCombobox from "@/components/ClassCombobox";
import { Button } from "@/components/ui/button";

export default function StudentsPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [classId, setClassId] = useState("");
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
    PaginationResponse<Student>
  >({
    queryKey: ["students", pageNumber, pageSize,searchQuery,classId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/students?pageNumber=${pageNumber}&pageSize=${pageSize}&searchQuery=${searchQuery}&classId=${classId}`
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

  // Extract students and pagination info from the response
  const students = data?.data || [];
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<
    (Student & { user: any; class?: any }) | null
  >(null);

  return (
    <div ref={pageRef} className="p-6 space-y-6">
      {/* Header section with gradient text */}
      <div ref={headerRef} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient-1 mb-1">Quản lý sinh viên</h1>
          <p className="text-muted-foreground">Quản lý danh sách sinh viên trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="gap-2 border-primary/20 hover:border-primary/50"
            animationVariant="hover"
          >
            <Download className="h-4 w-4 text-primary" />
            <span className="hidden lg:block">Import Excel</span>
          </AnimatedButton>
          <AnimatedButton
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            className="gap-2 border-primary/20 hover:border-primary/50"
            animationVariant="hover"
          >
            <Upload className="h-4 w-4 text-primary" />
            <span className="hidden lg:block">Export Excel</span>
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setIsCreateDialogOpen(true)}
            animationVariant="hover"
            gradientVariant="gradient1"
            className="text-white"
          >
            <PlusCircle className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:block">Thêm sinh viên mới</span>
          </AnimatedButton>
        </div>
      </div>

      {/* Search and filter section */}
      <div ref={searchRef} className="flex gap-4 p-4 glass rounded-lg">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên sinh viên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-primary/20 focus-visible:ring-primary/30"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        </div>
        <ClassCombobox onSelect={setClassId} />
        <Button variant="outline" onClick={() => {
          setSearchQuery("");
          setClassId("");
        }}>
          Đặt lại
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 glass rounded-lg">
          <p className="text-primary animate-pulse-slow">Đang tải...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 glass rounded-lg">
          <GraduationCap className="h-12 w-12 text-primary/50 mb-2" />
          <p className="text-muted-foreground mb-4">
            Không tìm thấy sinh viên nào.
          </p>
          <AnimatedButton
            variant="outline"
            className="border-primary/20"
            animationVariant="hover"
            onClick={() => {
              setSearchQuery("");
              setClassId("");
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
                  <TableHead className="font-semibold text-primary">Họ tên</TableHead>
                  <TableHead className="font-semibold text-primary">Email</TableHead>
                  <TableHead className="font-semibold text-primary">Tên đăng nhập</TableHead>
                  <TableHead className="font-semibold text-primary">Lớp</TableHead>
                  <TableHead className="text-right w-[180px] font-semibold text-primary">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any, index: number) => (
                  <TableRow
                    key={student.id}
                    ref={(el) => addRowRef(el, index)}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{student.user.displayName}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>{student.user.username}</TableCell>
                    <TableCell>
                      {student.class?.name || "Chưa phân lớp"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-primary/20 hover:border-primary/50 hover:bg-primary/10"
                          onClick={() => {
                            setSelectedStudent(student);
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
                            setSelectedStudent(student);
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
            itemCount={students.length}
            itemName="sinh viên"
          />
        </>
      )}

      {/* Dialogs */}
      {isCreateDialogOpen && (
        <CreateStudentDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}

      {isEditDialogOpen && selectedStudent && (
        <EditStudentDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          student={selectedStudent}
        />
      )}

      {isDeleteDialogOpen && selectedStudent && (
        <DeleteStudentDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          student={selectedStudent}
        />
      )}

      {isImportDialogOpen && (
        <ImportStudentsDialog
          open={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {isExportDialogOpen && (
        <ExportStudentsDialog
          open={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          students={students}
        />
      )}
    </div>
  );
}
