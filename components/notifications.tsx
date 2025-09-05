"use client"

import React, { useState, useEffect } from "react"
import { Bell, FileWarning, AlertCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationService, NotificationType } from "@/lib/notification-service"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"

export function Notifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications()

    // Set up interval to check for new notifications
    const interval = setInterval(() => {
      loadNotifications()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Load notifications
  const loadNotifications = () => {
    // Check for document notifications
    NotificationService.checkExpiringDocuments()

    // Get all notifications
    const allNotifications = NotificationService.getNotifications()

    // Sort by timestamp (newest first)
    const sortedNotifications = [...allNotifications].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    setNotifications(sortedNotifications)
    setUnreadCount(sortedNotifications.filter(n => !n.read).length)
  }

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Handle default notifications differently
    if (notification.id.startsWith('default-')) {
      saveDefaultNotificationStatus(notification.id, true)
      loadNotifications()
      return
    }

    // Mark as read for real notifications
    NotificationService.markAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === NotificationType.DOCUMENT_EXPIRING ||
        notification.type === NotificationType.DOCUMENT_EXPIRED) {
      // Always navigate to the HR page with documents tab
      router.push("/dashboard/hr?tab=documents")
    }

    // Reload notifications
    loadNotifications()

    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notificationsUpdated'))
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.DOCUMENT_EXPIRING:
        return <FileWarning className="h-4 w-4 text-yellow-500 mr-2" />
      case NotificationType.DOCUMENT_EXPIRED:
        return <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
      default:
        return null
    }
  }

  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return "recently"
    }
  }

  // Get default notifications with localStorage persistence
  const getDefaultNotifications = () => {
    const defaultNotifications = [
      {
        id: "default-1",
        title: "New appointment booked",
        message: "Emily Davis booked a Color & Highlights for tomorrow at 12:30 PM",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        read: false,
      },
      {
        id: "default-2",
        title: "Inventory alert",
        message: "Shampoo - Professional is running low (2 items left)",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        read: false,
      },
      {
        id: "default-3",
        title: "Staff schedule updated",
        message: "Michael Chen changed availability for next week",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        read: true,
      },
    ]

    // Check localStorage for read status
    if (typeof window !== 'undefined') {
      try {
        const storedDefaults = localStorage.getItem('vanity_default_notifications')
        if (storedDefaults) {
          const stored = JSON.parse(storedDefaults)
          return defaultNotifications.map(notif => ({
            ...notif,
            read: stored[notif.id] || notif.read
          }))
        }
      } catch (error) {
        console.error('Error loading default notifications:', error)
      }
    }

    return defaultNotifications
  }

  // Save default notification read status
  const saveDefaultNotificationStatus = (notificationId: string, read: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        const storedDefaults = localStorage.getItem('vanity_default_notifications')
        const stored = storedDefaults ? JSON.parse(storedDefaults) : {}
        stored[notificationId] = read
        localStorage.setItem('vanity_default_notifications', JSON.stringify(stored))

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('notificationsUpdated'))
      } catch (error) {
        console.error('Error saving default notification status:', error)
      }
    }
  }

  // Combine document notifications with default notifications
  const allNotifications = notifications.length > 0
    ? notifications
    : getDefaultNotifications()

  // Calculate total unread count
  const totalUnreadCount = notifications.length > 0
    ? unreadCount
    : getDefaultNotifications().filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {totalUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-auto">
          {allNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            allNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <DropdownMenuItem
                  className={`cursor-pointer flex flex-col items-start p-4 ${notification.read ? 'opacity-70' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="font-medium flex items-center">
                    {getNotificationIcon(notification.type)}
                    {notification.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatNotificationTime(notification.timestamp)}
                  </div>
                </DropdownMenuItem>
                {index < allNotifications.length - 1 && <DropdownMenuSeparator />}
              </React.Fragment>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-center text-primary"
          onClick={() => {
            // Mark all real notifications as read
            NotificationService.markAllAsRead()

            // Mark all default notifications as read if we're showing them
            if (notifications.length === 0) {
              const defaultNotifs = getDefaultNotifications()
              defaultNotifs.forEach(notif => {
                if (!notif.read) {
                  saveDefaultNotificationStatus(notif.id, true)
                }
              })
            }

            loadNotifications()
            // Dispatch event to notify other components immediately
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('notificationsUpdated'))
            }
          }}
        >
          Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

