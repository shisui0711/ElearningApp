"use client";

import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassFilterSelectProps {
  classes: { id: string; name: string }[];
  onFilterChange: (classId: string) => void;
}

export function ClassFilterSelect({
  classes,
  onFilterChange,
}: ClassFilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select defaultValue="all" onValueChange={onFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Lọc theo lớp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả các lớp</SelectItem>
          {classes.map((classItem) => (
            <SelectItem key={classItem.id} value={classItem.id}>
              {classItem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
