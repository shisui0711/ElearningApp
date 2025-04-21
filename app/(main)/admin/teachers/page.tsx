"use client";

import { useState } from "react";
import { Teacher } from "@prisma/client";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";

// Components
import CreateTeacherDialog from "@/app/(main)/admin/teachers/CreateTeacherDialog";
import EditTeacherDialog from "@/app/(main)/admin/teachers/EditTeacherDialog";
import DeleteTeacherDialog from "@/app/(main)/admin/teachers/DeleteTeacherDialog";
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
import axios from "axios";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function TeachersPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use the custom hook to fetch paginated teachers
  const { data, isLoading, error } = useQuery<PaginationResponse<Teacher>>({
    queryKey: ["teachers", pageNumber, pageSize,searchQuery],
    queryFn: async () => {
      const response = await axios.get(
        `/api/teachers?pageNumber=${pageNumber}&pageSize=${pageSize}&searchQuery=${searchQuery}`
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

  // Extract teachers and pagination info from the response
  const teachers = data?.data || [];
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
  const [selectedTeacher, setSelectedTeacher] = useState<
    (Teacher & { user: any }) | null
  >(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý giảng viên</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm giảng viên mới
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên giáo viên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Đang tải...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">
            Không tìm thấy giáo viên nào.
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
                  <TableHead className="text-right w-[180px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher: any, index: number) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>{teacher.user.displayName}</TableCell>
                    <TableCell>{teacher.user.email}</TableCell>
                    <TableCell>{teacher.user.username}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
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
            itemCount={teachers.length}
            itemName="giảng viên"
          />
        </>
      )}

      {/* Dialogs */}
      {isCreateDialogOpen && (
        <CreateTeacherDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}

      {isEditDialogOpen && selectedTeacher && (
        <EditTeacherDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          teacher={selectedTeacher}
        />
      )}

      {isDeleteDialogOpen && selectedTeacher && (
        <DeleteTeacherDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          teacher={selectedTeacher}
        />
      )}
    </div>
  );
}
