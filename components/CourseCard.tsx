"use client";

import { BookOpen, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useRef, useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import { CourseWithDetails } from '@/types';
import { AnimatedCard, CardContent } from './ui/animated-card';
import { useAnimation } from '@/provider/AnimationProvider';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import CourseRatingDisplay from './CourseRatingDisplay';

interface CourseCardProps {
  course: CourseWithDetails
}

const CourseCard = ({course}:CourseCardProps) => {
  const { gsap, isReady } = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Fetch course ratings
  const { data: ratingData } = useQuery({
    queryKey: ['courseRatings', course.id],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/course-ratings?courseId=${course.id}`);
        return response.data;
      } catch (error) {
        // Return default values if API fails
        return { stats: { averageRating: 0, totalRatings: 0 } };
      }
    },
    // Don't refetch on window focus for better performance
    refetchOnWindowFocus: false,
  });

  const averageRating = ratingData?.stats?.averageRating || 0;
  const totalRatings = ratingData?.stats?.totalRatings || 0;

  useEffect(() => {
    if (!isReady || !cardRef.current) return;

    const card = cardRef.current;
    const image = imageRef.current;

    // Create hover animation
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -10,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        duration: 0.3,
        ease: 'power2.out'
      });

      if (image) {
        gsap.to(image, {
          scale: 1.1,
          duration: 0.5,
          ease: 'power1.out'
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        duration: 0.3,
        ease: 'power2.out'
      });

      if (image) {
        gsap.to(image, {
          scale: 1,
          duration: 0.5,
          ease: 'power1.out'
        });
      }
    });

    return () => {
      // Clean up event listeners
      card.removeEventListener('mouseenter', () => {});
      card.removeEventListener('mouseleave', () => {});

      // Kill any active animations
      gsap.killTweensOf(card);
      if (image) gsap.killTweensOf(image);
    };
  }, [isReady, gsap]);

  return (
    <Link href={`/course/${course.id}`} prefetch={false} className='group hover:no-underline flex'>
      <AnimatedCard
        ref={cardRef}
        className='overflow-hidden flex flex-col flex-1'
        animationVariant="none" // We're handling animations manually
      >
        <div className='relative h-52 w-full overflow-hidden'>
          <div ref={imageRef} className="w-full h-full">
            <Image
             src={course.imageUrl || "/images/course-placeholder.png"}
             alt={course.name || "Khóa học"}
             fill
             className='object-cover'
             onError={(e) => {
              e.currentTarget.src = "/images/course-placeholder.png";
            }}
            />
          </div>
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300'/>
          <div className='absolute bottom-4 left-4 right-4 flex items-start'>
            <span className='text-sm font-medium px-3 py-1 bg-black/50 text-white rounded-full backdrop-blur-sm'>
            {course.department?.name || "Khoa"}
            </span>
          </div>
        </div>
        <CardContent className='p-6 flex flex-col flex-1'>
          <h3 className='text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300'>{course.name}</h3>
          
          {/* Rating display */}
          {totalRatings > 0 && (
            <div className="mb-3">
              <CourseRatingDisplay 
                rating={averageRating} 
                totalRatings={totalRatings} 
                size="sm"
              />
            </div>
          )}
          
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
          </div>
        </CardContent>
      </AnimatedCard>
    </Link>
  )
}

export default CourseCard