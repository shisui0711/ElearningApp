"use client";

import React, { useState } from "react";
import { ClassFilterSelect } from "./ClassFilterSelect";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import CreateFileAssignmentDialog from "./CreateFileAssignmentDialog";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  type: string;
  class: {
    id: string;
    name: string;
  } | null;
  _count: {
    submissions: number;
  };
}

interface FilteredFileAssignmentsProps {
  assignments: Assignment[];
  courseId: string;
  classes: { id: string; name: string }[];
  students: { id: string; user: { displayName: string } }[];
}

export function FilteredFileAssignments({ 
  assignments, 
  courseId, 
  classes,
  students
}: FilteredFileAssignmentsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  
  const filteredAssignments = assignments.filter(assignment => {
    if (selectedClassId === "all") return true;
    return assignment.class?.id === selectedClassId;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">
            Danh sách bài tập nộp file
          </h3>
          <ClassFilterSelect 
            classes={classes} 
            onFilterChange={setSelectedClassId} 
          />
        </div>
        <CreateFileAssignmentDialog
          courseId={courseId}
          classes={classes}
          students={students}
        />
      </div>
      
      {filteredAssignments.length > 0 ? (
        filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">
                  {assignment.title}
                </h3>
              </div>

              <p className="text-muted-foreground text-sm mt-1">
                {assignment.description || "Không có mô tả"}
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="bg-cyan-100 text-cyan-800"
                >
                  Nộp file
                </Badge>

                {assignment.class && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    Lớp: {assignment.class.name}
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800"
                >
                  Hạn nộp:{" "}
                  {format(
                    new Date(assignment.dueDate),
                    "dd/MM/yyyy",
                    {
                      locale: vi,
                    }
                  )}
                </Badge>

                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  {assignment._count.submissions} bài nộp
                </Badge>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/manage-courses/${courseId}/assignments/${assignment.id}`}
              >
                <Button variant="outline" size="sm">
                  <PenLine className="mr-1 h-4 w-4" />
                  Quản lý
                </Button>
              </Link>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            Không có bài tập nộp file nào {selectedClassId !== "all" ? "cho lớp này" : ""}
          </p>
        </div>
      )}
    </div>
  );
} 