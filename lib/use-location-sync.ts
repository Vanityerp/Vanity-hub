/**
 * Location Synchronization Hook
 * 
 * This hook allows components to subscribe to location changes and
 * automatically update when locations are added, updated, or removed.
 */

import { useEffect, useState } from "react"
import { Location } from "@/lib/settings-storage"
import { locationEventBus, LocationEventType } from "@/lib/location-event-bus"
import { useLocations } from "@/lib/location-provider"
import { useAuth } from "@/lib/auth-provider"

interface UseLocationSyncOptions {
  /**
   * Event types to subscribe to
   */
  eventTypes?: LocationEventType[]
  
  /**
   * Whether to include the special Home Service location
   */
  includeHomeService?: boolean
  
  /**
   * Whether to include only active locations
   */
  activeOnly?: boolean
  
  /**
   * Callback to run when locations change
   */
  onChange?: (locations: Location[]) => void
}

/**
 * Hook to synchronize with location changes
 */
export function useLocationSync(options: UseLocationSyncOptions = {}) {
  const {
    eventTypes = ['location-added', 'location-updated', 'location-removed', 'locations-refreshed'],
    includeHomeService = true,
    activeOnly = true,
    onChange
  } = options

  const {
    locations: allLocations,
    getLocationById,
    syncLocations
  } = useLocations()

  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  
  // Filter locations based on options
  useEffect(() => {
    let filteredLocations = [...allLocations]
    
    // Filter active locations if needed
    if (activeOnly) {
      filteredLocations = filteredLocations.filter(loc => loc.status === "Active")
    }
    
    // Add home service location if needed and user has permission
    if (includeHomeService) {
      // Only admin users can access home service
      if (user?.role === "ADMIN") {
        const homeService = getLocationById("home")
        if (homeService && !filteredLocations.some(loc => loc.id === "home")) {
          filteredLocations.push(homeService)
        }
      }
    } else {
      // Remove home service location if it exists
      filteredLocations = filteredLocations.filter(loc => loc.id !== "home")
    }

    // Always remove home service location for non-admin users
    if (user?.role !== "ADMIN") {
      filteredLocations = filteredLocations.filter(loc => loc.id !== "home")
    }
    
    setLocations(filteredLocations)
    
    // Call onChange callback if provided
    if (onChange) {
      onChange(filteredLocations)
    }
  }, [allLocations, activeOnly, includeHomeService, getLocationById, onChange, user])
  
  // Subscribe to location events
  useEffect(() => {
    const unsubscribers = eventTypes.map(eventType => 
      locationEventBus.subscribe(eventType, () => {
        // Synchronize locations when events occur
        syncLocations()
      })
    )
    
    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [eventTypes, syncLocations])
  
  return {
    /**
     * Filtered locations based on options
     */
    locations,
    
    /**
     * Force synchronization of locations
     */
    syncLocations,
    
    /**
     * Check if a location exists by ID
     */
    hasLocation: (id: string) => locations.some(loc => loc.id === id),
    
    /**
     * Get a location by ID
     */
    getLocation: (id: string) => locations.find(loc => loc.id === id),
  }
}
