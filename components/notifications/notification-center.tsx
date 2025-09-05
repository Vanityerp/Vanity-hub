"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Package,
  ShoppingBag,
  Calendar,
  Eye,
  Check,
  CheckCheck,
  Trash2,
  CheckCircle
} from "lucide-react"
import { OrderNotification } from "@/lib/order-types"
import { useOrders } from "@/lib/order-provider"
import { useNotificationAudio } from './notification-audio-context'


interface NotificationCenterProps {
  onViewOrder?: (orderId: string) => void
  onViewBooking?: (bookingId: string) => void
}

export function NotificationCenter({
  onViewOrder,
  onViewBooking
}: NotificationCenterProps) {
  const { 
    notifications, 
    markNotificationAsRead, 
    acknowledgeNotification,
    getUnreadNotificationCount,
    getUnacknowledgedNotificationCount 
  } = useOrders()
  
  const [isOpen, setIsOpen] = useState(false)
  const [allReadSuccess, setAllReadSuccess] = useState(false)
  
  const unreadCount = getUnreadNotificationCount()
  const unacknowledgedCount = getUnacknowledgedNotificationCount()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'status_update':
        return <ShoppingBag className="h-4 w-4 text-green-600" />
      case 'payment_received':
        return <Package className="h-4 w-4 text-emerald-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const handleNotificationClick = (notification: OrderNotification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id)
    }
  }

  const handleViewOrder = (notification: OrderNotification) => {
    acknowledgeNotification(notification.id)
    if (onViewOrder) {
      onViewOrder(notification.orderId)
    }
    setIsOpen(false)
  }

  const handleAcknowledge = (notification: OrderNotification) => {
    acknowledgeNotification(notification.id)
  }

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id)
      }
    })
    setAllReadSuccess(true)
  }

  const acknowledgeAll = () => {
    notifications.forEach(notification => {
      if (!notification.acknowledged) {
        acknowledgeNotification(notification.id)
      }
    })
  }

  const { playNotificationSound } = useNotificationAudio();

  const playLocalNotificationSound = useCallback(() => {
    playNotificationSound();
  }, [playNotificationSound]);



  useEffect(() => {
    // The audio element is now managed by NotificationAudioContext
  }, [])



  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setAllReadSuccess(false)
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={playLocalNotificationSound}>
          <Bell className="h-5 w-5" />
          {unacknowledgedCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold min-w-0 truncate">Notifications</h3>
              {allReadSuccess && <CheckCircle className="h-5 w-5 text-green-600 ml-2" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              {unacknowledgedCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={acknowledgeAll}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      !notification.read 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.clientName}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.amount && (
                          <div className="text-sm font-semibold text-green-600 mt-1">
                            <CurrencyDisplay amount={notification.amount} />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewOrder(notification)
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            {!notification.acknowledged && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAcknowledge(notification)
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
