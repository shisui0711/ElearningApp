"use client";

import { useState, useEffect } from "react";
import { Users, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

type DifficultyConfig = {
  easy: number;
  medium: number;
  hard: number;
};

type ExamQuestion = {
  id: string;
  content: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export default function AssignExamButton({
  examId,
  examTitle,
}: AssignExamButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("department");
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const [difficultyConfig, setDifficultyConfig] = useState<DifficultyConfig>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [duration, setDuration] = useState(60); // in minutes
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [examName, setExamName] = useState("");

  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const depResponse = await fetch("/api/departments");
        const depData = await depResponse.json();
        setDepartments(depData.data || []);

        const classResponse = await fetch("/api/classes");
        const classData = await classResponse.json();
        setClasses(classData.data || []);

        const courseResponse = await fetch("/api/courses");
        const courseData = await courseResponse.json();
        setCourses(courseData.data || []);

        const studentResponse = await fetch("/api/students");
        const studentData = await studentResponse.json();
        setStudents(studentData.data || []);

        const questionsResponse = await fetch(`/api/exams/${examId}/questions`);
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData || []);

        const counts = {
          easy: 0,
          medium: 0,
          hard: 0,
        };

        questionsData.forEach(({ question }: { question: ExamQuestion }) => {
          if (question.difficulty === "EASY") counts.easy++;
          else if (question.difficulty === "MEDIUM") counts.medium++;
          else if (question.difficulty === "HARD") counts.hard++;
        });

        setTotalQuestions(counts);

        setDifficultyConfig({
          easy: counts.easy,
          medium: counts.medium,
          hard: counts.hard,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      }
    };

    fetchData();
  }, [examId]);

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

  useEffect(() => {
    if (selectedClassId) {
      const filtered = students.filter((s) => s.classId === selectedClassId);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClassId, students]);

  const handleDifficultyChange = (
    difficulty: keyof DifficultyConfig,
    value: string
  ) => {
    const numValue = parseInt(value, 10) || 0;
    const max = totalQuestions[difficulty];

    setDifficultyConfig((prev) => ({
      ...prev,
      [difficulty]: Math.min(numValue, max),
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setDuration(isNaN(value) ? 60 : Math.max(1, value));
  };

  const handleShowCorrectAnswersChange = (checked: boolean) => {
    setShowCorrectAnswers(checked);
  };

  const handleAssignToDepartment = async () => {
    if (!examName) {
      toast.error("Vui lòng nhập tên bài kiểm tra");
      return;
    }

    if (!selectedDepartmentId) {
      toast.error("Vui lòng chọn khoa.");
      return;
    }

    if (!dueDate) {
      toast.error("Vui lòng chọn hạn nộp bài");
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
          difficultyConfig,
          duration,
          showCorrectAnswers,
          expirateAt: dueDate,
          name: examName,
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
    if (!examName) {
      toast.error("Vui lòng nhập tên bài kiểm tra");
      return;
    }

    if (!selectedClassId) {
      toast.error("Vui lòng chọn lớp học.");
      return;
    }

    if (!dueDate) {
      toast.error("Vui lòng chọn hạn nộp bài");
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
          difficultyConfig,
          duration,
          showCorrectAnswers,
          dueDate,
          name: examName,
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
    if (!examName) {
      toast.error("Vui lòng nhập tên bài kiểm tra");
      return;
    }

    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học.");
      return;
    }

    if (!dueDate) {
      toast.error("Vui lòng chọn hạn nộp bài");
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
          difficultyConfig,
          duration,
          showCorrectAnswers,
          dueDate,
          name: examName,
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
    if (!examName) {
      toast.error("Vui lòng nhập tên bài kiểm tra");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Vui lòng chọn ít nhất một học sinh.");
      return;
    }

    if (!dueDate) {
      toast.error("Vui lòng chọn hạn nộp bài");
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
          difficultyConfig,
          duration,
          showCorrectAnswers,
          dueDate,
          name: examName,
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

  // Calculate total questions to be included in the exam
  const totalSelectedQuestions =
    difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-1" />
          <span className="hidden md:block">Giao bài</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Giao bài kiểm tra: {examTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Cấu hình câu hỏi theo mức độ khó
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="easy-count" className="block mb-1">
                      Dễ ({totalQuestions.easy} câu)
                    </Label>
                    <Input
                      id="easy-count"
                      type="number"
                      min="0"
                      max={totalQuestions.easy}
                      value={difficultyConfig.easy}
                      onChange={(e) =>
                        handleDifficultyChange("easy", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medium-count" className="block mb-1">
                      Trung bình ({totalQuestions.medium} câu)
                    </Label>
                    <Input
                      id="medium-count"
                      type="number"
                      min="0"
                      max={totalQuestions.medium}
                      value={difficultyConfig.medium}
                      onChange={(e) =>
                        handleDifficultyChange("medium", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hard-count" className="block mb-1">
                      Khó ({totalQuestions.hard} câu)
                    </Label>
                    <Input
                      id="hard-count"
                      type="number"
                      min="0"
                      max={totalQuestions.hard}
                      value={difficultyConfig.hard}
                      onChange={(e) =>
                        handleDifficultyChange("hard", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Tổng số câu hỏi: {totalSelectedQuestions}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="duration" className="block mb-1">
                      Thời gian làm bài (phút)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={handleDurationChange}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="show-answers" className="block mb-1">
                      Hiển thị đáp án sau khi làm
                    </Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        id="show-answers"
                        checked={showCorrectAnswers}
                        onCheckedChange={handleShowCorrectAnswersChange}
                      />
                      <Label htmlFor="show-answers" className="cursor-pointer">
                        {showCorrectAnswers ? "Có" : "Không"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="exam-name">Tên bài kiểm tra</Label>
            <Input
              id="exam-name"
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
            <Label htmlFor="due-date">Hạn nộp bài</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due-date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => date && setDueDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

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
                  {Array.isArray(filteredClasses) &&
                    filteredClasses.map((classItem) => (
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
                  {Array.isArray(classes) &&
                    classes.map((classItem) => (
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
          <Button
            onClick={handleSubmit}
            disabled={loading || totalSelectedQuestions === 0 || !dueDate}
          >
            {loading ? "Đang tiến hành..." : "Giao bài kiểm tra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
