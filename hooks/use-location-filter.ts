import { useSession } from "next-auth/react"
import { useMemo } from "react"

/**
 * Hook to filter data based on user's location access
 */
export function useLocationFilter() {
  const { data: session } = useSession()

  const userLocations = useMemo(() => {
    if (!session?.user?.locations) return []
    return session.user.locations
  }, [session])

  const hasLocationAccess = (locationId: string): boolean => {
    if (!session?.user) return true // Allow access if not authenticated (for public data)

    // Admin users have access to all locations
    if (session.user.role === "ADMIN") return true

    // If user has "all" in their locations, they can access all locations
    if (userLocations.includes("all")) return true

    // Online store is only accessible to admin users
    if (locationId === "online") return session.user.role === "ADMIN"

    // Home service is only accessible to admin users (staff users are blocked)
    if (locationId === "home") return session.user.role === "ADMIN"

    // Check if the location is in the user's assigned locations
    return userLocations.includes(locationId)
  }

  const filterLocations = <T extends { id: string }>(locations: T[]): T[] => {
    if (!session?.user) return locations // Return all if not authenticated

    // Admin users see all locations
    if (session.user.role === "ADMIN") return locations

    // If user has "all" access, return all locations (but still filter online for non-admin)
    if (userLocations.includes("all")) {
      return locations.filter(location => {
        // Even with "all" access, non-admin users cannot see online store
        if (location.id === "online") {
          return session.user.role === "ADMIN"
        }
        return true
      })
    }

    // Filter to only locations the user has access to
    return locations.filter(location => {
      // Online store is only accessible to admin users
      if (location.id === "online") {
        return session.user.role === "ADMIN"
      }

      // Always include home service
      if (location.id === "home") {
        return true
      }

      // For regular locations, check user permissions
      return userLocations.includes(location.id)
    })
  }

  const filterStaff = <T extends { locations: string[] }>(staff: T[]): T[] => {
    if (!session?.user) return staff // Return all if not authenticated
    
    // Admin users see all staff
    if (session.user.role === "ADMIN") return staff
    
    // If user has "all" access, return all staff
    if (userLocations.includes("all")) return staff
    
    // Filter staff to only those assigned to user's accessible locations
    return staff.filter(staffMember => {
      // Check if staff member is assigned to any of the user's accessible locations
      return staffMember.locations.some(locationId => userLocations.includes(locationId))
    })
  }

  const filterAppointments = <T extends { location: string }>(appointments: T[]): T[] => {
    if (!session?.user) return appointments // Return all if not authenticated

    // Admin users see all appointments
    if (session.user.role === "ADMIN") return appointments

    // If user has "all" access, return all appointments (but still filter online for non-admin)
    if (userLocations.includes("all")) {
      return appointments.filter(appointment => {
        // Even with "all" access, non-admin users cannot see online store appointments
        if (appointment.location === "online") {
          return session.user.role === "ADMIN"
        }
        return true
      })
    }

    // Filter appointments to only those at user's accessible locations
    return appointments.filter(appointment => {
      // Online store appointments are only accessible to admin users
      if (appointment.location === "online") {
        return session.user.role === "ADMIN"
      }

      // Home service appointments are only accessible to admin users (staff users are blocked)
      if (appointment.location === "home") {
        return session.user.role === "ADMIN"
      }

      // For regular locations, check user permissions
      return userLocations.includes(appointment.location)
    })
  }

  const isAdmin = session?.user?.role === "ADMIN"
  const isStaff = session?.user?.role === "STAFF"
  const isManager = session?.user?.role === "MANAGER"

  return {
    userLocations,
    hasLocationAccess,
    filterLocations,
    filterStaff,
    filterAppointments,
    isAdmin,
    isStaff,
    isManager,
    isAuthenticated: !!session?.user
  }
}
