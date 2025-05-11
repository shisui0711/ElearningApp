"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface Prerequisite {
  prerequisiteId: string;
  subjectId: string;
  subjectName: string;
  description: string | null;
}

interface PrerequisitesListProps {
  courseId: string;
}

export default function PrerequisitesList({
  courseId,
}: PrerequisitesListProps) {
  const [loading, setLoading] = useState(true);
  const [canEnroll, setCanEnroll] = useState(false);
  const [missingPrerequisites, setMissingPrerequisites] = useState<
    Prerequisite[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/courses/${courseId}/prerequisites`
        );
        setCanEnroll(response.data.canEnroll);
        setMissingPrerequisites(response.data.missingPrerequisites);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load prerequisites");
      } finally {
        setLoading(false);
      }
    };

    fetchPrerequisites();
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (canEnroll) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Yêu cầu tiên quyết</AlertTitle>
        <AlertDescription className="text-green-700">
          Bạn đã đáp ứng tất cả yêu cầu tiên quyết cho khóa học này.
        </AlertDescription>
      </Alert>
    );
  }

  if (missingPrerequisites.length === 0) {
    return null; // No prerequisites for this course
  }

  return (
    <div className="mt-4">
      <Alert variant="destructive" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Yêu cầu tiên quyết</AlertTitle>
        <AlertDescription className="text-amber-700">
          <p className="mb-2">
            Trước khi đăng ký khóa học này, bạn cần hoàn thành ít nhất một khóa
            học từ các môn sau:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            {missingPrerequisites.map((prereq) => (
              <li key={prereq.prerequisiteId}>
                <strong>{prereq.subjectName}</strong>
                {prereq.description && (
                  <p className="text-sm text-amber-600">{prereq.description}</p>
                )}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
