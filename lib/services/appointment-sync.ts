"use client"

/**
 * Appointment Synchronization Service
 * Handles real-time updates for appointment changes across all calendar views
 */

export interface AppointmentSyncEvent {
  type: 'appointment_created' | 'appointment_updated' | 'appointment_deleted' | 'staff_availability_changed'
  appointmentId: string
  staffId: string
  locationId: string
  data?: any
  timestamp: number
}

export class AppointmentSyncService {
  private static instance: AppointmentSyncService
  private listeners: Map<string, Set<(event: AppointmentSyncEvent) => void>> = new Map()
  private eventQueue: AppointmentSyncEvent[] = []
  private isProcessing = false

  private constructor() {
    // Initialize event processing
    this.startEventProcessing()
  }

  static getInstance(): AppointmentSyncService {
    if (!AppointmentSyncService.instance) {
      AppointmentSyncService.instance = new AppointmentSyncService()
    }
    return AppointmentSyncService.instance
  }

  /**
   * Subscribe to appointment sync events
   */
  subscribe(eventType: string, callback: (event: AppointmentSyncEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  /**
   * Emit an appointment sync event
   */
  emit(event: AppointmentSyncEvent): void {
    // Add to event queue
    this.eventQueue.push(event)
    
    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processEvents()
    }
  }

  /**
   * Process queued events
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!
        await this.processEvent(event)
      }
    } catch (error) {
      console.error('Error processing appointment sync events:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: AppointmentSyncEvent): Promise<void> {
    try {
      // Notify specific event type listeners
      const typeListeners = this.listeners.get(event.type)
      if (typeListeners) {
        typeListeners.forEach(callback => {
          try {
            callback(event)
          } catch (error) {
            console.error(`Error in appointment sync listener for ${event.type}:`, error)
          }
        })
      }

      // Notify global listeners
      const globalListeners = this.listeners.get('*')
      if (globalListeners) {
        globalListeners.forEach(callback => {
          try {
            callback(event)
          } catch (error) {
            console.error('Error in global appointment sync listener:', error)
          }
        })
      }

      // Emit browser event for cross-tab communication
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('appointment-sync', {
          detail: event
        }))
      }

    } catch (error) {
      console.error('Error processing appointment sync event:', error)
    }
  }

  /**
   * Start event processing loop
   */
  private startEventProcessing(): void {
    // Process events every 100ms
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEvents()
      }
    }, 100)

    // Listen for browser events (cross-tab communication)
    if (typeof window !== 'undefined') {
      window.addEventListener('appointment-sync', (event: any) => {
        const syncEvent = event.detail as AppointmentSyncEvent
        
        // Re-emit to local listeners (but don't add to queue to avoid loops)
        const typeListeners = this.listeners.get(syncEvent.type)
        if (typeListeners) {
          typeListeners.forEach(callback => {
            try {
              callback(syncEvent)
            } catch (error) {
              console.error(`Error in cross-tab appointment sync listener for ${syncEvent.type}:`, error)
            }
          })
        }
      })
    }
  }

  /**
   * Emit appointment created event
   */
  emitAppointmentCreated(appointmentId: string, staffId: string, locationId: string, data?: any): void {
    this.emit({
      type: 'appointment_created',
      appointmentId,
      staffId,
      locationId,
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Emit appointment updated event
   */
  emitAppointmentUpdated(appointmentId: string, staffId: string, locationId: string, data?: any): void {
    this.emit({
      type: 'appointment_updated',
      appointmentId,
      staffId,
      locationId,
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Emit appointment deleted event
   */
  emitAppointmentDeleted(appointmentId: string, staffId: string, locationId: string, data?: any): void {
    this.emit({
      type: 'appointment_deleted',
      appointmentId,
      staffId,
      locationId,
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Emit staff availability changed event
   */
  emitStaffAvailabilityChanged(staffId: string, locationId: string, data?: any): void {
    this.emit({
      type: 'staff_availability_changed',
      appointmentId: '', // Not applicable for availability changes
      staffId,
      locationId,
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Get all active listeners (for debugging)
   */
  getActiveListeners(): Record<string, number> {
    const result: Record<string, number> = {}
    this.listeners.forEach((listeners, eventType) => {
      result[eventType] = listeners.size
    })
    return result
  }

  /**
   * Clear all listeners (for cleanup)
   */
  clearAllListeners(): void {
    this.listeners.clear()
  }
}

// Export singleton instance
export const appointmentSyncService = AppointmentSyncService.getInstance()

/**
 * React hook for subscribing to appointment sync events
 */
export function useAppointmentSync(
  eventType: string,
  callback: (event: AppointmentSyncEvent) => void,
  dependencies: any[] = []
): void {
  if (typeof window === 'undefined') return

  // Use useEffect equivalent logic
  const cleanup = appointmentSyncService.subscribe(eventType, callback)
  
  // Return cleanup function
  return cleanup
}
