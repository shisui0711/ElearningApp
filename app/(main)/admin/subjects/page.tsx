"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import CreateSubjectDialog from "./CreateSubjectDialog";
import EditSubjectDialog from "./EditSubjectDialog";
import DeleteSubjectDialog from "./DeleteSubjectDialog";
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
import axios from "axios";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import DepartmentCombobox from "@/components/DepartmentCombobox";

interface Subject {
  id: string;
  name: string;
  description?: string;
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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  return (
    <div ref={pageRef} className="p-6 space-y-6">
      {/* Header section with gradient text */}
      <div ref={headerRef} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient-1 mb-1">Quản lý môn học</h1>
          <p className="text-muted-foreground">Quản lý danh sách các môn học trong hệ thống</p>
        </div>
        <AnimatedButton
          onClick={() => setIsCreateDialogOpen(true)}
          animationVariant="hover"
          gradientVariant="gradient1"
          className="text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm môn học mới
        </AnimatedButton>
      </div>

      {/* Search and filter section */}
      <div ref={searchRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass rounded-lg">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên môn học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-primary/20 focus-visible:ring-primary/30"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        </div>
        <DepartmentCombobox onSelect={setDepartmentId} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 glass rounded-lg">
          <p className="text-primary animate-pulse-slow">Đang tải...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 glass rounded-lg">
          <BookOpen className="h-12 w-12 text-primary/50 mb-2" />
          <p className="text-muted-foreground mb-4">
            Không tìm thấy môn học nào.
          </p>
          <AnimatedButton
            variant="outline"
            className="border-primary/20"
            animationVariant="hover"
            onClick={() => {
              setSearchQuery("");
              setDepartmentId("");
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
                  <TableHead className="w-[50px] font-semibold text-primary">STT</TableHead>
                  <TableHead className="font-semibold text-primary">Tên môn học</TableHead>
                  <TableHead className="font-semibold text-primary">Mô tả</TableHead>
                  <TableHead className="font-semibold text-primary">Khoa</TableHead>
                  <TableHead className="text-right font-semibold text-primary">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject: Subject, index: number) => (
                  <TableRow
                    key={subject.id}
                    ref={(el) => addRowRef(el, index)}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {subject.description}
                    </TableCell>
                    <TableCell>{subject.department?.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-primary/20 hover:border-primary/50 hover:bg-primary/10"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setIsEditDialogOpen(true);
                          }}
                          animationVariant="hover"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                          <span className="sr-only">Edit</span>
                        </AnimatedButton>
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setIsDeleteDialogOpen(true);
                          }}
                          animationVariant="hover"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
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
