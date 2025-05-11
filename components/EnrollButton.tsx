"use client"

import { useSession } from '@/provider/SessionProvider';
import { useSocket } from '@/provider/SocketProvider';
import { CourseWithDetails } from '@/types';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react'
import { toast } from 'sonner';

interface EnrollButtonProps {
  course: CourseWithDetails;
  isEnrolled: boolean;
}

const EnrollButton = ({course, isEnrolled}:EnrollButtonProps) => {
  const { user } = useSession();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const socket = useSocket();

    const handleEnroll = async (courseId: string) => {
      if(!user || !user.student || !socket) return;
      const studentId = user.student.id;
      startTransition(async () => {
       const response = await fetch("/api/courses/enroll", {
          method: "POST",
          body: JSON.stringify({ courseId, studentId}),
        });
        if(response.ok){
          console.log("Sending notification to user:", user.id);
          socket.emit("send_notification", {
            userId: user.id,
            type: "enroll",
            message: "Bạn đã đăng ký khóa học thành công",
            link: `/dashboard/courses/${courseId}`,
          });
          if(course.lessons.length > 0){
            router.push(`/dashboard/courses/${courseId}/lessons/${course.lessons[0].id}`)
          }else{
            router.push(`/dashboard/courses/${courseId}`)
          }
          toast.success("Đăng ký khóa học thành công")
        }else{
          toast.error("Đăng ký khóa học thất bại")
        }
      });
    }

  if(isPending) return (
    <div className='w-full h-12 rounded-lg bg-gray-100 flex items-center justify-center'>
      <div className='size-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin'/>
    </div>
  )

  if(isEnrolled) return (
    <Link href={`/dashboard/courses/${course.id}`} prefetch={false}
     className='w-full rounded-lg px-6 py-3 font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600
     hover:to-emerald-600 transition-all duration-300 h-12 flex items-center justify-center gap-2 group'
    >
      <span>Vào học</span>
      <CheckCircle className='size-5 group-hover:scale-110 transition-transform' />
    </Link>
  )

  return (
    <button onClick={()=> handleEnroll(course.id) }
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