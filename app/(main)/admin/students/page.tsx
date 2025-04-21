"use client";

import { useState } from "react";
import { Student } from "@prisma/client";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Download,
  Upload,
  Search,
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

export default function StudentsPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [classId, setClassId] = useState("");
  const router = useRouter();

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
      <div>
        <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
        <Button variant="destructive" onClick={() => router.refresh()}>
          Tải lại
        </Button>
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="hidden lg:block text-2xl font-bold">
          Quản lý sinh viên
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:block">Import Excel</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden lg:block">Export Excel</span>
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="lg:mr-2 h-4 w-4" />
            <span className="hidden lg:block">Thêm sinh viên mới</span>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên sinh viên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <ClassCombobox onSelect={setClassId}  />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Đang tải...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">
            Không tìm thấy sinh viên nào.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">STT</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead className="text-right w-[180px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any, index: number) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>{student.user.displayName}</TableCell>
                    <TableCell>{student.user.email}</TableCell>
                    <TableCell>{student.user.username}</TableCell>
                    <TableCell>
                      {student.class?.name || "Chưa phân lớp"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedStudent(student);
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
                            setSelectedStudent(student);
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
