"use client";

import { LessonWithDetails } from "@/types";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FilePlus, Library, Pencil, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditLessonDialog } from "../EditLessonDialog";
import { DeleteLessonDialog } from "../DeleteLessonDialog";
import { EditDocumentDialog } from "../EditDocumentDialog";
import { DeleteDocumentDialog } from "../DeleteDocumentDialog";
import VideoPlayer from "@/components/VideoPlayer";

interface ManageLessonsProps {
  course: {
    id: string;
    name: string;
  };
  lesson: LessonWithDetails;
  allLessons: {
    id: string;
    title: string;
  }[];
}

const ManageLessons = ({ course, lesson, allLessons }: ManageLessonsProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/manage-courses" className="hover:text-primary">
          Quản lý khóa học
        </Link>
        <span>/</span>
        <Link
          href={`/manage-courses/${course.id}`}
          className="hover:text-primary"
        >
          {course.name}
        </Link>
        <span>/</span>
        <span>Bài học: {lesson.title}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Link href={`/manage-courses/${course.id}`}>
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {lesson.title}
        </h1>

        <div className="flex items-center gap-2">
          <EditLessonDialog courseId={course.id} lesson={lesson} />
          <DeleteLessonDialog courseId={course.id} lesson={lesson} />
        </div>
      </div>
      <div className="space-y-8">
      {lesson.videoUrl && (
        <VideoPlayer url={lesson.videoUrl} />
      )}
      {lesson.description && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">Mô tả bài học</h2>
          <p className="text-muted-foreground">{lesson.description}</p>
        </div>
      )}
      </div>

      <div className="h-px bg-border my-8"></div>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              Tài liệu ({lesson.documents.length})
            </h2>
            <Link href={`/manage-courses/${course.id}?tab=documents`}>
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                Thêm tài liệu
              </Button>
            </Link>
          </div>

          {lesson.documents.length > 0 ? (
            <div className="space-y-4">
              {lesson.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                >
                  <div className="flex items-center">
                    <div className="bg-primary/10 text-primary p-2 rounded-md mr-4">
                      <Library className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{document.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {document.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={document.fileUrl} target="_blank">
                      <Button variant="outline" size="sm">
                        Xem
                      </Button>
                    </Link>
                    {document.lessonId && (
                      <EditDocumentDialog
                        document={{
                          id: document.id,
                          name: document.name,
                          description: document.description,
                          fileUrl: document.fileUrl,
                          type: document.type,
                          lessonId: document.lessonId,
                        }}
                        lessons={allLessons}
                      />
                    )}
                    <DeleteDocumentDialog document={document} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Chưa có tài liệu nào</h3>
              <p className="text-muted-foreground mb-6">
                Hãy thêm tài liệu đầu tiên cho bài học này
              </p>
              <Link href={`/manage-courses/${course.id}?tab=documents`}>
                <Button>
                  <FilePlus className="mr-2 h-4 w-4" />
                  Thêm tài liệu
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Library className="mr-2 h-5 w-5" />
                Thông tin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Số tài liệu</p>
                  <p className="text-2xl font-bold">
                    {lesson.documents.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vị trí</p>
                  <p className="text-2xl font-bold">{lesson.position}</p>
                </div>
                {lesson.videoUrl && (
                  <div>
                    <p className="text-sm font-medium">Video</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {lesson.videoUrl}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Tài liệu giúp học viên hiểu rõ hơn về nội dung bài học
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageLessons;
