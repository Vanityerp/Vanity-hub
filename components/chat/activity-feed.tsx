"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-provider"
import { chatService, type ChatMessage } from "@/lib/chat-service"
import {
  Activity,
  Calendar,
  DollarSign,
  Package,
  Users,
  MessageCircle,
  HelpCircle,
  ShoppingCart,
  UserPlus,
  Clock
} from "lucide-react"

interface ActivityItem {
  id: string;
  type: 'appointment' | 'sale' | 'inventory' | 'client' | 'chat' | 'system';
  title: string;
  description: string;
  user?: string;
  amount?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  className?: string;
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState('all')

  // Mock activity data - in real app, this would come from various system events
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'New Appointment Booked',
        description: 'Sarah Johnson booked a haircut for tomorrow at 2:00 PM',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        id: '2',
        type: 'sale',
        title: 'Product Sale Completed',
        description: 'Hydrating Shampoo sold to Maria Garcia',
        user: 'Jessica Smith',
        amount: 24.99,
        timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
      },
      {
        id: '3',
        type: 'inventory',
        title: 'Low Stock Alert',
        description: 'Hair Color - Brown is running low (3 units remaining)',
        timestamp: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
      },
      {
        id: '4',
        type: 'client',
        title: 'New Client Registered',
        description: 'Emma Wilson joined as a new client',
        user: 'Emma Wilson',
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      },
      {
        id: '5',
        type: 'sale',
        title: 'Service Completed',
        description: 'Color & Highlights service for Lisa Chen',
        user: 'Michael Brown',
        amount: 150.00,
        timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
      },
      {
        id: '6',
        type: 'inventory',
        title: 'Stock Replenished',
        description: 'Received 20 units of Professional Hair Dryer',
        user: 'Admin',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      }
    ]

    setActivities(mockActivities)
  }, [])

  // Subscribe to chat messages
  useEffect(() => {
    if (!user) return

    const unsubscribe = chatService.onMessage((message) => {
      setChatMessages(prev => [message, ...prev.slice(0, 19)]) // Keep last 20 messages
    })

    // Load recent messages from all channels
    const channels = chatService.getChannels()
    const allMessages: ChatMessage[] = []

    channels.forEach(channel => {
      const messages = chatService.getMessages(channel.id)
      allMessages.push(...messages.slice(-5)) // Last 5 messages per channel
    })

    // Sort by timestamp and take most recent
    allMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    setChatMessages(allMessages.slice(0, 20))

    return unsubscribe
  }, [user])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'sale':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'inventory':
        return <Package className="h-4 w-4 text-orange-600" />
      case 'client':
        return <UserPlus className="h-4 w-4 text-purple-600" />
      case 'chat':
        return <MessageCircle className="h-4 w-4 text-indigo-600" />
      case 'system':
        return <Activity className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getChatIcon = (messageType: ChatMessage['messageType']) => {
    switch (messageType) {
      case 'product_request':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'help_request':
        return <HelpCircle className="h-4 w-4 text-yellow-600" />
      case 'system':
        return <Activity className="h-4 w-4 text-gray-600" />
      default:
        return <MessageCircle className="h-4 w-4 text-indigo-600" />
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
    return `${diffInDays}d ago`
  }

  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'all') return true
    return activity.type === activeTab
  })

  const combinedFeed = [
    ...filteredActivities.map(activity => ({ ...activity, source: 'activity' as const })),
    ...chatMessages.map(message => ({
      id: message.id,
      type: 'chat' as const,
      title: `${message.senderName} in ${chatService.getChannels().find(c => c.id === message.channelId)?.name || 'Unknown'}`,
      description: message.content,
      user: message.senderName,
      timestamp: message.createdAt,
      metadata: { messageType: message.messageType },
      source: 'chat' as const
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          Recent system activities and team communications
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="sale" className="text-xs">Sales</TabsTrigger>
              <TabsTrigger value="appointment" className="text-xs">Bookings</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs">Inventory</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-96 px-6">
            <div className="space-y-3 pb-4">
              {combinedFeed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                combinedFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.source === 'chat'
                        ? getChatIcon(item.metadata?.messageType || 'text')
                        : getActivityIcon(item.type)
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium truncate">{item.title}</h4>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.user && (
                            <Badge variant="outline" className="text-xs">
                              {item.user}
                            </Badge>
                          )}

                          {item.source === 'chat' && item.metadata?.messageType !== 'text' && (
                            <Badge variant="secondary" className="text-xs">
                              {item.metadata.messageType === 'product_request' ? 'Product Request' :
                               item.metadata.messageType === 'help_request' ? 'Help Request' :
                               item.metadata.messageType}
                            </Badge>
                          )}
                        </div>

                        {item.amount && (
                          <Badge variant="default" className="text-xs">
                            ${item.amount.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}

