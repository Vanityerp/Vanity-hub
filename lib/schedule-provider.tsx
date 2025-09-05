"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { StaffSchedule, TimeOffRequest, ScheduleStorage } from "@/lib/schedule-storage"

// Define the context type
interface ScheduleContextType {
  schedules: StaffSchedule[]
  timeOffRequests: TimeOffRequest[]
  refreshSchedules: () => void
  addSchedule: (schedule: Omit<StaffSchedule, "id">) => StaffSchedule
  updateSchedule: (schedule: StaffSchedule) => boolean
  deleteSchedule: (scheduleId: string) => void
  getStaffSchedule: (staffId: string) => StaffSchedule[]
  addTimeOffRequest: (request: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt">) => TimeOffRequest
  updateTimeOffRequest: (request: TimeOffRequest) => boolean
  deleteTimeOffRequest: (requestId: string) => void
  getStaffTimeOffRequests: (staffId: string) => TimeOffRequest[]
}

// Create the context with default values
const ScheduleContext = createContext<ScheduleContextType>({
  schedules: [],
  timeOffRequests: [],
  refreshSchedules: () => {},
  addSchedule: () => ({ id: "", staffId: "", day: "", startTime: "", endTime: "", location: "", isRecurring: false, isDayOff: false }),
  updateSchedule: () => false,
  deleteSchedule: () => {},
  getStaffSchedule: () => [],
  addTimeOffRequest: () => ({
    id: "",
    staffId: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: "pending",
    createdAt: "",
    updatedAt: ""
  }),
  updateTimeOffRequest: () => false,
  deleteTimeOffRequest: () => {},
  getStaffTimeOffRequests: () => []
})

// Create the provider component
export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([])
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load initial data
  useEffect(() => {
    if (isInitialized) return

    const storedSchedules = ScheduleStorage.getSchedules()
    const storedTimeOffRequests = ScheduleStorage.getTimeOffRequests()

    setSchedules(storedSchedules)
    setTimeOffRequests(storedTimeOffRequests)
    setIsInitialized(true)
  }, [isInitialized])

  // Refresh schedules from storage
  const refreshSchedules = useCallback(() => {
    const storedSchedules = ScheduleStorage.getSchedules()
    const storedTimeOffRequests = ScheduleStorage.getTimeOffRequests()

    setSchedules(storedSchedules)
    setTimeOffRequests(storedTimeOffRequests)
  }, [])

  // Add a new schedule
  const addSchedule = useCallback((schedule: Omit<StaffSchedule, "id">) => {
    const newSchedule = ScheduleStorage.addSchedule(schedule)
    setSchedules(prev => [...prev, newSchedule])
    return newSchedule
  }, [])

  // Update an existing schedule
  const updateSchedule = useCallback((schedule: StaffSchedule) => {
    const success = ScheduleStorage.updateSchedule(schedule)
    if (success) {
      setSchedules(prev =>
        prev.map(s => s.id === schedule.id ? schedule : s)
      )
    }
    return success
  }, [])

  // Delete a schedule
  const deleteSchedule = useCallback((scheduleId: string) => {
    ScheduleStorage.deleteSchedule(scheduleId)
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }, [])

  // Get schedules for a specific staff member
  const getStaffSchedule = useCallback((staffId: string) => {
    return schedules.filter(s => s.staffId === staffId)
  }, [schedules])

  // Add a new time off request
  const addTimeOffRequest = useCallback((request: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt">) => {
    const newRequest = ScheduleStorage.addTimeOffRequest(request)
    setTimeOffRequests(prev => [...prev, newRequest])
    return newRequest
  }, [])

  // Update an existing time off request
  const updateTimeOffRequest = useCallback((request: TimeOffRequest) => {
    const success = ScheduleStorage.updateTimeOffRequest(request)
    if (success) {
      setTimeOffRequests(prev =>
        prev.map(r => r.id === request.id ? request : r)
      )
    }
    return success
  }, [])

  // Delete a time off request
  const deleteTimeOffRequest = useCallback((requestId: string) => {
    ScheduleStorage.deleteTimeOffRequest(requestId)
    setTimeOffRequests(prev => prev.filter(r => r.id !== requestId))
  }, [])

  // Get time off requests for a specific staff member
  const getStaffTimeOffRequests = useCallback((staffId: string) => {
    return timeOffRequests.filter(r => r.staffId === staffId)
  }, [timeOffRequests])

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        timeOffRequests,
        refreshSchedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getStaffSchedule,
        addTimeOffRequest,
        updateTimeOffRequest,
        deleteTimeOffRequest,
        getStaffTimeOffRequests
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

// Custom hook to use the schedule context
export const useSchedule = () => useContext(ScheduleContext)
