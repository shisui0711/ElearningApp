'use client'

import React, { useEffect } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

import { useNotifications } from '@/provider/NotificationProvider'

export default function NotificationsPage() {
  const { notifications, loading, markAllAsRead, fetchNotifications, unreadCount } = useNotifications()
  const router = useRouter()

  // Refetch notifications when the page loads
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc')
  }

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div className="container py-6 md:py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Thông báo của tôi</h1>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả thông báo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Bạn chưa có thông báo nào
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <div 
                    className={`p-4 flex flex-col rounded-md ${
                      notification.read ? '' : 'bg-muted'
                    } hover:bg-accent/50 cursor-pointer transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium">{notification.title || 'Thông báo'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                  </div>
                  <Separator />
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
