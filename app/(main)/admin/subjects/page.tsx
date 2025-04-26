"use client";

import { useState } from "react";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import CreateSubjectDialog from "./CreateSubjectDialog";
import EditSubjectDialog from "./EditSubjectDialog";
import DeleteSubjectDialog from "./DeleteSubjectDialog";
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
import DepartmentCombobox from "@/components/DepartmentCombobox";

interface Subject {
  id: string;
  name: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
}

export default function SubjectsPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const router = useRouter();

  const { data, isLoading, error } = useQuery<PaginationResponse<Subject>>({
    queryKey: ["subjects", pageNumber, pageSize, searchQuery, departmentId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/subjects?pageNumber=${pageNumber}&pageSize=${pageSize}&searchQuery=${searchQuery}&departmentId=${departmentId}`
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

  const subjects = data?.data || [];
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
    setSearchQuery("");
    setDepartmentId("");
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý môn học</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm môn học mới
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên môn học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <DepartmentCombobox value={departmentId} onSelect={setDepartmentId} />
        <Button variant="outline" onClick={handleReset}>Đặt lại</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Đang tải...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/30 rounded-md">
          <p className="text-muted-foreground mb-4">Không tìm thấy môn học nào thỏa mãn điều kiện.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">STT</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead className="text-right w-[180px]">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject: Subject, index: number) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.department?.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedSubject(subject);
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
                            setSelectedSubject(subject);
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
            itemCount={subjects.length}
            itemName="môn học"
          />
        </>
      )}

      {isCreateDialogOpen && (
        <CreateSubjectDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}

      {isEditDialogOpen && selectedSubject && (
        <EditSubjectDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          subject={selectedSubject}
        />
      )}

      {isDeleteDialogOpen && selectedSubject && (
        <DeleteSubjectDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          subject={selectedSubject}
        />
      )}
    </div>
  );
}
