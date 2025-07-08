/**
 * Centralized Date Formatting Utilities
 * Enforces dd-mm-yyyy format throughout the application
 */

import { format, parse, parseISO, isValid, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns"

// Standard date format for the application
export const APP_DATE_FORMAT = "dd-MM-yyyy"
export const APP_DATETIME_FORMAT = "dd-MM-yyyy HH:mm"
export const APP_TIME_FORMAT = "HH:mm"

/**
 * Format a date to the standard app format (dd-mm-yyyy)
 */
export function formatAppDate(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return ""
    return format(dateObj, APP_DATE_FORMAT)
  } catch (error) {
    console.warn("Error formatting date:", error)
    return ""
  }
}

/**
 * Format a date with time to the standard app format (dd-mm-yyyy HH:mm)
 */
export function formatAppDateTime(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return ""
    return format(dateObj, APP_DATETIME_FORMAT)
  } catch (error) {
    console.warn("Error formatting datetime:", error)
    return ""
  }
}

/**
 * Format time only (HH:mm)
 */
export function formatAppTime(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) return ""
    return format(dateObj, APP_TIME_FORMAT)
  } catch (error) {
    console.warn("Error formatting time:", error)
    return ""
  }
}

/**
 * Parse a date string in dd-mm-yyyy format to a Date object
 */
export function parseAppDate(dateString: string): Date | null {
  if (!dateString) return null
  
  try {
    // Handle different input formats
    if (dateString.includes("T") || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      // ISO format
      return parseISO(dateString)
    }
    
    if (dateString.match(/^\d{2}-\d{2}-\d{4}/)) {
      // dd-mm-yyyy format
      return parse(dateString, APP_DATE_FORMAT, new Date())
    }
    
    if (dateString.match(/^\d{2}-\d{2}-\d{2}/)) {
      // dd-mm-yy format
      const [day, month, year] = dateString.split("-")
      const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)
      return parse(`${day}-${month}-${fullYear}`, APP_DATE_FORMAT, new Date())
    }
    
    // Try to parse as ISO date
    const isoDate = parseISO(dateString)
    if (isValid(isoDate)) return isoDate
    
    return null
  } catch (error) {
    console.warn("Error parsing date:", error)
    return null
  }
}

/**
 * Convert any date format to ISO string for database storage
 */
export function toISOString(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return ""
    return dateObj.toISOString()
  } catch (error) {
    console.warn("Error converting to ISO string:", error)
    return ""
  }
}

/**
 * Format date for display in date inputs (yyyy-mm-dd format required by HTML date inputs)
 */
export function formatForDateInput(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return ""
    return format(dateObj, "yyyy-MM-dd")
  } catch (error) {
    console.warn("Error formatting for date input:", error)
    return ""
  }
}

/**
 * Format date for calendar components (compatible with react-day-picker)
 */
export function formatForCalendar(date: Date | string | null | undefined): Date | undefined {
  if (!date) return undefined
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return undefined
    return dateObj
  } catch (error) {
    console.warn("Error formatting for calendar:", error)
    return undefined
  }
}

/**
 * Format relative time (e.g., "Today", "Yesterday", "2 days ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ""
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return ""
    
    const now = new Date()
    const daysDiff = differenceInDays(now, dateObj)
    
    if (daysDiff === 0) {
      const hoursDiff = differenceInHours(now, dateObj)
      if (hoursDiff === 0) {
        const minutesDiff = differenceInMinutes(now, dateObj)
        if (minutesDiff < 1) return "Just now"
        if (minutesDiff === 1) return "1 minute ago"
        return `${minutesDiff} minutes ago`
      }
      if (hoursDiff === 1) return "1 hour ago"
      if (hoursDiff < 24) return `${hoursDiff} hours ago`
      return "Today"
    }
    
    if (daysDiff === 1) return "Yesterday"
    if (daysDiff < 7) return `${daysDiff} days ago`
    if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7)
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
    }
    if (daysDiff < 365) {
      const months = Math.floor(daysDiff / 30)
      return months === 1 ? "1 month ago" : `${months} months ago`
    }
    
    const years = Math.floor(daysDiff / 365)
    return years === 1 ? "1 year ago" : `${years} years ago`
  } catch (error) {
    console.warn("Error formatting relative time:", error)
    return formatAppDate(date)
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string {
  if (!startDate) return "Select date range"
  
  const start = formatAppDate(startDate)
  if (!endDate) return start
  
  const end = formatAppDate(endDate)
  if (start === end) return start
  
  return `${start} - ${end}`
}

/**
 * Validate if a string is in valid dd-mm-yyyy format
 */
export function isValidAppDateFormat(dateString: string): boolean {
  if (!dateString) return false
  
  const regex = /^\d{2}-\d{2}-\d{4}$/
  if (!regex.test(dateString)) return false
  
  const parsed = parseAppDate(dateString)
  return parsed !== null && isValid(parsed)
}

/**
 * Get current date in app format
 */
export function getCurrentAppDate(): string {
  return formatAppDate(new Date())
}

/**
 * Get current datetime in app format
 */
export function getCurrentAppDateTime(): string {
  return formatAppDateTime(new Date())
}

/**
 * Convert date from any format to app format
 */
export function normalizeToAppDate(date: Date | string | null | undefined): string {
  return formatAppDate(date)
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return false
    
    const today = new Date()
    return format(dateObj, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
  } catch (error) {
    return false
  }
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | null | undefined): boolean {
  if (!date) return false
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return false
    
    return dateObj < new Date()
  } catch (error) {
    return false
  }
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | null | undefined): boolean {
  if (!date) return false
  
  try {
    const dateObj = typeof date === "string" ? parseAppDate(date) : date
    if (!dateObj || !isValid(dateObj)) return false
    
    return dateObj > new Date()
  } catch (error) {
    return false
  }
}
