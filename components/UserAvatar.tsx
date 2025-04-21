import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  avatarUrl?: string | undefined | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserAvatar = ({ avatarUrl, size = "md", className }:UserAvatarProps) => {
  return (
    <div className={cn('relative size-8', size === 'sm' && 'size-8', size === 'md' && 'size-12', size === 'lg' && 'size-16')}>
      <Image
      src={avatarUrl || '/user-placeholder.png'}
      alt="User avatar"
      fill
      className={cn(
        "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
        className,
      )}
    />
    </div>
  )
}

export default UserAvatar