"use client"

interface CourseProgessProps {
  progress: number;
  variant?: "default" | "success";
  size?: "default" | "sm";
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

import { cn } from '@/lib/utils';
import React from 'react'
import { Progress } from './ui/progress';

const CourseProgress = ({ progress, variant = "default", size = "default", showPercentage = true, label, className }:CourseProgessProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className='flex items-center justify-between gap-2 text-sm'>
        {label && <span className='text-muted-foreground'>{label}</span>}
        {showPercentage && (
          <span className='text-muted-foreground font-medium'>
            {progress}%
          </span>
        )}
      </div>
      <Progress
       value={progress}
       className={cn('h-2 transition-all', size === "sm" && 'h-1',variant === "success" && '[&>div]:bg-emerald-600')}
      />
    </div>
  )
}

export default CourseProgress