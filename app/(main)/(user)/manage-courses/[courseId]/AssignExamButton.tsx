"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, PlusCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AssignExamButtonProps {
  courseId: string;
}

type ClassData = {
  id: string;
  name: string;
};

type StudentData = {
  id: string;
  user: {
    displayName: string;
  };
  classId: string | null;
};

type ExamData = {
  id: string;
  title: string;
};

type DifficultyConfig = {
  easy: number;
  medium: number;
  hard: number;
};

export default function AssignExamButton({ courseId }: AssignExamButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("class");

  // Data for selection options
  const [examName, setExamName] = useState("");
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [totalQuestions, setTotalQuestions] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  // Exam configuration
  const [difficultyConfig, setDifficultyConfig] = useState<DifficultyConfig>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [duration, setDuration] = useState(60); // in minutes
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ); // Default 30 days from now

  // Selected values
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    // Fetch classes, students and exams on component mount
    const fetchData = async () => {
      try {
        // Get classes
        const classResponse = await fetch("/api/classes");
        const classData = await classResponse.json();
        setClasses(classData.data || []);

        // Get exams
        const examResponse = await fetch("/api/exams");
        const examData = await examResponse.json();
        setExams(examData.data || []);

        // Get students enrolled in this course
        const studentsResponse = await fetch(
          `/api/courses/${courseId}/students`
        );
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.data || []);
        setFilteredStudents(studentsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      }
    };

    fetchData();
  }, [courseId]);

  // Fetch exam questions when an exam is selected
  useEffect(() => {
    if (selectedExamId) {
      const fetchExamQuestions = async () => {
        try {
          const questionsResponse = await fetch(
            `/api/exams/${selectedExamId}/questions`
          );
          const questionsData = await questionsResponse.json();

          // Count questions by difficulty
          const counts = {
            easy: 0,
            medium: 0,
            hard: 0,
          };

          questionsData.forEach((item: any) => {
            const question = item.question || item;
            if (question.difficulty === "EASY") counts.easy++;
            else if (question.difficulty === "MEDIUM") counts.medium++;
            else if (question.difficulty === "HARD") counts.hard++;
          });

          setTotalQuestions(counts);

          // Set default difficulty config to use all available questions
          setDifficultyConfig({
            easy: counts.easy,
            medium: counts.medium,
            hard: counts.hard,
          });
        } catch (error) {
          console.error("Error fetching exam questions:", error);
          toast.error("Không thể tải câu hỏi. Vui lòng thử lại sau.");
        }
      };

      fetchExamQuestions();
    }
  }, [selectedExamId]);

  // Filter students by class
  useEffect(() => {
    if (activeTab === "class") {
      if (selectedClassId) {
        const filtered = students.filter((s) => s.classId === selectedClassId);
        setFilteredStudents(filtered);
      } else {
        setFilteredStudents([]);
      }
    } else {
      setFilteredStudents(students);
    }
  }, [selectedClassId, students, activeTab]);

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

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!examName) {
      toast.error("Vui lòng nhập tên bài kiểm tra");
      return;
    }

    if (!selectedExamId) {
      toast.error("Vui lòng chọn bài kiểm tra");
      return;
    }

    if (activeTab === "class" && !selectedClassId) {
      toast.error("Vui lòng chọn lớp học");
      return;
    }

    if (activeTab === "students" && selectedStudents.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sinh viên");
      return;
    }

    const totalSelectedQuestions =
      difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

    if (totalSelectedQuestions === 0) {
      toast.error("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }

    if (!dueDate) {
      toast.error("Vui lòng chọn hạn nộp bài");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/exams/${selectedExamId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "course",
          courseId: courseId,
          difficultyConfig,
          duration,
          showCorrectAnswers,
          expirateAt: dueDate,
          name: examName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Giao bài tập thất bại");
      }

      toast.success("Giao bài tập thành công!");
      setOpen(false);

      // Reload the page to show the new assignment
      window.location.reload();
    } catch (error) {
      console.error("Error assigning exam:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Giao bài tập thất bại. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate total questions to be included in the exam
  const totalSelectedQuestions =
    difficultyConfig.easy + difficultyConfig.medium + difficultyConfig.hard;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Giao bài kiểm tra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Giao bài kiểm tra trắc nghiệm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exam">Chọn bài kiểm tra</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đề thi" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExamId && (
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
                        onChange={(e) => setDuration(Number(e.target.value))}
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
                          onCheckedChange={setShowCorrectAnswers}
                        />
                        <Label
                          htmlFor="show-answers"
                          className="cursor-pointer"
                        >
                          {showCorrectAnswers ? "Có" : "Không"}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label>Tên bài kiểm tra</Label>
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
                  {dueDate ? (
                    format(dueDate, "dd/MM/yyyy")
                  ) : (
                    <span>Chọn ngày</span>
                  )}
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

          <div className="space-y-2">
            <Label>Giao cho</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="class">Lớp học</TabsTrigger>
                <TabsTrigger value="students">Sinh viên cụ thể</TabsTrigger>
              </TabsList>

              <TabsContent value="class" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Chọn lớp</Label>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn lớp học" />
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
              </TabsContent>

              <TabsContent value="students" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Chọn sinh viên</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {students.length > 0 ? (
                      <div className="space-y-2">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() =>
                                handleStudentSelection(student.id)
                              }
                            />
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {student.user.displayName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <FileSpreadsheet className="h-8 w-8 mx-auto mb-2" />
                        <p>Không có sinh viên nào trong khóa học này</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              !selectedExamId ||
              totalSelectedQuestions === 0 ||
              !dueDate
            }
          >
            {loading ? "Đang xử lý..." : "Giao bài tập"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
