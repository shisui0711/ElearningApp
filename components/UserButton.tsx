"use client"

import React, { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import UserAvatar from './UserAvatar'
import Link from 'next/link'
import { Book, LogOut, Settings, User2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/provider/SessionProvider'
import { SignOut } from '@/app/actions'


const UserButton = ({ className }: { className?:string }) => {
  const { user } = useSession()
  const [open,setOpen] = useState(false)

  const queryClient = useQueryClient();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className='outline-none'>
          <UserAvatar className={className} avatarUrl={user.avatarUrl}/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Link href={`/profile/${user.id}`} className='flex gap-2'
            onClick={()=>setOpen(false)}
          >
            <User2 className='size-4'/>
            Trang cá nhân
          </Link>
        </DropdownMenuItem>
        {user.teacher && <DropdownMenuItem>
          <Link href={`/manage-courses`} className='flex gap-2'
            onClick={()=>setOpen(false)}
          >
            <Book className='size-4'/>
            Quản lý môn học
          </Link>
        </DropdownMenuItem>}
        <DropdownMenuItem>
          <Link href={`/settings/information`} className='flex gap-2'
            onClick={()=>setOpen(false)}
          >
            <Settings className='size-4'/>
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem className='flex gap-2' onClick={()=>{
          queryClient.clear();
          SignOut();
          }}>
          <LogOut />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserButton