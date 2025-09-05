"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-provider"
import { chatService, type ChatNotification } from "@/lib/chat-service"
import { Bell, MessageCircle, Package, HelpCircle, Hash, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotificationAudio } from '../notifications/notification-audio-context'

interface ChatNotificationsProps {
  className?: string;
}

export function ChatNotifications({ className }: ChatNotificationsProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [open, setOpen] = useState(false)
  const { playNotificationSound } = useNotificationAudio();

  useEffect(() => {
    if (!user) return

    // Initialize chat service with current user
    chatService.setCurrentUser({
      id: user.id,
      name: user.name,
      role: user.role,
      status: 'online',
      lastSeen: new Date(),
      currentLocationId: user.locations[0] !== 'all' ? user.locations[0] : undefined
    })

    // Subscribe to notifications
    const unsubscribe = chatService.onNotificationsUpdate((newNotifications) => {
      const oldNotifications = chatService.getNotifications()
      setNotifications(newNotifications)

      // Check if there's a new unread notification
      const newUnreadNotifications = newNotifications.filter(n => !n.isRead && !oldNotifications.some(oldN => oldN.id === n.id))
      if (newUnreadNotifications.length > 0) {
        playNotificationSound();
      }
    })
    
    // Load initial notifications
    setNotifications(chatService.getNotifications())

    return unsubscribe
  }, [user, playNotificationSound])

  const unreadCount = chatService.getUnreadNotificationCount()

  const handleMarkAsRead = (notificationId: string) => {
    chatService.markNotificationAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    notifications
      .filter(n => !n.isRead)
      .forEach(n => chatService.markNotificationAsRead(n.id))
  }

  const getNotificationIcon = (type: ChatNotification['type']) => {
    switch (type) {
      case 'mention':
        return <MessageCircle className="h-4 w-4 text-blue-600" />
      case 'direct_message':
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case 'channel_message':
        return <Hash className="h-4 w-4 text-gray-600" />
      case 'system':
        return <Bell className="h-4 w-4 text-orange-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getChannelIcon = (channelName: string) => {
    if (channelName.toLowerCase().includes('product')) {
      return <Package className="h-3 w-3" />
    } else if (channelName.toLowerCase().includes('help')) {
      return <HelpCircle className="h-3 w-3" />
    } else {
      return <Hash className="h-3 w-3" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Chat Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                    !notification.isRead && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {notification.senderName}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getChannelIcon(notification.channelName)}
                          <span>{notification.channelName}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-1">
                        {truncateContent(notification.content)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setOpen(false)
                // In a real app, this would open the full chat interface
              }}
            >
              Open Chat
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Hook for getting unread notification count
export function useChatNotificationCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const updateCount = () => {
      setCount(chatService.getUnreadNotificationCount())
    }

    // Subscribe to notifications updates
    const unsubscribe = chatService.onNotificationsUpdate(updateCount)
    
    // Initial count
    updateCount()

    return unsubscribe
  }, [user])

  return count
}
