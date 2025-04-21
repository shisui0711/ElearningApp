import { cn } from '@/lib/utils';
import React from 'react'

interface LoaderProps {
  classname?: string;
  size: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-3'
}

const Loader = ({classname, size}:LoaderProps) => {
  return (
    <div className={cn("border-gray-400 border-t-gray-600 rounded-full animate-spin",sizeClasses[size],classname)} />
  )
}

export default Loader