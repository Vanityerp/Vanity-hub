"use client"

import { v4 as uuidv4 } from "uuid"

// Storage keys for localStorage
const STORAGE_KEYS = {
  SCHEDULES: "vanity_staff_schedules",
  TIME_OFF: "vanity_staff_time_off"
}

// Schedule interface
export interface StaffSchedule {
  id: string
  staffId: string
  day: string
  startTime: string
  endTime: string
  location: string
  isRecurring: boolean
  isDayOff?: boolean
  effectiveDate?: string
  expiryDate?: string
}

// Time off request interface
export interface TimeOffRequest {
  id: string
  staffId: string
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

// Default schedules - Updated to include real staff IDs and proper day-offs
const defaultSchedules: StaffSchedule[] = [
  // Legacy schedules for backward compatibility
  { id: "s1", staffId: "1", day: "Monday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s2", staffId: "1", day: "Tuesday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s3", staffId: "1", day: "Wednesday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s4", staffId: "1", day: "Thursday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s5", staffId: "1", day: "Friday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s6", staffId: "2", day: "Monday", startTime: "10:00", endTime: "18:00", location: "loc1", isRecurring: true },
  { id: "s7", staffId: "2", day: "Wednesday", startTime: "10:00", endTime: "18:00", location: "loc1", isRecurring: true },
  { id: "s8", staffId: "2", day: "Friday", startTime: "10:00", endTime: "18:00", location: "loc1", isRecurring: true },
  { id: "s9", staffId: "3", day: "Tuesday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s10", staffId: "3", day: "Thursday", startTime: "9:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "s11", staffId: "3", day: "Saturday", startTime: "10:00", endTime: "16:00", location: "loc1", isRecurring: true },
  { id: "s12", staffId: "4", day: "Monday", startTime: "9:00", endTime: "17:00", location: "loc2", isRecurring: true },
  { id: "s13", staffId: "4", day: "Tuesday", startTime: "9:00", endTime: "17:00", location: "loc2", isRecurring: true },
  { id: "s14", staffId: "4", day: "Wednesday", startTime: "9:00", endTime: "17:00", location: "loc2", isRecurring: true },
  { id: "s15", staffId: "5", day: "Thursday", startTime: "10:00", endTime: "18:00", location: "loc3", isRecurring: true },
  { id: "s16", staffId: "5", day: "Friday", startTime: "10:00", endTime: "18:00", location: "loc3", isRecurring: true },
  { id: "s17", staffId: "5", day: "Saturday", startTime: "10:00", endTime: "16:00", location: "loc3", isRecurring: true },

  // Schedules for real staff members - using database IDs that will be generated
  // Note: These will need to be updated with actual staff IDs from the database
  // For now, we'll use a pattern that can be easily identified and updated

  // Rana Othman's schedule - OFF on Wednesday
  { id: "rana-mon", staffId: "rana-othman", day: "Monday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "rana-tue", staffId: "rana-othman", day: "Tuesday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
  // Wednesday is intentionally missing - this is her day off
  { id: "rana-thu", staffId: "rana-othman", day: "Thursday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "rana-fri", staffId: "rana-othman", day: "Friday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "rana-sat", staffId: "rana-othman", day: "Saturday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
  { id: "rana-sun", staffId: "rana-othman", day: "Sunday", startTime: "09:00", endTime: "17:00", location: "loc1", isRecurring: true },
]

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const storedValue = localStorage.getItem(key)
    if (!storedValue) {
      return defaultValue
    }

    try {
      const parsedValue = JSON.parse(storedValue)
      return parsedValue as T
    } catch (parseError) {
      console.error(`Error parsing JSON for ${key} from localStorage:`, parseError)
      return defaultValue
    }
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Schedule Storage Service
export const ScheduleStorage = {
  // Staff Schedules
  getSchedules: (): StaffSchedule[] => getFromStorage<StaffSchedule[]>(STORAGE_KEYS.SCHEDULES, defaultSchedules),

  saveSchedules: (schedules: StaffSchedule[]) => saveToStorage(STORAGE_KEYS.SCHEDULES, schedules),

  addSchedule: (schedule: Omit<StaffSchedule, "id">) => {
    const schedules = ScheduleStorage.getSchedules()
    const newSchedule = {
      id: uuidv4(),
      ...schedule
    }
    schedules.push(newSchedule)
    saveToStorage(STORAGE_KEYS.SCHEDULES, schedules)
    return newSchedule
  },

  updateSchedule: (updatedSchedule: StaffSchedule) => {
    const schedules = ScheduleStorage.getSchedules()
    const index = schedules.findIndex(schedule => schedule.id === updatedSchedule.id)
    if (index !== -1) {
      schedules[index] = updatedSchedule
      saveToStorage(STORAGE_KEYS.SCHEDULES, schedules)
      return true
    }
    return false
  },

  deleteSchedule: (scheduleId: string) => {
    const schedules = ScheduleStorage.getSchedules()
    const filteredSchedules = schedules.filter(schedule => schedule.id !== scheduleId)
    saveToStorage(STORAGE_KEYS.SCHEDULES, filteredSchedules)
  },

  getStaffSchedule: (staffId: string): StaffSchedule[] => {
    const schedules = ScheduleStorage.getSchedules()
    return schedules.filter(schedule => schedule.staffId === staffId)
  },

  // Time Off Requests
  getTimeOffRequests: (): TimeOffRequest[] => getFromStorage<TimeOffRequest[]>(STORAGE_KEYS.TIME_OFF, []),

  saveTimeOffRequests: (requests: TimeOffRequest[]) => saveToStorage(STORAGE_KEYS.TIME_OFF, requests),

  addTimeOffRequest: (request: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt">) => {
    const requests = ScheduleStorage.getTimeOffRequests()
    const now = new Date().toISOString()
    const newRequest = {
      id: uuidv4(),
      ...request,
      createdAt: now,
      updatedAt: now
    }
    requests.push(newRequest)
    saveToStorage(STORAGE_KEYS.TIME_OFF, requests)
    return newRequest
  },

  updateTimeOffRequest: (updatedRequest: TimeOffRequest) => {
    const requests = ScheduleStorage.getTimeOffRequests()
    const index = requests.findIndex(request => request.id === updatedRequest.id)
    if (index !== -1) {
      requests[index] = {
        ...updatedRequest,
        updatedAt: new Date().toISOString()
      }
      saveToStorage(STORAGE_KEYS.TIME_OFF, requests)
      return true
    }
    return false
  },

  deleteTimeOffRequest: (requestId: string) => {
    const requests = ScheduleStorage.getTimeOffRequests()
    const filteredRequests = requests.filter(request => request.id !== requestId)
    saveToStorage(STORAGE_KEYS.TIME_OFF, filteredRequests)
  },

  getStaffTimeOffRequests: (staffId: string): TimeOffRequest[] => {
    const requests = ScheduleStorage.getTimeOffRequests()
    return requests.filter(request => request.staffId === staffId)
  }
}
