"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, Search, GraduationCap, School } from "lucide-react";
import CreateClassDialog from "./CreateClassDialog";
import EditClassDialog from "./EditClassDialog";
import DeleteClassDialog from "./DeleteClassDialog";
import { AnimatedButton } from "@/components/ui/animated-button";
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
import { useAnimation } from "@/provider/AnimationProvider";

interface Class {
  id: string;
  name: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
}

export default function ClassesPage() {
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

  const { data, isLoading, error } = useQuery<PaginationResponse<Class>>({
    queryKey: ["classes", pageNumber, pageSize, searchQuery, departmentId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/classes?pageNumber=${pageNumber}&pageSize=${pageSize}&searchQuery=${searchQuery}&departmentId=${departmentId}`
      );
      return response.data;
    },
  });

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

  // Animate table rows when data changes
  useEffect(() => {
    if (!isReady || tableRowsRef.current.length === 0) return;

    gsap.fromTo(
      tableRowsRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out"
      }
    );
  }, [isReady, gsap, data]);

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-destructive mb-2">Có lỗi xảy ra khi tải dữ liệu</h3>
          <p className="text-muted-foreground mb-4">Vui lòng thử lại sau hoặc liên hệ quản trị viên</p>
        </div>
        <AnimatedButton
          variant="destructive"
          onClick={() => router.refresh()}
          animationVariant="pulse"
        >
          Tải lại
        </AnimatedButton>
      </div>
    );

  const classes = data?.data || [];
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
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Function to add table row to refs
  const addRowRef = (el: HTMLTableRowElement | null, index: number) => {
    if (el && tableRowsRef.current) {
      tableRowsRef.current[index] = el;
    }
  };

  return (
    <div ref={pageRef} className="p-6 space-y-6">
      {/* Header section with gradient text */}
      <div ref={headerRef} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient-1 mb-1">Quản lý lớp học</h1>
          <p className="text-muted-foreground">Quản lý danh sách các lớp học trong hệ thống</p>
        </div>
        <AnimatedButton
          onClick={() => setIsCreateDialogOpen(true)}
          animationVariant="hover"
          gradientVariant="gradient1"
          className="text-white"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm lớp mới
        </AnimatedButton>
      </div>

      {/* Search and filter section */}
      <div ref={searchRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 glass rounded-lg">
        <div className="relative">
          <Input
            placeholder="Tìm theo tên lớp"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-primary/20 focus-visible:ring-primary/30"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        </div>
        <DepartmentCombobox onSelect={setDepartmentId} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 glass rounded-lg animate-pulse-slow">
          <div className="text-center">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 text-primary animate-float" />
            <p className="text-primary font-medium">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 glass rounded-lg p-6">
          <School className="h-16 w-16 text-primary/60 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Không tìm thấy lớp học</h3>
          <p className="text-muted-foreground text-center mb-4">
            Không tìm thấy lớp học nào thỏa mãn điều kiện tìm kiếm.
          </p>
          <AnimatedButton
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setDepartmentId("");
            }}
            animationVariant="hover"
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
                  <TableHead className="font-semibold text-primary">Tên lớp</TableHead>
                  <TableHead className="font-semibold text-primary">Khoa</TableHead>
                  <TableHead className="text-right w-[180px] font-semibold text-primary">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem: Class, index: number) => (
                  <TableRow
                    key={classItem.id}
                    ref={(el) => addRowRef(el, index)}
                    className="border-b border-primary/10 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {(pageNumber - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.department?.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AnimatedButton
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-primary/20 hover:border-primary/50 hover:bg-primary/10"
                          onClick={() => {
                            setSelectedClass(classItem);
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
                            setSelectedClass(classItem);
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
            itemCount={classes.length}
            itemName="lớp"
          />
        </>
      )}

      {isCreateDialogOpen && (
        <CreateClassDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}

      {isEditDialogOpen && selectedClass && (
        <EditClassDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          classItem={selectedClass}
        />
      )}

      {isDeleteDialogOpen && selectedClass && (
        <DeleteClassDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          classItem={selectedClass}
        />
      )}
    </div>
  );
}
