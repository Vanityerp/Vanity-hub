"use client"

import { useAuth } from "@/lib/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, User, HelpCircle, MessageSquare, Shield, Activity, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useOrders } from "@/lib/order-provider"
import { NotificationService } from "@/lib/notification-service"
import { useEffect, useState } from "react"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { notifications: orderNotifications } = useOrders()
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [documentNotifications, setDocumentNotifications] = useState<any[]>([])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Load document notifications
  const loadDocumentNotifications = () => {
    const notifications = NotificationService.getNotifications()
    setDocumentNotifications(notifications)
  }

  // Load document notifications on mount and set up event listeners
  useEffect(() => {
    loadDocumentNotifications()

    // Listen for custom notification update events
    const handleNotificationUpdate = () => {
      loadDocumentNotifications()
    }

    window.addEventListener('notificationsUpdated', handleNotificationUpdate)

    // Also poll every 10 seconds as a fallback
    const interval = setInterval(loadDocumentNotifications, 10000)

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate)
      clearInterval(interval)
    }
  }, [])

  // Get default notifications with localStorage persistence
  const getDefaultNotifications = () => {
    const defaultNotifications = [
      {
        id: "default-1",
        title: "New appointment booked",
        message: "Emily Davis booked a Color & Highlights for tomorrow at 12:30 PM",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "default-2",
        title: "Inventory alert",
        message: "Shampoo - Professional is running low (2 items left)",
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "default-3",
        title: "Staff schedule updated",
        message: "Michael Chen changed availability for next week",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
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

  // Calculate total unread notifications
  useEffect(() => {
    const orderUnreadCount = orderNotifications.filter(n => !n.read).length
    const documentUnreadCount = documentNotifications.filter(n => !n.read).length

    // If there are no real notifications, count default notifications
    const hasRealNotifications = orderNotifications.length > 0 || documentNotifications.length > 0
    const defaultUnreadCount = hasRealNotifications ? 0 : getDefaultNotifications().filter(n => !n.read).length

    setTotalUnreadCount(orderUnreadCount + documentUnreadCount + defaultUnreadCount)
  }, [orderNotifications, documentNotifications])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.name || "Demo User")}
            </AvatarFallback>
          </Avatar>
          {/* Notification indicator */}
          {totalUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.name || "Demo User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">{user?.name || "Demo User"}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {user?.email || "demo@vanityhub.com"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                {user?.role || "Admin"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Activity className="mr-1 h-3 w-3" />
                Online
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('/dashboard/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('/dashboard/notifications')}>
            <Bell className="mr-2 h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <span>Notifications</span>
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleNavigation('/dashboard/help')}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigation('/dashboard/feedback')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Send Feedback</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

