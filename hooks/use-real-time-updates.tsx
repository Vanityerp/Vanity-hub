"use client"

import { useEffect, useCallback, useRef, useState } from 'react'
import { 
  realTimeService, 
  RealTimeEventType, 
  RealTimeEvent, 
  EventCallback,
  RealTimeNotification,
  NotificationCallback
} from '@/lib/real-time-service'

// Hook options interface
export interface UseRealTimeUpdatesOptions {
  events?: RealTimeEventType[]
  autoRefresh?: boolean
  refreshInterval?: number
  enableNotifications?: boolean
  enableCrossTab?: boolean
}

// Hook return type
export interface UseRealTimeUpdatesReturn {
  // Event handling
  emitEvent: <T>(type: RealTimeEventType, payload: T, options?: {
    source?: string
    userId?: string
    locationId?: string
    crossTab?: boolean
  }) => void
  
  // Notification handling
  showNotification: (notification: Omit<RealTimeNotification, 'id' | 'timestamp'>) => void
  
  // Status
  isConnected: boolean
  lastEventTime: Date | null
  
  // Manual refresh
  requestRefresh: () => void
}

/**
 * Hook for real-time updates integration
 * Provides easy access to real-time events and notifications
 */
export function useRealTimeUpdates(
  eventHandlers: Record<RealTimeEventType | '*', EventCallback> = {},
  options: UseRealTimeUpdatesOptions = {}
): UseRealTimeUpdatesReturn {
  const {
    events = [],
    autoRefresh = true,
    refreshInterval = 30000,
    enableNotifications = true,
    enableCrossTab = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const unsubscribersRef = useRef<Array<() => void>>([])
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize real-time service
  useEffect(() => {
    realTimeService.initialize()
    setIsConnected(true)

    return () => {
      // Cleanup on unmount
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe())
      unsubscribersRef.current = []
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  // Set up event subscriptions
  useEffect(() => {
    // Clear existing subscriptions
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe())
    unsubscribersRef.current = []

    // Subscribe to specific events
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      const unsubscribe = realTimeService.subscribe(
        eventType as RealTimeEventType | '*',
        (event: RealTimeEvent) => {
          setLastEventTime(new Date())
          handler(event)
        }
      )
      unsubscribersRef.current.push(unsubscribe)
    })

    // Subscribe to requested event types if no specific handlers
    if (Object.keys(eventHandlers).length === 0 && events.length > 0) {
      events.forEach(eventType => {
        const unsubscribe = realTimeService.subscribe(eventType, (event: RealTimeEvent) => {
          setLastEventTime(new Date())
          console.log(`📨 useRealTimeUpdates: Received ${eventType}:`, event.payload)
        })
        unsubscribersRef.current.push(unsubscribe)
      })
    }
  }, [eventHandlers, events])

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        realTimeService.emitEvent(
          RealTimeEventType.DATA_REFRESH_REQUESTED,
          { source: 'auto-refresh' },
          { source: 'useRealTimeUpdates', crossTab: enableCrossTab }
        )
      }, refreshInterval)

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
      }
    }
  }, [autoRefresh, refreshInterval, enableCrossTab])

  // Event emission function
  const emitEvent = useCallback(<T,>(
    type: RealTimeEventType,
    payload: T,
    options?: {
      source?: string
      userId?: string
      locationId?: string
      crossTab?: boolean
    }
  ) => {
    realTimeService.emitEvent(type, payload, {
      source: 'useRealTimeUpdates',
      crossTab: enableCrossTab,
      ...options
    })
  }, [enableCrossTab])

  // Notification function
  const showNotification = useCallback((notification: Omit<RealTimeNotification, 'id' | 'timestamp'>) => {
    if (enableNotifications) {
      realTimeService.showNotification(notification)
    }
  }, [enableNotifications])

  // Manual refresh function
  const requestRefresh = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { source: 'manual-refresh' },
      { source: 'useRealTimeUpdates', crossTab: enableCrossTab }
    )
  }, [enableCrossTab])

  return {
    emitEvent,
    showNotification,
    isConnected,
    lastEventTime,
    requestRefresh
  }
}

/**
 * Hook for subscribing to specific real-time events
 */
export function useRealTimeEvent<T = any,>(
  eventType: RealTimeEventType,
  handler: (payload: T, event: RealTimeEvent<T>) => void,
  dependencies: any[] = []
): void {
  useEffect(() => {
    const unsubscribe = realTimeService.subscribe(eventType, (event: RealTimeEvent<T>) => {
      handler(event.payload, event)
    })

    return unsubscribe
  }, [eventType, ...dependencies])
}

/**
 * Hook for real-time notifications
 */
export function useRealTimeNotifications(): {
  showNotification: (notification: Omit<RealTimeNotification, 'id' | 'timestamp'>) => void
  subscribeToNotifications: (callback: NotificationCallback) => () => void
} {
  const showNotification = useCallback((notification: Omit<RealTimeNotification, 'id' | 'timestamp'>) => {
    realTimeService.showNotification(notification)
  }, [])

  const subscribeToNotifications = useCallback((callback: NotificationCallback) => {
    return realTimeService.subscribeToNotifications(callback)
  }, [])

  return {
    showNotification,
    subscribeToNotifications
  }
}

/**
 * Hook for triggering data refreshes across the application
 */
export function useDataRefresh(): {
  refreshAll: () => void
  refreshTransactions: () => void
  refreshAppointments: () => void
  refreshClients: () => void
  refreshInventory: () => void
  refreshStaff: () => void
  refreshServices: () => void
} {
  const refreshAll = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'all' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshTransactions = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'transactions' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshAppointments = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'appointments' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshClients = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'clients' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshInventory = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'inventory' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshStaff = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'staff' },
      { source: 'useDataRefresh' }
    )
  }, [])

  const refreshServices = useCallback(() => {
    realTimeService.emitEvent(
      RealTimeEventType.DATA_REFRESH_REQUESTED,
      { target: 'services' },
      { source: 'useDataRefresh' }
    )
  }, [])

  return {
    refreshAll,
    refreshTransactions,
    refreshAppointments,
    refreshClients,
    refreshInventory,
    refreshStaff,
    refreshServices
  }
}
