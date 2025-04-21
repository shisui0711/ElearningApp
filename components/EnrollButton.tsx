"use client"

import { useSession } from '@/provider/SessionProvider';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react'

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

const EnrollButton = ({courseId, isEnrolled}:EnrollButtonProps) => {
  const { user } = useSession();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

    const handleEnroll = async (courseId: string) => {
      if(!user || !user.student) return;
      const studentId = user.student.id;
      startTransition(async () => {
        await fetch("/api/courses/enroll", {
          method: "POST",
          body: JSON.stringify({ courseId, studentId}),
        });
        router.push("/my-courses")
      });
    }

  if(isPending) return (
    <div className='w-full h-12 rounded-lg bg-gray-100 flex items-center justify-center'>
      <div className='size-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin'/>
    </div>
  )

  if(isEnrolled) return (
    <Link href={`/dashboard/courses/${courseId}`} prefetch={false}
     className='w-full rounded-lg px-6 py-3 font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600
     hover:to-emerald-600 transition-all duration-300 h-12 flex items-center justify-center gap-2 group'
    >
      <span>Vào học</span>
      <CheckCircle className='size-5 group-hover:scale-110 transition-transform' />
    </Link>
  )

  return (
    <button onClick={()=> handleEnroll(courseId) }
      className={`w-full rounded-lg px-6 py-3 font-medium transition-all duration-300 ease-in-out relative h-12
        ${
          isPending || !user
          ? "bg-gray-100 text-gray-400 cursor-not-allowed hover:scale-100"
          : "bg-white text-black hover:scale-105 hover:shadow-lg hover:shadow-black/10"
        }
        `}
      disabled={isPending || !user}
    >
      {
        !user ? (
          <span className={`${isPending ? "opacity-0" : "opacity-100"}`}>Đăng nhập để tham gia khóa học</span>
        ): (
          <span className={`${isPending ? "opacity-0" : "opacity-100"}`}>
            Đăng ký học
          </span>
        )
      }
    </button>
  )
}

export default EnrollButton