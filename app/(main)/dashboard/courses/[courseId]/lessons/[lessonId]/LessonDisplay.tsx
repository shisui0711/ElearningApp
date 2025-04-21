"use client";

import LessonCompleteButton from "@/components/LessonCompleteButton";
import VideoPlayer from "@/components/VideoPlayer";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { OnProgressProps } from "react-player/base";
import axios from "axios";
import { LessonWithDetails } from "@/types";
import DocumentDisplay from "@/components/DocumentDisplay";
import CommentList from "@/components/CommentList";

interface LessonDisplayProps {
  lesson: LessonWithDetails;
  studentId: string;
}

const LessonDisplay = ({ lesson, studentId }: LessonDisplayProps) => {
  const [progress, setProgress] = useState(0);
  const {
    data: isCompleted,
    isError,
    isPending,
  } = useQuery({
    queryKey: ["lessonCompleted", lesson.id, studentId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/lessons/completed?lessonId=${lesson.id}&studentId=${studentId}`
      );
      return response.data as boolean;
    },
  });

  const handleProgressChange = (e: OnProgressProps) => {
    setProgress(e.played * 100);
  };
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto pt-12 pb-20 px-4">
          <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
          <div className="space-y-8">
            {/* Video Section */}
            {lesson.videoUrl && (
              <VideoPlayer
                onProgress={handleProgressChange}
                url={lesson.videoUrl}
              />
            )}
            {/* Lesson Content */}
            {lesson.description && (
              <div>
                <h2 className="text-xl font-semibold">Nội dung</h2>
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  {lesson.description}
                </div>
              </div>
            )}
            {/* Documents Section */}
            {lesson.documents.length > 0 && (
              <h1 className="text-xl font-semibold">Tài liệu bài giảng</h1>
            )}
            {lesson.documents.map((document) => {
              return <DocumentDisplay key={document.id} document={document} />;
            })}

            {/* Comments Section */}
            <CommentList lessonId={lesson.id} />

            <div className="flex justify-end">
              <LessonCompleteButton
                courseId={lesson.courseId}
                lessonId={lesson.id}
                studentId={studentId}
                progress={progress}
                isCompleted={!!isCompleted}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDisplay;
