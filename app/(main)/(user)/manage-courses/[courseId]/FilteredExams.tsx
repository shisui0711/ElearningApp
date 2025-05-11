"use client";

import React, { useState } from "react";
import { ClassFilterSelect } from "./ClassFilterSelect";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import AssignExamButton from "./AssignExamButton";

interface Exam {
  id: string;
  name: string | null;
  class: { id: string; name: string };
  expirateAt: Date | null;
  notStarted: number;
  inProgress: number;
  completed: number;
  total: number;
}

interface FilteredExamsProps {
  exams: Exam[];
  courseId: string;
  classes: { id: string; name: string }[];
}

export function FilteredExams({
  exams,
  courseId,
  classes,
}: FilteredExamsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const filteredExams = exams.filter((exam) => {
    if (selectedClassId === "all") return true;
    return exam.class.id === selectedClassId;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Danh sách bài kiểm tra</h3>
          <ClassFilterSelect
            classes={classes}
            selectedClassId={selectedClassId}
            onFilterChange={setSelectedClassId}
          />
        </div>
        <AssignExamButton courseId={courseId} />
      </div>

      {filteredExams.length > 0 ? (
        filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="border rounded-md p-4 flex justify-between items-center group hover:border-primary transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{exam.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800"
                >
                  Bài kiểm tra
                </Badge>

                {exam.class && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    Lớp: {exam.class.name}
                  </Badge>
                )}

                {exam.expirateAt && (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800"
                  >
                    Hạn nộp:{" "}
                    {format(new Date(exam.expirateAt), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </Badge>
                )}

                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Chưa làm: {exam.notStarted}
                </Badge>

                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Đang làm: {exam.inProgress}
                </Badge>

                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  Hoàn thành: {exam.completed}
                </Badge>

                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Tổng: {exam.total}
                </Badge>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/manage-courses/${courseId}/exams?class=${
                  exam.class.id
                }&name=${encodeURIComponent(exam.name || "")}`}
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
            Không có bài kiểm tra nào{" "}
            {selectedClassId !== "all" ? "cho lớp này" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
