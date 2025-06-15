import {
  Assignment,
  AssignmentSubmission,
  Course,
  Department,
  Document,
  Exam,
  Lesson,
  Prisma,
  Question,
  Student,
  Teacher,
  User,
} from "@prisma/client";

export interface SubmissionWithDetails extends AssignmentSubmission {
  student: {
    user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
    class: {
      id: string;
      name: string;
    };
  };
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface TeacherWithDetail extends Teacher {
  user: {
    id: string;
    username: string;
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
  };
}

export interface StudentWithDetail extends Student {
  class: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    username: string;
    displayName: string;
    firstName: string;
    lastName: string;
  };
}

export interface ExamWithDetail extends Exam {
  questions: Question[];
}

export interface LessonWithDetails extends Lesson {
  documents: Document[];
}

export interface CommentWithDetail {
  id: string;
  content: string;
  lessonId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface CourseWithDetails extends Course {
  department: Department;
  teacher: {
    user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
    degree: string | null;
  };
  lessons: Lesson[];
  assignments: AssignmentWithDetail[];
}

export interface CourseManageWithDetails extends Course {
  department: Department;
  teacher: {
    user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
    degree: string | null;
  };
  lessons: Lesson[];
}

export interface AssignmentWithDetail extends Assignment {
  submissions: AssignmentSubmission[];
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DepartmentsPage {
  departments: Department[];
  nextCusor: string | null;
}

export interface UserAvatarProps {
  avatarUrl?: string | undefined | null;
  size?: number;
  className?: string;
}

export function getUserDataSelect(signedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
  } satisfies Prisma.UserSelect;
}

export function getTeacherDataSelect(teacherId: string) {
  return {
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  } satisfies Prisma.TeacherSelect;
}
