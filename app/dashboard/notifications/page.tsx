"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { useOrders } from "@/lib/order-provider"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { RealTimeEventType } from "@/lib/real-time-service"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import {
  Bell,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Users,
  ShoppingCart,
  Settings,
  Trash2,
  Mail,
  Filter,
  Package,
  FileText,
  DollarSign,
  Zap,
  RefreshCw
} from "lucide-react"

interface EnhancedNotification {
  id: string
  type: "info" | "success" | "warning" | "error"
  category: "appointment" | "payment" | "system" | "staff" | "inventory" | "order" | "document"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionRequired?: boolean
  data?: any
  source?: "system" | "order" | "document" | "appointment" | "manual"
}

// Helper function to format relative time
const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = parseISO(timestamp)
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`
    } else {
      return `${format(date, 'dd-MM-yyyy')} at ${format(date, 'HH:mm')}`
    }
  } catch {
    return timestamp
  }
}

// Helper function to generate mock real-time notifications
const generateMockNotifications = (): EnhancedNotification[] => {
  const now = new Date()
  const notifications: EnhancedNotification[] = []

  // Recent appointment notification
  notifications.push({
    id: `notif-${Date.now()}-1`,
    type: "warning",
    category: "appointment",
    title: "Upcoming Appointment",
    message: "Sarah Johnson has an appointment in 30 minutes - Hair Cut & Style",
    timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    read: false,
    actionRequired: true,
    source: "appointment",
    data: {
      clientName: "Sarah Johnson",
      service: "Hair Cut & Style",
      time: "14:30",
      staff: "Emma Wilson"
    }
  })

  // Payment notification
  notifications.push({
    id: `notif-${Date.now()}-2`,
    type: "success",
    category: "payment",
    title: "Payment Received",
    message: "Payment of $85.00 received from Michael Brown for Facial Treatment",
    timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    read: false,
    source: "system",
    data: {
      amount: 85.00,
      clientName: "Michael Brown",
      service: "Facial Treatment",
      paymentMethod: "Credit Card"
    }
  })

  // Low stock alert
  notifications.push({
    id: `notif-${Date.now()}-3`,
    type: "warning",
    category: "inventory",
    title: "Low Stock Alert",
    message: "Hair Shampoo Professional is running low (5 units remaining)",
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: true,
    actionRequired: true,
    source: "system",
    data: {
      productName: "Hair Shampoo Professional",
      currentStock: 5,
      minimumStock: 10
    }
  })

  return notifications
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notificationList, setNotificationList] = useState<EnhancedNotification[]>([])
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Get real notifications from various services
  const { notifications: rawOrderNotifications } = useOrders()
  const rawDocumentNotifications = NotificationService.getNotifications()

  // Memoize notifications to prevent infinite loops
  const orderNotifications = useMemo(() => rawOrderNotifications, [rawOrderNotifications.length])
  const documentNotifications = useMemo(() => rawDocumentNotifications, [rawDocumentNotifications.length])

  // Real-time updates
  const { emitEvent, showNotification } = useRealTimeUpdates({
    enableNotifications: true,
    enableCrossTab: true
  })

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    paymentAlerts: true,
    systemAlerts: true,
    staffUpdates: true,
    inventoryAlerts: true
  })

  // Load and combine notifications from all sources
  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const combinedNotifications: EnhancedNotification[] = []

      // Add order notifications
      orderNotifications.forEach(orderNotif => {
        combinedNotifications.push({
          id: orderNotif.id,
          type: orderNotif.type === 'new_order' ? 'info' :
                orderNotif.type === 'payment_received' ? 'success' : 'info',
          category: orderNotif.type === 'payment_received' ? 'payment' : 'order',
          title: orderNotif.type === 'new_order' ? 'New Order Received' :
                 orderNotif.type === 'payment_received' ? 'Payment Received' :
                 orderNotif.type === 'status_update' ? 'Order Status Updated' : 'Order Notification',
          message: orderNotif.message,
          timestamp: orderNotif.timestamp.toISOString(),
          read: orderNotif.read,
          actionRequired: !orderNotif.acknowledged,
          source: "order",
          data: {
            orderId: orderNotif.orderId,
            clientName: orderNotif.clientName,
            amount: orderNotif.amount
          }
        })
      })

      // Add document notifications
      documentNotifications.forEach(docNotif => {
        combinedNotifications.push({
          id: docNotif.id,
          type: docNotif.type === 'document_expired' ? 'error' : 'warning',
          category: 'document',
          title: docNotif.title,
          message: docNotif.message,
          timestamp: docNotif.timestamp,
          read: docNotif.read,
          actionRequired: true,
          source: "document",
          data: docNotif.data
        })
      })

      // Add mock real-time notifications for demo
      const mockNotifications = generateMockNotifications()
      combinedNotifications.push(...mockNotifications)

      // Sort by timestamp (newest first)
      combinedNotifications.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setNotificationList(combinedNotifications)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [orderNotifications, documentNotifications, toast])

  // Load notifications on mount and when dependencies change
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadNotifications])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    loadNotifications()
    showNotification({
      type: 'info',
      title: 'Notifications Refreshed',
      message: 'Latest notifications have been loaded.',
      autoHide: true,
      duration: 3000
    })
  }, [loadNotifications, showNotification])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error": return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "appointment": return <Calendar className="h-4 w-4" />
      case "payment": return <DollarSign className="h-4 w-4" />
      case "staff": return <Users className="h-4 w-4" />
      case "system": return <Settings className="h-4 w-4" />
      case "inventory": return <Package className="h-4 w-4" />
      case "order": return <ShoppingCart className="h-4 w-4" />
      case "document": return <FileText className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "order": return <Badge variant="outline" className="text-xs">Order</Badge>
      case "document": return <Badge variant="outline" className="text-xs">Document</Badge>
      case "appointment": return <Badge variant="outline" className="text-xs">Appointment</Badge>
      case "system": return <Badge variant="outline" className="text-xs">System</Badge>
      default: return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "border-l-green-500"
      case "warning": return "border-l-yellow-500"
      case "error": return "border-l-red-500"
      default: return "border-l-blue-500"
    }
  }

  const filteredNotifications = notificationList.filter(notification => {
    const matchesReadFilter = filter === "all" || 
      (filter === "read" && notification.read) || 
      (filter === "unread" && !notification.read)
    
    const matchesCategoryFilter = categoryFilter === "all" || notification.category === categoryFilter
    
    return matchesReadFilter && matchesCategoryFilter
  })

  const unreadCount = notificationList.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAsUnread = (id: string) => {
    setNotificationList(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: false } : notification
      )
    )
  }

  const deleteNotification = (id: string) => {
    setNotificationList(prev => prev.filter(notification => notification.id !== id))
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    })
  }

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    })
  }

  const clearAll = () => {
    setNotificationList([])
    toast({
      title: "All notifications cleared",
      description: "All notifications have been removed.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with important alerts and messages
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {format(lastRefresh, 'HH:mm:ss')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-6 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0 || isLoading}>
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={notificationList.length === 0 || isLoading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Your latest alerts and updates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    All ({notificationList.length})
                  </Button>
                  <Button
                    variant={filter === "unread" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Button
                    variant={filter === "read" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("read")}
                  >
                    Read ({notificationList.length - unreadCount})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading notifications...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`border-l-4 ${getTypeColor(notification.type)} bg-card p-4 rounded-r-lg transition-all hover:shadow-sm ${
                        !notification.read ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            {getCategoryIcon(notification.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{notification.title}</h4>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-xs">Action Required</Badge>
                              )}
                              {getSourceBadge(notification.source)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeTime(notification.timestamp)}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.category}
                              </Badge>
                            </div>

                            {/* Additional data display */}
                            {notification.data && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                {notification.category === 'payment' && notification.data.amount && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Amount: ${notification.data.amount}</span>
                                  </div>
                                )}
                                {notification.category === 'inventory' && notification.data.currentStock && (
                                  <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>Stock: {notification.data.currentStock} units</span>
                                  </div>
                                )}
                                {notification.data.clientName && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Client: {notification.data.clientName}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      <div className="flex items-center gap-1">
                        {notification.read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsUnread(notification.id)}
                            title="Mark as unread"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                  {filteredNotifications.length === 0 && !isLoading && (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        {filter === "all"
                          ? "You're all caught up!"
                          : `No ${filter} notifications found`}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="mt-4"
                        disabled={isLoading}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Push Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">SMS Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via text message
                      </div>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Appointment Reminders</div>
                      <div className="text-sm text-muted-foreground">
                        Upcoming appointments and schedule changes
                      </div>
                    </div>
                    <Switch
                      checked={settings.appointmentReminders}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, appointmentReminders: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Payment Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        Payment confirmations and failed transactions
                      </div>
                    </div>
                    <Switch
                      checked={settings.paymentAlerts}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, paymentAlerts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">System Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        System maintenance and technical issues
                      </div>
                    </div>
                    <Switch
                      checked={settings.systemAlerts}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, systemAlerts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Staff Updates</div>
                      <div className="text-sm text-muted-foreground">
                        Staff schedule changes and announcements
                      </div>
                    </div>
                    <Switch
                      checked={settings.staffUpdates}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, staffUpdates: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Inventory Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        Low stock warnings and inventory updates
                      </div>
                    </div>
                    <Switch
                      checked={settings.inventoryAlerts}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, inventoryAlerts: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => {
                  toast({
                    title: "Settings saved",
                    description: "Your notification preferences have been updated.",
                  })
                }}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
