'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'
import { vi } from 'date-fns/locale/vi'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { useNotifications, Notification } from '@/provider/NotificationProvider'

const NotificationItem = ({ notification, onRead }: { notification: Notification, onRead: () => void }) => {
  const router = useRouter()
  
  const handleClick = () => {
    if (!notification.read) {
      onRead()
    }
    
    if (notification.link) {
      router.push(notification.link)
    }
  }
  
  return (
    <div 
      className={cn(
        "p-3 hover:bg-accent cursor-pointer transition-colors rounded-md",
        !notification.read && "bg-muted"
      )}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="font-medium">{notification.title || 'Thông báo'}</div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
    </div>
  )
}

export function NotificationDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  
  const handleViewAllNotifications = () => {
    setOpen(false)
    router.push('/notifications')
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 h-5 min-w-5 flex items-center justify-center" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium">Thông báo</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllAsRead()}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Không có thông báo</div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {notifications.slice(0, 5).map((notification, index) => (
                <NotificationItem
                  key={index}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2 text-center">
          <Button 
            variant="link" 
            className="text-xs text-muted-foreground"
            onClick={handleViewAllNotifications}
          >
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 