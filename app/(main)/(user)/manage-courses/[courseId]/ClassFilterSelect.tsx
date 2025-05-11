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
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface ClassFilterSelectProps {
  classes: { id: string; name: string }[];
  selectedClassId?: string;
  paramName: string;
  courseId: string;
}

export function ClassFilterSelect({ classes, selectedClassId, paramName, courseId }: ClassFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const handleClassChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "all") {
      params.delete(paramName);
    } else {
      params.set(paramName, value);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center">
      <Select 
        value={selectedClassId || "all"} 
        onValueChange={handleClassChange}
      >
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Lọc theo lớp" />
          </div>
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
