"use client"

import { EventEmitter } from 'events'

// Event types for real-time updates
export enum RealTimeEventType {
  // Transaction events
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  TRANSACTION_DELETED = 'transaction_deleted',
  
  // Appointment events
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_DELETED = 'appointment_deleted',
  APPOINTMENT_STATUS_CHANGED = 'appointment_status_changed',
  
  // Client events
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',
  
  // Order events
  ORDER_CREATED = 'order_created',
  ORDER_STATUS_UPDATED = 'order_status_updated',
  ORDER_PAYMENT_RECEIVED = 'order_payment_received',
  
  // Inventory events
  INVENTORY_UPDATED = 'inventory_updated',
  PRODUCT_CREATED = 'product_created',
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_DELETED = 'product_deleted',
  
  // Staff events
  STAFF_CREATED = 'staff_created',
  STAFF_UPDATED = 'staff_updated',
  STAFF_DELETED = 'staff_deleted',
  
  // Service events
  SERVICE_CREATED = 'service_created',
  SERVICE_UPDATED = 'service_updated',
  SERVICE_DELETED = 'service_deleted',
  
  // Notification events
  NOTIFICATION_CREATED = 'notification_created',
  NOTIFICATION_READ = 'notification_read',
  NOTIFICATION_ACKNOWLEDGED = 'notification_acknowledged',
  
  // Chat events
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_MESSAGE_RECEIVED = 'chat_message_received',
  
  // System events
  DATA_REFRESH_REQUESTED = 'data_refresh_requested',
  LOCATION_CHANGED = 'location_changed',
  USER_STATUS_CHANGED = 'user_status_changed'
}

// Event payload interface
export interface RealTimeEvent<T = any> {
  type: RealTimeEventType
  payload: T
  timestamp: Date
  source: string
  userId?: string
  locationId?: string
}

// Notification interface for real-time notifications
export interface RealTimeNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  autoHide?: boolean
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
  }>
}

// Subscription callback type
export type EventCallback<T = any> = (event: RealTimeEvent<T>) => void
export type NotificationCallback = (notification: RealTimeNotification) => void

/**
 * Real-Time Service Hub
 * Central coordination service for all real-time updates in the application
 */
class RealTimeServiceHub extends EventEmitter {
  private static instance: RealTimeServiceHub
  private isInitialized = false
  private subscribers = new Map<string, Set<EventCallback>>()
  private notificationSubscribers = new Set<NotificationCallback>()
  private storageEventListener: ((event: StorageEvent) => void) | null = null

  constructor() {
    super()
    this.setMaxListeners(100) // Increase max listeners for many components
  }

  static getInstance(): RealTimeServiceHub {
    if (!RealTimeServiceHub.instance) {
      RealTimeServiceHub.instance = new RealTimeServiceHub()
    }
    return RealTimeServiceHub.instance
  }

  /**
   * Initialize the real-time service
   */
  initialize(): void {
    if (this.isInitialized) return

    console.log('🚀 RealTimeService: Initializing...')

    // Set up localStorage event listener for cross-tab communication
    this.setupStorageListener()

    // Set up periodic health checks
    this.setupHealthChecks()

    this.isInitialized = true
    console.log('✅ RealTimeService: Initialized successfully')
  }

  /**
   * Set up localStorage event listener for cross-tab real-time updates
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return

    this.storageEventListener = (event: StorageEvent) => {
      if (event.key === 'vanity_realtime_event' && event.newValue) {
        try {
          const realTimeEvent: RealTimeEvent = JSON.parse(event.newValue)
          realTimeEvent.timestamp = new Date(realTimeEvent.timestamp)
          
          console.log('📡 RealTimeService: Received cross-tab event:', realTimeEvent.type)
          this.handleIncomingEvent(realTimeEvent)
        } catch (error) {
          console.error('❌ RealTimeService: Error parsing cross-tab event:', error)
        }
      }
    }

    window.addEventListener('storage', this.storageEventListener)
  }

  /**
   * Set up periodic health checks and cleanup
   */
  private setupHealthChecks(): void {
    // Clean up old events every 5 minutes
    setInterval(() => {
      this.cleanupOldEvents()
    }, 5 * 60 * 1000)
  }

  /**
   * Emit a real-time event
   */
  emitEvent<T>(type: RealTimeEventType, payload: T, options?: {
    source?: string
    userId?: string
    locationId?: string
    crossTab?: boolean
  }): void {
    const event: RealTimeEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
      source: options?.source || 'unknown',
      userId: options?.userId,
      locationId: options?.locationId
    }

    console.log('📤 RealTimeService: Emitting event:', type, payload)

    // Emit to local subscribers
    this.handleIncomingEvent(event)

    // Emit to other tabs if requested
    if (options?.crossTab !== false && typeof window !== 'undefined') {
      try {
        localStorage.setItem('vanity_realtime_event', JSON.stringify(event))
        // Clear immediately to allow repeated events
        setTimeout(() => {
          localStorage.removeItem('vanity_realtime_event')
        }, 100)
      } catch (error) {
        console.error('❌ RealTimeService: Error emitting cross-tab event:', error)
      }
    }
  }

  /**
   * Handle incoming events
   */
  private handleIncomingEvent<T>(event: RealTimeEvent<T>): void {
    // Emit to EventEmitter listeners
    this.emit(event.type, event)

    // Emit to specific subscribers
    const typeSubscribers = this.subscribers.get(event.type)
    if (typeSubscribers) {
      typeSubscribers.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`❌ RealTimeService: Error in subscriber for ${event.type}:`, error)
        }
      })
    }

    // Emit to wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*')
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('❌ RealTimeService: Error in wildcard subscriber:', error)
        }
      })
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: RealTimeEventType | '*', callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    
    this.subscribers.get(eventType)!.add(callback)
    
    console.log(`📝 RealTimeService: Subscribed to ${eventType}`)
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
      console.log(`📝 RealTimeService: Unsubscribed from ${eventType}`)
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(callback: NotificationCallback): () => void {
    this.notificationSubscribers.add(callback)
    
    return () => {
      this.notificationSubscribers.delete(callback)
    }
  }

  /**
   * Show a real-time notification
   */
  showNotification(notification: Omit<RealTimeNotification, 'id' | 'timestamp'>): void {
    const fullNotification: RealTimeNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      autoHide: true,
      duration: 5000,
      ...notification
    }

    console.log('🔔 RealTimeService: Showing notification:', fullNotification.title)

    this.notificationSubscribers.forEach(callback => {
      try {
        callback(fullNotification)
      } catch (error) {
        console.error('❌ RealTimeService: Error in notification subscriber:', error)
      }
    })
  }

  /**
   * Clean up old events and data
   */
  private cleanupOldEvents(): void {
    // This could be expanded to clean up old localStorage data
    console.log('🧹 RealTimeService: Performing cleanup...')
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    if (this.storageEventListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener)
    }
    
    this.subscribers.clear()
    this.notificationSubscribers.clear()
    this.removeAllListeners()
    this.isInitialized = false
    
    console.log('🗑️ RealTimeService: Destroyed')
  }
}

// Export singleton instance
export const realTimeService = RealTimeServiceHub.getInstance()
