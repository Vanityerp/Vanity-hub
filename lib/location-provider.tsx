"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { SettingsStorage, Location } from "@/lib/settings-storage"
import { locationEventBus } from "@/lib/location-event-bus"
import { locationCache } from "@/lib/location-cache"
import { LocationMigration } from "@/lib/location-migration"

interface LocationContextType {
  locations: Location[]
  isLoading: boolean
  hasInitialized: boolean
  getLocationById: (id: string) => Location | undefined
  getLocationName: (id: string) => string
  getLocationIds: () => string[]
  getActiveLocations: () => Location[]
  refreshLocations: () => void
  isHomeServiceEnabled: boolean
  isHomeServiceLocation: (location: Location) => boolean
  addLocation: (location: Location) => void
  updateLocation: (location: Location) => void
  deleteLocation: (locationId: string) => void
  syncLocations: () => void
}

const LocationContext = createContext<LocationContextType>({
  locations: [],
  isLoading: false,
  hasInitialized: false,
  getLocationById: () => undefined,
  getLocationName: () => "Unknown Location",
  getLocationIds: () => [],
  getActiveLocations: () => [],
  refreshLocations: () => {},
  isHomeServiceEnabled: false,
  isHomeServiceLocation: () => false,
  addLocation: () => {},
  updateLocation: () => {},
  deleteLocation: () => {},
  syncLocations: () => {},
})

export function LocationProvider({ children }: { children: React.ReactNode }) {
  console.log("🚀 LocationProvider: Component initialized")
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHomeServiceEnabled, setIsHomeServiceEnabled] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  console.log("🚀 LocationProvider: Current locations state:", locations.length, "locations")

  // Load locations on mount
  useEffect(() => {
    console.log("🚀 LocationProvider: useEffect triggered - loading locations")
    console.log("🚀 LocationProvider: Current locations state in useEffect:", locations.length, "locations")

    // Define loadLocations inline to avoid dependency issues
    const loadLocationsInline = async () => {
      try {
        setIsLoading(true)
        console.log("🔄 LocationProvider: Loading locations from database...")

        // Fetch locations from database API
        const response = await fetch('/api/locations')
        if (!response.ok) {
          console.warn(`⚠️ LocationProvider: API request failed: ${response.statusText}`)
          throw new Error(`Failed to fetch locations: ${response.statusText}`)
        }

        const data = await response.json()
        const dbLocations = data.locations || []

        console.log(`✅ LocationProvider: Loaded ${dbLocations.length} locations from database`)
        console.log('✅ LocationProvider: Raw database locations:', dbLocations.map(loc => ({ id: loc.id, name: loc.name })))

        // Convert database locations to our Location interface format
        const formattedLocations: Location[] = dbLocations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address || '',
          city: loc.city || '',
          state: loc.state || '',
          zipCode: loc.zipCode || '',
          country: loc.country || '',
          phone: loc.phone || '',
          email: loc.email || '',
          status: loc.isActive ? 'Active' : 'Inactive',
          description: '',
          enableOnlineBooking: true,
          displayOnWebsite: true,
          staffCount: 0,
          servicesCount: 0,
        }))

        // Do not deduplicate by name; always use all locations from backend
        // Refresh the location cache to ensure it has the latest data
        await locationCache.refreshCache()

        // Get all locations from cache (includes both database and special locations)
        const allCachedLocations = locationCache.getAllLocations()
        setLocations(allCachedLocations)
        setIsHomeServiceEnabled(true)

        console.log("✅ LocationProvider: Locations loaded successfully")
        console.log("✅ LocationProvider: Set locations state with:", allCachedLocations.length, "locations")
        console.log("✅ LocationProvider: Location names:", allCachedLocations.map(loc => loc.name))
        console.log("✅ LocationProvider: Final locations:", allCachedLocations)
      } catch (error) {
        console.error("❌ LocationProvider: Error loading locations:", error)

        // Try to get locations from cache as fallback
        try {
          console.log("🔄 LocationProvider: Attempting to load from cache as fallback...")
          const cachedLocations = locationCache.getAllLocations()
          if (cachedLocations.length > 0) {
            console.log(`✅ LocationProvider: Loaded ${cachedLocations.length} locations from cache`)
            setLocations(cachedLocations)
            setIsHomeServiceEnabled(true)
          } else {
            console.warn("⚠️ LocationProvider: No cached locations available")
            setLocations([])
          }
        } catch (cacheError) {
          console.error("❌ LocationProvider: Cache fallback also failed:", cacheError)
          setLocations([])
        }
      } finally {
        setIsLoading(false)
        setHasInitialized(true)
      }
    }

    loadLocationsInline()

    // Subscribe to specific location events, excluding 'locations-refreshed'
    // to avoid infinite loops
    const unsubscribeAdded = locationEventBus.subscribe('location-added', () => {
      // Only reload locations when a location is added
      const cachedLocations = locationCache.getAllLocations();
      setLocations(cachedLocations);
      setIsHomeServiceEnabled(true);
    });

    const unsubscribeUpdated = locationEventBus.subscribe('location-updated', () => {
      // Only reload locations when a location is updated
      const cachedLocations = locationCache.getAllLocations();
      setLocations(cachedLocations);
    });

    const unsubscribeRemoved = locationEventBus.subscribe('location-removed', () => {
      // Only reload locations when a location is removed
      const cachedLocations = locationCache.getAllLocations();
      setLocations(cachedLocations);
    });

    const unsubscribeCurrentChanged = locationEventBus.subscribe('current-location-changed', () => {
      // No need to reload locations when current location changes
      // This is handled by the component that changes the current location
    });

    return () => {
      // Unsubscribe when component unmounts
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeRemoved();
      unsubscribeCurrentChanged();
    }
  }, []) // Empty dependency array since we're using inline function

  // Get location by ID (using current state)
  const getLocationById = useCallback((id: string): Location | undefined => {
    return locations.find(location => location.id === id)
  }, [locations])

  // Get location name by ID (using cache)
  const getLocationName = useCallback((id: string): string => {
    return locationCache.getLocationName(id)
  }, [])

  // Get all location IDs
  const getLocationIds = useCallback((): string[] => {
    return locations.map(location => location.id)
  }, [locations])

  // Get active locations
  const getActiveLocations = useCallback((): Location[] => {
    const activeLocations = locations.filter(location => location.status === 'Active')

    // Remove duplicates based on name (keep the first occurrence)
    // This handles cases where database has duplicate locations with different IDs but same names
    const uniqueActiveLocations = activeLocations.filter((location, index, array) =>
      array.findIndex(loc => loc.name.toLowerCase().trim() === location.name.toLowerCase().trim()) === index
    )

    // Debug: Log if duplicates were found
    if (activeLocations.length !== uniqueActiveLocations.length) {
      console.warn('⚠️ LocationProvider - Removed duplicate active locations by name:',
        activeLocations.length - uniqueActiveLocations.length)
      console.warn('⚠️ LocationProvider - Duplicate active locations found:',
        activeLocations.filter((location, index, array) =>
          array.findIndex(loc => loc.name.toLowerCase().trim() === location.name.toLowerCase().trim()) !== index
        ).map(loc => ({ id: loc.id, name: loc.name }))
      )
    }

    return uniqueActiveLocations
  }, [locations])

  // Refresh locations from database
  const refreshLocations = useCallback(async () => {
    console.log("🔄 LocationProvider: Refreshing locations from database...")
    // Re-fetch locations from API
    try {
      const response = await fetch('/api/locations')
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.statusText}`)
      }
      const data = await response.json()
      const dbLocations = data.locations || []

      const formattedLocations: Location[] = dbLocations.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address || '',
        city: loc.city || '',
        state: loc.state || '',
        zipCode: loc.zipCode || '',
        country: loc.country || '',
        phone: loc.phone || '',
        email: loc.email || '',
        status: loc.isActive ? 'Active' : 'Inactive',
        description: '',
        enableOnlineBooking: true,
        displayOnWebsite: true,
        staffCount: 0,
        servicesCount: 0,
      }))

      setLocations(formattedLocations)
      console.log("✅ LocationProvider: Locations refreshed successfully")
    } catch (error) {
      console.error("❌ LocationProvider: Error refreshing locations:", error)
    }
  }, [])

  // Add a new location
  const addLocation = useCallback(async (location: Location) => {
    // Validate location name and prevent reserved names
    if (!location.name || location.name.trim() === "") {
      console.warn("Cannot add a location without a name")
      return
    }

    console.log("🔄 LocationProvider: Adding location to database:", location.name);

    try {
      // Add location to database via API
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          country: location.country,
          phone: location.phone,
          email: location.email,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add location: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ LocationProvider: Location added to database:", result.location.name)

      // Reload locations from database
      await refreshLocations()

      // Publish location-added event
      locationEventBus.publish({
        type: 'location-added',
        payload: location
      })

      console.log("✅ LocationProvider: Location added successfully:", location.name);
    } catch (error) {
      console.error("❌ LocationProvider: Error adding location:", error)
    }
  }, [refreshLocations])

  // Update an existing location
  const updateLocation = useCallback(async (location: Location) => {
    // Validate location name and prevent reserved names
    if (!location.name || location.name.trim() === "") {
      console.warn("Cannot update a location without a name")
      return
    }

    console.log("🔄 LocationProvider: Updating location in database:", location.name, location.id);

    try {
      // Update location in database via API
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          country: location.country,
          phone: location.phone,
          email: location.email,
          isActive: location.status === 'Active',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update location: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("✅ LocationProvider: Location updated in database:", result.location.name)

      // Reload locations from database
      await refreshLocations()

      // Publish location-updated event
      locationEventBus.publish({
        type: 'location-updated',
        payload: location
      })

      console.log("✅ LocationProvider: Location updated successfully:", location.name);
    } catch (error) {
      console.error("❌ LocationProvider: Error updating location:", error)
    }
  }, [refreshLocations])

  // Delete a location
  const deleteLocation = useCallback(async (locationId: string) => {
    console.log("🔄 LocationProvider: Deleting location from database:", locationId);

    try {
      // Delete location from database via API
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete location: ${response.statusText}`)
      }

      console.log("✅ LocationProvider: Location deleted from database:", locationId)

      // Reload locations from database
      await refreshLocations()

      // Publish location-removed event
      locationEventBus.publish({
        type: 'location-removed',
        payload: locationId
      })

      console.log("✅ LocationProvider: Location deleted successfully:", locationId);
    } catch (error) {
      console.error("❌ LocationProvider: Error deleting location:", error)
    }
  }, [refreshLocations])

  // Synchronize locations across the application
  const syncLocations = useCallback(() => {
    // Refresh the cache
    locationCache.refreshCache()

    // Get locations from cache directly instead of using loadLocations
    // to avoid potential event publishing loops
    const cachedLocations = locationCache.getAllLocations()

    // Update state only if the locations have actually changed
    setLocations(prevLocations => {
      if (JSON.stringify(cachedLocations) !== JSON.stringify(prevLocations)) {
        return cachedLocations
      }
      return prevLocations
    })

    // Only update if needed
    setIsHomeServiceEnabled(prev => prev ? prev : true)
  }, []) // Remove dependencies to prevent excessive calls

  // Helper function to check if a location is a Home Service location
  const isHomeServiceLocation = useCallback((location: Location): boolean => {
    return location.id === "home" ||
           location.name.toLowerCase().includes("home service") ||
           location.name.toLowerCase().includes("home")
  }, [])

  return (
    <LocationContext.Provider
      value={{
        locations,
        isLoading,
        hasInitialized,
        getLocationById,
        getLocationName,
        getLocationIds,
        getActiveLocations,
        refreshLocations,
        isHomeServiceEnabled,
        isHomeServiceLocation,
        addLocation,
        updateLocation,
        deleteLocation,
        syncLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocations = () => useContext(LocationContext)
