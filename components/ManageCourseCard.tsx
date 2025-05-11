import { BookOpen, Edit, Layers } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import UserAvatar from './UserAvatar';
import { Badge } from '@/components/ui/badge';
import { CourseWithDetails } from '@/types';

interface ManageCourseCardProps {
  course: CourseWithDetails
}

const ManageCourseCard = ({ course }: ManageCourseCardProps) => {
  return (
    <Link href={`/manage-courses/${course.id}`} prefetch={false} className='group hover:no-underline flex'>
      <div className='bg-card rounded-xl overflow-hidden shadow-lg transition-all
      duration-300 ease-in-out hover:shadow-xl hover:translate-y-[-4px] border border-border flex flex-col flex-1'>
        <div className='relative h-52 w-full overflow-hidden'>
          <Image
           src={course.imageUrl || "/images/course-placeholder.png"}
           alt={course.name || "Khóa học"}
           fill
           className='object-cover transition-transform duration-300 group-hover:scale-110'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300'/>
          <div className='absolute bottom-4 left-4 right-4 flex items-start justify-between'>
            <span className='text-sm font-medium px-3 py-1 bg-black/50 text-white rounded-full backdrop-blur-sm'>
              {course.department?.name || "Khoa"}
            </span>
            <Badge variant="secondary" className="bg-primary/90 hover:bg-primary text-white">
              Quản lý
            </Badge>
          </div>
        </div>
        <div className='p-6 flex flex-col flex-1'>
          <h3 className='text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300'>{course.name}</h3>
          <div className='space-y-4 mt-auto'>
            {/* Author */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='relative h-8 w-8 mr-2'>
                  <UserAvatar size='sm' avatarUrl={course.teacher?.user?.avatarUrl} />
                </div>
                <span className='text-sm text-muted-foreground'>Đăng bởi {course.teacher?.user?.displayName || "Giảng viên"}</span>
              </div>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </div>
            
            {/* Management actions */}
            <div className='flex items-center gap-3 mt-4 text-xs text-muted-foreground'>
              <div className='flex items-center'>
                <Layers className='h-4 w-4 mr-1' />
                <span>{course.lessons?.length || 0} bài học</span>
              </div>
              <div className='flex-1 flex justify-end'>
                <span className='text-primary flex items-center'>
                  <Edit className='h-4 w-4 mr-1' />
                  Quản lý nội dung
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ManageCourseCard 