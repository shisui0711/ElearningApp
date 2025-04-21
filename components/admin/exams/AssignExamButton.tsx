"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface AssignExamButtonProps {
  examId: string;
  examTitle: string;
}

type DepartmentData = {
  id: string;
  name: string;
};

type ClassData = {
  id: string;
  name: string;
  departmentId: string;
};

type CourseData = {
  id: string;
  name: string;
  departmentId: string;
};

type StudentData = {
  id: string;
  user: {
    id: string;
    displayName: string;
  };
  classId: string | null;
};

export default function AssignExamButton({
  examId,
  examTitle,
}: AssignExamButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("department");
  const [loading, setLoading] = useState(false);

  // Data for selection options
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);

  // Selected values
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const depResponse = await fetch("/api/departments");
        const depData = await depResponse.json();
        setDepartments(depData.data || []);

        // Fetch classes
        const classResponse = await fetch("/api/classes");
        const classData = await classResponse.json();
        setClasses(classData.data || []);

        // Fetch courses
        const courseResponse = await fetch("/api/courses");
        const courseData = await courseResponse.json();
        setCourses(courseData.data || []);

        // Fetch students
        const studentResponse = await fetch("/api/students");
        const studentData = await studentResponse.json();
        setStudents(studentData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, []);

  // Filter classes by department
  useEffect(() => {
    if (selectedDepartmentId) {
      const filtered = classes.filter(
        (c) => c.departmentId === selectedDepartmentId
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedDepartmentId, classes]);

  // Filter courses by department
  useEffect(() => {
    if (selectedDepartmentId) {
      const filtered = courses.filter(
        (c) => c.departmentId === selectedDepartmentId
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [selectedDepartmentId, courses]);

  // Filter students by class
  useEffect(() => {
    if (selectedClassId) {
      const filtered = students.filter((s) => s.classId === selectedClassId);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClassId, students]);

  const handleAssignToDepartment = async () => {
    if (!selectedDepartmentId) {
      toast.error("Vui lòng chọn khoa.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "department",
          departmentId: selectedDepartmentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign exam");
      }

      toast.success(`Đã giao bài thi cho khoa thành công`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!selectedClassId) {
      toast.error("Vui lòng chọn lớp học.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "class",
          classId: selectedClassId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign exam");
      }

      toast.success(`Bài kiểm tra đã được giao cho lớp thành công`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToCourse = async () => {
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "course",
          courseId: selectedCourseId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign exam");
      }

      toast.success(`Bài kiểm tra đã được giao cho khóa học thành công.`);
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Vui lòng chọn ít nhất một học sinh.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "students",
          studentIds: selectedStudents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign exam");
      }

      toast.success(
        `Đã giao bài thi cho ${selectedStudents.length} sinh viên thành công.`
      );
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    switch (activeTab) {
      case "department":
        await handleAssignToDepartment();
        break;
      case "class":
        await handleAssignToClass();
        break;
      case "course":
        await handleAssignToCourse();
        break;
      case "students":
        await handleAssignToStudents();
        break;
      default:
        break;
    }
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-1" />
          <span className="hidden md:block" >Giao bài</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Giao bài kiểm tra: {examTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="department">Khoa</TabsTrigger>
            <TabsTrigger value="class">Lớp</TabsTrigger>
            <TabsTrigger value="course">Môn học</TabsTrigger>
            <TabsTrigger value="students">Sinh viên</TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department">Chọn khoa</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Chọn khoa" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="class" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department-for-class">Chọn khoa</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger id="department-for-class">
                  <SelectValue placeholder="Chọn khoa" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Chọn lớp</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedDepartmentId || filteredClasses.length === 0}
              >
                <SelectTrigger id="class">
                  <SelectValue
                    placeholder={
                      !selectedDepartmentId
                        ? "Hãy chọn khoa trước"
                        : filteredClasses.length === 0
                        ? "Không có lớp nào."
                        : "Chọn lớp"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="course" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department-for-course">Chọn khoa</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger id="department-for-course">
                  <SelectValue placeholder="Chọn khoa" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Chọn môn học</Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
                disabled={!selectedDepartmentId || filteredCourses.length === 0}
              >
                <SelectTrigger id="course">
                  <SelectValue
                    placeholder={
                      !selectedDepartmentId
                        ? "Hãy chọn khoa trước"
                        : filteredCourses.length === 0
                        ? "Không có môn học nào đáp ứng"
                        : "Chọn môn học"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-for-students">Chọn lớp</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="class-for-students">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chọn sinh viên</Label>
              <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    {!selectedClassId
                      ? "Chọn lớp học để tìm sinh viên"
                      : "Không có sinh viên nào"}
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() =>
                          handleStudentSelection(student.id)
                        }
                      />
                      <Label
                        htmlFor={student.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {student.user.displayName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang tiến hành..." : "Giao bài kiểm tra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
