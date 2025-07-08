import { getServerSession } from "next-auth/next"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Get the current user session and location access from the database
 */
export async function getCurrentUserWithLocations(req: NextRequest) {
  try {
    // For now, we'll use a simple approach to get user info
    // In a real implementation, you would use getServerSession with proper auth options

    // Try to get user from headers first (if set by middleware)
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    const userLocations = req.headers.get('x-user-locations')

    if (userId && userRole && userLocations) {
      return {
        id: userId,
        role: userRole,
        locations: userLocations.split(',')
      }
    }

    // If no headers, try to get from session (this would need proper setup)
    // For now, return null to allow public access
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Extract user information from request headers (set by middleware)
 */
export function getUserFromHeaders(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role')
  const userLocations = req.headers.get('x-user-locations')

  if (!userId) return null

  return {
    id: userId,
    role: userRole,
    locations: userLocations ? userLocations.split(',') : []
  }
}

/**
 * Check if user has access to a specific location
 */
export function hasLocationAccess(userLocations: string[], targetLocationId: string, userRole?: string): boolean {
  // Admin users have access to all locations
  if (userRole === "ADMIN") {
    return true
  }

  // Online store is only accessible to admin users
  if (targetLocationId === "online") {
    return userRole === "ADMIN"
  }

  // Home service is only accessible to admin users (staff users are blocked)
  if (targetLocationId === "home") {
    return userRole === "ADMIN"
  }

  // Admin users with "all" access
  if (userLocations.includes("all")) {
    return true
  }

  // Check if user has access to the specific location
  return userLocations.includes(targetLocationId)
}

/**
 * Filter locations based on user access
 */
export function filterLocationsByAccess(locations: any[], userLocations: string[], userRole?: string) {
  // Admin users see all locations
  if (userRole === "ADMIN") {
    return locations
  }

  // Filter to only locations the user has access to
  return locations.filter(location => {
    // Online store is only accessible to admin users
    if (location.id === "online") {
      return userRole === "ADMIN"
    }

    // Home service is only accessible to admin users (staff users are blocked)
    if (location.id === "home") {
      return userRole === "ADMIN"
    }

    // Check if user has access to the specific location
    return userLocations.includes(location.id) || userLocations.includes("all")
  })
}

/**
 * Filter staff based on user's location access
 */
export function filterStaffByLocationAccess(staff: any[], userLocations: string[]) {
  // Admin users see all staff
  if (userLocations.includes("all")) {
    return staff
  }
  
  // Filter staff to only those assigned to user's accessible locations
  return staff.filter(staffMember => {
    // Check if staff member is assigned to any of the user's accessible locations
    return staffMember.locations.some((locationId: string) => 
      userLocations.includes(locationId)
    )
  })
}

/**
 * Filter appointments based on user's location access
 */
export function filterAppointmentsByLocationAccess(appointments: any[], userLocations: string[], userRole?: string) {
  // Admin users see all appointments
  if (userRole === "ADMIN") {
    return appointments
  }

  // Filter appointments to only those at user's accessible locations
  return appointments.filter(appointment => {
    const locationId = appointment.locationId || appointment.location

    // Online store appointments are only accessible to admin users
    if (locationId === "online") {
      return userRole === "ADMIN"
    }

    // Home service appointments are only accessible to admin users (staff users are blocked)
    if (locationId === "home") {
      return userRole === "ADMIN"
    }

    // Check if user has access to the appointment's location
    return userLocations.includes(locationId) || userLocations.includes("all")
  })
}
