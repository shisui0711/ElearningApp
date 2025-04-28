"use client";

import React from "react";
import { Button } from "./ui/button";
import { FileCheck } from "lucide-react";
import { Eye } from "lucide-react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
const DoExamButton = ({ examAttempt }: { examAttempt: any }) => {
  const router = useRouter();
  const { mutate } = useMutation({
    mutationFn: async (attemptId: string) => {
      await axios.post(`/api/student/exams/${attemptId}/start`);
      return attemptId;
    },
    onSuccess(attemptId: string) {
      router.push(`/assignment/${attemptId}/take`);
    },
    onError() {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại");
    },
  });

  const handleViewExam = (attemptId: string) => {
    router.push(`/assignment/${attemptId}/view`);
  };

  const handleStartExam = (attemptId: string) => {
    mutate(attemptId);
  };

  const handleContinueExam = (attemptId: string) => {
    router.push(`/assignment/${attemptId}/take`);
  };
  if (examAttempt.finishedAt) {
    return (
      <Button variant="outline" onClick={() => handleViewExam(examAttempt.id)}>
        <Eye className="mr-2 h-4 w-4" />
        Xem kết quả
      </Button>
    );
  } else if (examAttempt.startedAt && !examAttempt.finishedAt) {
    return (
      <Button onClick={() => handleContinueExam(examAttempt.id)}>
        <FileCheck className="mr-2 h-4 w-4" />
        Tiếp tục
      </Button>
    );
  } else {
    return (
      <Button onClick={() => handleStartExam(examAttempt.id)}>
        Bắt đầu làm bài
      </Button>
    );
  }
};

export default DoExamButton;
