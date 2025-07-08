"use client"

/**
 * Buffer Time Configuration Service
 * Manages appointment buffer times to prevent back-to-back bookings
 */

export interface BufferTimeSettings {
  // Global buffer settings
  globalBeforeMinutes: number
  globalAfterMinutes: number
  
  // Service-specific buffer settings
  serviceBuffers: Record<string, {
    beforeMinutes: number
    afterMinutes: number
  }>
  
  // Staff-specific buffer settings
  staffBuffers: Record<string, {
    beforeMinutes: number
    afterMinutes: number
  }>
  
  // Location-specific buffer settings
  locationBuffers: Record<string, {
    beforeMinutes: number
    afterMinutes: number
  }>
  
  // Special buffer rules
  specialRules: {
    // Different buffers for different times of day
    timeBasedBuffers: Array<{
      startTime: string // HH:mm format
      endTime: string   // HH:mm format
      beforeMinutes: number
      afterMinutes: number
    }>
    
    // Different buffers for different days of week
    dayBasedBuffers: Record<string, {
      beforeMinutes: number
      afterMinutes: number
    }>
  }
  
  // Buffer enforcement settings
  enforcement: {
    enabled: boolean
    strictMode: boolean // If true, buffers are mandatory; if false, they're suggestions
    allowOverride: boolean // Allow staff to override buffer times
    warnOnViolation: boolean // Show warnings when buffer times are violated
  }
}

export class BufferTimeConfigService {
  private static instance: BufferTimeConfigService
  private settings: BufferTimeSettings
  private storageKey = 'vanity_buffer_time_settings'

  private constructor() {
    this.settings = this.loadSettings()
  }

  static getInstance(): BufferTimeConfigService {
    if (!BufferTimeConfigService.instance) {
      BufferTimeConfigService.instance = new BufferTimeConfigService()
    }
    return BufferTimeConfigService.instance
  }

  /**
   * Load buffer time settings from storage
   */
  private loadSettings(): BufferTimeSettings {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          return { ...this.getDefaultSettings(), ...JSON.parse(stored) }
        }
      }
    } catch (error) {
      console.error('Error loading buffer time settings:', error)
    }
    
    return this.getDefaultSettings()
  }

  /**
   * Get default buffer time settings
   */
  private getDefaultSettings(): BufferTimeSettings {
    return {
      globalBeforeMinutes: 0,
      globalAfterMinutes: 0,
      serviceBuffers: {},
      staffBuffers: {},
      locationBuffers: {},
      specialRules: {
        timeBasedBuffers: [],
        dayBasedBuffers: {}
      },
      enforcement: {
        enabled: false,
        strictMode: false,
        allowOverride: true,
        warnOnViolation: true
      }
    }
  }

  /**
   * Save buffer time settings to storage
   */
  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings))
      }
    } catch (error) {
      console.error('Error saving buffer time settings:', error)
    }
  }

  /**
   * Get current buffer time settings
   */
  getSettings(): BufferTimeSettings {
    return { ...this.settings }
  }

  /**
   * Update buffer time settings
   */
  updateSettings(updates: Partial<BufferTimeSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()
  }

  /**
   * Calculate buffer times for a specific appointment
   */
  calculateBufferTimes(params: {
    serviceId?: string
    staffId?: string
    locationId?: string
    appointmentTime?: Date
  }): { beforeMinutes: number; afterMinutes: number } {
    if (!this.settings.enforcement.enabled) {
      return { beforeMinutes: 0, afterMinutes: 0 }
    }

    let beforeMinutes = this.settings.globalBeforeMinutes
    let afterMinutes = this.settings.globalAfterMinutes

    // Apply location-specific buffers
    if (params.locationId && this.settings.locationBuffers[params.locationId]) {
      const locationBuffer = this.settings.locationBuffers[params.locationId]
      beforeMinutes = Math.max(beforeMinutes, locationBuffer.beforeMinutes)
      afterMinutes = Math.max(afterMinutes, locationBuffer.afterMinutes)
    }

    // Apply service-specific buffers
    if (params.serviceId && this.settings.serviceBuffers[params.serviceId]) {
      const serviceBuffer = this.settings.serviceBuffers[params.serviceId]
      beforeMinutes = Math.max(beforeMinutes, serviceBuffer.beforeMinutes)
      afterMinutes = Math.max(afterMinutes, serviceBuffer.afterMinutes)
    }

    // Apply staff-specific buffers
    if (params.staffId && this.settings.staffBuffers[params.staffId]) {
      const staffBuffer = this.settings.staffBuffers[params.staffId]
      beforeMinutes = Math.max(beforeMinutes, staffBuffer.beforeMinutes)
      afterMinutes = Math.max(afterMinutes, staffBuffer.afterMinutes)
    }

    // Apply time-based buffers
    if (params.appointmentTime) {
      const timeString = params.appointmentTime.toTimeString().substring(0, 5) // HH:mm
      const dayOfWeek = params.appointmentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

      // Check time-based buffers
      for (const timeBuffer of this.settings.specialRules.timeBasedBuffers) {
        if (timeString >= timeBuffer.startTime && timeString <= timeBuffer.endTime) {
          beforeMinutes = Math.max(beforeMinutes, timeBuffer.beforeMinutes)
          afterMinutes = Math.max(afterMinutes, timeBuffer.afterMinutes)
        }
      }

      // Check day-based buffers
      if (this.settings.specialRules.dayBasedBuffers[dayOfWeek]) {
        const dayBuffer = this.settings.specialRules.dayBasedBuffers[dayOfWeek]
        beforeMinutes = Math.max(beforeMinutes, dayBuffer.beforeMinutes)
        afterMinutes = Math.max(afterMinutes, dayBuffer.afterMinutes)
      }
    }

    return { beforeMinutes, afterMinutes }
  }

  /**
   * Set service-specific buffer times
   */
  setServiceBuffer(serviceId: string, beforeMinutes: number, afterMinutes: number): void {
    this.settings.serviceBuffers[serviceId] = { beforeMinutes, afterMinutes }
    this.saveSettings()
  }

  /**
   * Set staff-specific buffer times
   */
  setStaffBuffer(staffId: string, beforeMinutes: number, afterMinutes: number): void {
    this.settings.staffBuffers[staffId] = { beforeMinutes, afterMinutes }
    this.saveSettings()
  }

  /**
   * Set location-specific buffer times
   */
  setLocationBuffer(locationId: string, beforeMinutes: number, afterMinutes: number): void {
    this.settings.locationBuffers[locationId] = { beforeMinutes, afterMinutes }
    this.saveSettings()
  }

  /**
   * Enable or disable buffer time enforcement
   */
  setEnforcement(enabled: boolean, strictMode: boolean = false): void {
    this.settings.enforcement.enabled = enabled
    this.settings.enforcement.strictMode = strictMode
    this.saveSettings()
  }

  /**
   * Check if buffer times are enabled
   */
  isEnabled(): boolean {
    return this.settings.enforcement.enabled
  }

  /**
   * Check if strict mode is enabled
   */
  isStrictMode(): boolean {
    return this.settings.enforcement.strictMode
  }

  /**
   * Check if override is allowed
   */
  isOverrideAllowed(): boolean {
    return this.settings.enforcement.allowOverride
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = this.getDefaultSettings()
    this.saveSettings()
  }
}

// Export singleton instance
export const bufferTimeConfigService = BufferTimeConfigService.getInstance()

/**
 * Convenience function to calculate buffer times
 */
export function calculateBufferTimes(params: {
  serviceId?: string
  staffId?: string
  locationId?: string
  appointmentTime?: Date
}): { beforeMinutes: number; afterMinutes: number } {
  return bufferTimeConfigService.calculateBufferTimes(params)
}
