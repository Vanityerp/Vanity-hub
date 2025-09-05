"use client"

import { useState, useEffect, useCallback } from "react"
import { staffAvailabilityService } from "@/lib/services/staff-availability"
import { getAllAppointments } from "@/lib/appointment-service"
import { parseISO, addMinutes, isSameDay, format } from "date-fns"

export interface StaffAvailabilityStatus {
  staffId: string
  isAvailable: boolean
  conflicts: Array<{
    appointmentId: string
    location: string
    locationType: 'home' | 'physical'
    clientName: string
    service: string
    startTime: Date
    endTime: Date
  }>
  reason?: string
}

export interface UseStaffAvailabilitySyncOptions {
  date: Date
  timeSlot?: {
    start: Date
    end: Date
  }
  locationId?: string
  refreshInterval?: number // in milliseconds
}

/**
 * Hook for real-time staff availability sync with bidirectional blocking
 * Shows when staff are unavailable due to appointments at other locations
 */
export function useStaffAvailabilitySync(options: UseStaffAvailabilitySyncOptions) {
  const { date, timeSlot, locationId, refreshInterval = 30000 } = options
  
  const [staffAvailability, setStaffAvailability] = useState<Record<string, StaffAvailabilityStatus>>({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /**
   * Check availability for a specific staff member
   */
  const checkStaffAvailability = useCallback(async (
    staffId: string,
    checkTimeSlot?: { start: Date; end: Date },
    checkLocationId?: string
  ): Promise<StaffAvailabilityStatus> => {
    try {
      const slot = checkTimeSlot || timeSlot
      const location = checkLocationId || locationId

      if (!slot || !location) {
        return {
          staffId,
          isAvailable: true,
          conflicts: []
        }
      }

      // Check bidirectional conflicts
      const bidirectionalCheck = await staffAvailabilityService.checkBidirectionalConflicts(
        staffId,
        slot,
        location
      )

      // Check general availability
      const availabilityResult = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: slot,
        locationId: location
      })

      return {
        staffId,
        isAvailable: availabilityResult.isAvailable,
        conflicts: bidirectionalCheck.conflicts,
        reason: availabilityResult.reason
      }
    } catch (error) {
      console.error('Error checking staff availability:', error)
      return {
        staffId,
        isAvailable: false,
        conflicts: [],
        reason: 'Error checking availability'
      }
    }
  }, [timeSlot, locationId])

  /**
   * Check availability for multiple staff members
   */
  const checkMultipleStaffAvailability = useCallback(async (
    staffIds: string[],
    checkTimeSlot?: { start: Date; end: Date },
    checkLocationId?: string
  ): Promise<Record<string, StaffAvailabilityStatus>> => {
    setLoading(true)
    
    try {
      const results: Record<string, StaffAvailabilityStatus> = {}
      
      // Check each staff member's availability
      for (const staffId of staffIds) {
        results[staffId] = await checkStaffAvailability(staffId, checkTimeSlot, checkLocationId)
      }
      
      setStaffAvailability(results)
      setLastUpdated(new Date())
      
      return results
    } catch (error) {
      console.error('Error checking multiple staff availability:', error)
      return {}
    } finally {
      setLoading(false)
    }
  }, [checkStaffAvailability])

  /**
   * Get staff conflicts for a specific date
   */
  const getStaffConflictsForDate = useCallback(async (staffId: string, checkDate: Date) => {
    try {
      const allAppointments = getAllAppointments()
      
      return allAppointments.filter(appointment => {
        if (appointment.staffId !== staffId) return false
        if (['cancelled', 'completed', 'no-show'].includes(appointment.status?.toLowerCase())) return false
        
        const appointmentDate = parseISO(appointment.date)
        return isSameDay(appointmentDate, checkDate)
      }).map(appointment => ({
        appointmentId: appointment.id,
        location: appointment.location,
        locationType: appointment.location === 'home' ? 'home' as const : 'physical' as const,
        clientName: appointment.clientName,
        service: appointment.service,
        startTime: parseISO(appointment.date),
        endTime: addMinutes(parseISO(appointment.date), appointment.duration)
      }))
    } catch (error) {
      console.error('Error getting staff conflicts for date:', error)
      return []
    }
  }, [])

  /**
   * Get visual indicator for staff unavailability
   */
  const getUnavailabilityIndicator = useCallback((staffId: string): string | null => {
    const status = staffAvailability[staffId]
    if (!status || status.isAvailable) return null

    const homeConflicts = status.conflicts.filter(c => c.locationType === 'home')
    const physicalConflicts = status.conflicts.filter(c => c.locationType === 'physical')

    if (homeConflicts.length > 0) {
      return `Home Service - ${homeConflicts[0].clientName}`
    }
    
    if (physicalConflicts.length > 0) {
      const location = physicalConflicts[0].location
      const locationName = location === 'home' ? 'Home Service' : location
      return `${locationName} - ${physicalConflicts[0].clientName}`
    }

    return status.reason || 'Unavailable'
  }, [staffAvailability])

  /**
   * Refresh availability data
   */
  const refreshAvailability = useCallback(async (staffIds: string[]) => {
    return await checkMultipleStaffAvailability(staffIds)
  }, [checkMultipleStaffAvailability])

  // Auto-refresh availability data
  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      const staffIds = Object.keys(staffAvailability)
      if (staffIds.length > 0) {
        refreshAvailability(staffIds)
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, staffAvailability, refreshAvailability])

  return {
    staffAvailability,
    loading,
    lastUpdated,
    checkStaffAvailability,
    checkMultipleStaffAvailability,
    getStaffConflictsForDate,
    getUnavailabilityIndicator,
    refreshAvailability
  }
}
