"use client"

import React, { useEffect } from "react"
import { useLocationSync } from "@/lib/use-location-sync"
import { useAuth } from "@/lib/auth-provider"

/**
 * Higher-order component that makes a component location-aware
 * This means the component will automatically update when locations change
 */
export function withLocationAwareness<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    includeHomeService?: boolean
    activeOnly?: boolean
  } = {}
) {
  const { includeHomeService = true, activeOnly = true } = options

  // Return a new component that wraps the original component
  return function LocationAwareComponent(props: P) {
    const { user } = useAuth()

    // Determine if home service should be included based on user role
    const shouldIncludeHomeService = includeHomeService && user?.role === "ADMIN"

    // Use the location sync hook to get locations
    const { locations, syncLocations } = useLocationSync({
      includeHomeService: shouldIncludeHomeService,
      activeOnly,
      onChange: (updatedLocations) => {
        console.log("Locations updated in LocationAwareComponent:", updatedLocations.map(loc => loc.name))
      }
    })
    
    // Force synchronization on mount
    useEffect(() => {
      syncLocations()
    }, [syncLocations])
    
    // Pass the locations to the wrapped component
    return <Component {...props} locations={locations} />
  }
}

/**
 * Hook to use in components that need to react to location changes
 */
export function useLocationAwareness(options: {
  includeHomeService?: boolean
  activeOnly?: boolean
  onChange?: (locations: any[]) => void
} = {}) {
  const { includeHomeService = true, activeOnly = true, onChange } = options
  const { user } = useAuth()

  // Determine if home service should be included based on user role
  const shouldIncludeHomeService = includeHomeService && user?.role === "ADMIN"

  // Use the location sync hook
  const locationSync = useLocationSync({
    includeHomeService: shouldIncludeHomeService,
    activeOnly,
    onChange
  })
  
  // Force synchronization on mount
  useEffect(() => {
    locationSync.syncLocations()
  }, [locationSync])
  
  return locationSync
}
