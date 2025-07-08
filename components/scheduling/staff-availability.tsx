"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useStaff } from "@/lib/staff-provider"
import { getFirstName } from "@/lib/female-avatars"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, addMinutes, set } from "date-fns"
import { getAllAppointments } from "@/lib/appointment-service"
import { staffAvailabilityService } from "@/lib/services/staff-availability"
import { useStaffAvailabilitySync } from "@/hooks/use-staff-availability-sync"
import { appointmentSyncService, AppointmentSyncEvent } from "@/lib/services/appointment-sync"

export function StaffAvailability() {
  const { currentLocation } = useAuth()
  const { activeStaff: staff, getActiveStaffByLocation } = useStaff()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedStaff, setSelectedStaff] = useState<string>("all")

  // Use the staff availability sync hook for real-time updates
  const {
    staffAvailability,
    getUnavailabilityIndicator,
    checkMultipleStaffAvailability,
    refreshAvailability
  } = useStaffAvailabilitySync({
    date,
    locationId: currentLocation,
    refreshInterval: 30000 // Refresh every 30 seconds
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Get REAL ACTIVE staff for the current location from HR system - NO mock data (excludes inactive/on-leave)
  const filteredStaff = getActiveStaffByLocation(currentLocation)

  // Debug log to verify we're using REAL staff data from HR system
  console.log("StaffAvailability - Using REAL staff from HR system");
  console.log("StaffAvailability - Current Location:", currentLocation);
  console.log("StaffAvailability - Total Real Staff Count:", staff.length);
  console.log("StaffAvailability - Filtered Staff for Location:", filteredStaff.length);

  // Listen for real-time appointment updates to refresh availability
  useEffect(() => {
    const handleAppointmentSync = (event: AppointmentSyncEvent) => {
      // Refresh availability when appointments are created, updated, or deleted
      if (['appointment_created', 'appointment_updated', 'appointment_deleted'].includes(event.type)) {
        setRefreshTrigger(prev => prev + 1)
      }
    }

    const unsubscribe = appointmentSyncService.subscribe('*', handleAppointmentSync)

    return () => {
      unsubscribe()
    }
  }, [])

  // Verify we have real staff data (should be exactly 7 real staff members)
  if (staff.length === 0) {
    console.warn("⚠️ StaffAvailability - No staff data found! Check HR staff management system.");
  } else if (staff.length !== 7) {
    console.warn(`⚠️ StaffAvailability - Expected 7 real staff members, found ${staff.length}. Check HR system.`);
  } else {
    console.log("✅ StaffAvailability - Using correct number of real staff members (7)");
  }

  // Create time slots for the day
  const timeSlots = []
  for (let i = 9; i < 19; i++) {
    timeSlots.push({
      time: `${i}:00`,
      hour: i,
      minutes: 0,
    })
    timeSlots.push({
      time: `${i}:30`,
      hour: i,
      minutes: 30,
    })
  }

  // Filter REAL appointments for the selected day and staff - NO mock data
  const getAppointmentsForStaff = (staffId: string) => {
    // Get all real appointments from the appointment service
    const allAppointments = getAllAppointments();

    return allAppointments.filter((appointment) => {
      const appointmentDate = parseISO(appointment.date)

      // Check if it's within the selected day
      const isSelectedDay = isWithinInterval(appointmentDate, {
        start: startOfDay(date),
        end: endOfDay(date),
      })

      // Filter by staff if needed
      const isCorrectStaff = staffId === "all" || appointment.staffId === staffId

      // Filter by location
      const isCorrectLocation = currentLocation === "all" || appointment.location === currentLocation

      return isSelectedDay && isCorrectStaff && isCorrectLocation
    })
  }

  // Check if a staff member is available at a given time slot (cross-location)
  const isAvailable = async (staffId: string, timeSlot: any) => {
    try {
      // Create the time slot for checking
      const slotDate = set(date, {
        hours: timeSlot.hour,
        minutes: timeSlot.minutes,
        seconds: 0,
        milliseconds: 0
      })

      // Check availability across all locations using the new service
      const result = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: slotDate,
          end: addMinutes(slotDate, 30) // Assume 30-minute slots for availability checking
        }
      })

      return result.isAvailable
    } catch (error) {
      console.error('Error checking staff availability:', error)
      return false // Default to unavailable on error
    }
  }

  // Get conflict details for a staff member at a specific time slot
  const getConflictDetails = async (staffId: string, timeSlot: any) => {
    try {
      const slotDate = set(date, {
        hours: timeSlot.hour,
        minutes: timeSlot.minutes,
        seconds: 0,
        milliseconds: 0
      })

      const result = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: slotDate,
          end: addMinutes(slotDate, 30)
        }
      })

      return {
        isAvailable: result.isAvailable,
        conflicts: result.conflictingAppointments,
        blockedTimes: result.blockedTimeSlots,
        reason: result.reason
      }
    } catch (error) {
      console.error('Error getting conflict details:', error)
      return {
        isAvailable: false,
        conflicts: [],
        blockedTimes: [],
        reason: 'Error checking availability'
      }
    }
  }

  // Component for individual availability cell with async checking
  const AvailabilityCell = ({ staffId, timeSlot, staffName }: { staffId: string, timeSlot: any, staffName: string }) => {
    const [availability, setAvailability] = useState<{
      isAvailable: boolean
      isLoading: boolean
      conflicts: any[]
      reason?: string
    }>({
      isAvailable: true,
      isLoading: true,
      conflicts: [],
    })

    useEffect(() => {
      const checkAvailability = async () => {
        setAvailability(prev => ({ ...prev, isLoading: true }))

        try {
          const details = await getConflictDetails(staffId, timeSlot)
          setAvailability({
            isAvailable: details.isAvailable,
            isLoading: false,
            conflicts: [...details.conflicts, ...details.blockedTimes],
            reason: details.reason
          })
        } catch (error) {
          console.error('Error checking availability:', error)
          setAvailability({
            isAvailable: false,
            isLoading: false,
            conflicts: [],
            reason: 'Error checking availability'
          })
        }
      }

      checkAvailability()
    }, [staffId, timeSlot, date, refreshTrigger])

    const getLocationFromConflicts = () => {
      if (availability.conflicts.length > 0) {
        const locations = [...new Set(availability.conflicts.map(c => c.location))]
        return locations.join(', ')
      }
      return ''
    }

    const conflictLocation = getLocationFromConflicts()

    return (
      <div
        className={`p-2 text-center border-r last:border-r-0 relative group cursor-help ${
          availability.isLoading
            ? "bg-gray-100 dark:bg-gray-800"
            : availability.isAvailable
            ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
            : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
        }`}
        title={availability.isLoading ? "Checking..." : availability.reason || (availability.isAvailable ? "Available" : "Unavailable")}
      >
        {availability.isLoading ? (
          <span className="text-xs">...</span>
        ) : availability.isAvailable ? (
          "Available"
        ) : (
          <div className="text-xs">
            <div>Booked</div>
            {conflictLocation && (
              <Badge variant="outline" className="text-xs mt-1">
                {conflictLocation}
              </Badge>
            )}
          </div>
        )}

        {/* Tooltip for conflict details */}
        {!availability.isLoading && !availability.isAvailable && availability.conflicts.length > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
            {availability.conflicts.map((conflict, index) => (
              <div key={index}>
                {conflict.location}: {conflict.service || conflict.title || 'Blocked time'}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Staff Availability</CardTitle>
        <CardDescription>Check availability for stylists across time slots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />

            <div className="mt-4">
              <Tabs defaultValue="all" value={selectedStaff} onValueChange={setSelectedStaff}>
                <TabsList className="w-full flex-wrap">
                  <TabsTrigger value="all">All Staff</TabsTrigger>
                  {filteredStaff.map((staff) => (
                    <TabsTrigger key={staff.id} value={staff.id}>
                      {getFirstName(staff.name)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="overflow-auto">
            <h3 className="font-medium text-lg mb-4">{format(date, "EEEE, MMMM d, yyyy")}</h3>

            <div className="border rounded-md">
              <div className="grid grid-cols-[100px_1fr] overflow-x-auto">
                <div></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-b">
                  {selectedStaff === "all" ? (
                    filteredStaff.map((staff) => (
                      <div key={staff.id} className="p-2 text-center font-medium border-r last:border-r-0">
                        {getFirstName(staff.name)}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center font-medium">
                      {getFirstName(filteredStaff.find((s) => s.id === selectedStaff)?.name || "Unknown Staff")}
                    </div>
                  )}
                </div>

                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot.time} className="grid grid-cols-[100px_1fr] border-b last:border-b-0">
                    <div className="p-2 border-r text-sm font-medium text-muted-foreground">{timeSlot.time}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {selectedStaff === "all" ? (
                        filteredStaff.map((staff) => (
                          <AvailabilityCell
                            key={staff.id}
                            staffId={staff.id}
                            timeSlot={timeSlot}
                            staffName={staff.name}
                          />
                        ))
                      ) : (
                        <AvailabilityCell
                          staffId={selectedStaff}
                          timeSlot={timeSlot}
                          staffName={filteredStaff.find((s) => s.id === selectedStaff)?.name || "Unknown Staff"}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

