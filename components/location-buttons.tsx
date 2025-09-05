"use client"

import React from "react"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useLocationFilter } from "@/hooks/use-location-filter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LocationButtonsProps {
  className?: string
  onLocationChange?: (locationId: string) => void
}

export function LocationButtons({ className, onLocationChange }: LocationButtonsProps) {
  const { currentLocation, setCurrentLocation, user } = useAuth()
  const { getLocationById, getActiveLocations, isHomeServiceEnabled } = useLocations()
  const { filterLocations } = useLocationFilter()

  // Handle location button click
  const handleLocationClick = (locationId: string) => {
    console.log(`🔘 Location button clicked: ${locationId}`)
    console.log(`🔘 Current location before change: ${currentLocation}`)

    // Update global location state
    setCurrentLocation(locationId)

    // Call optional callback
    if (onLocationChange) {
      onLocationChange(locationId)
    }

    console.log(`🔘 Global location state updated to: ${locationId}`)

    // Add a small delay to check if the location persists
    setTimeout(() => {
      console.log(`🔘 Location after 100ms: ${currentLocation}`)
    }, 100)
  }

  // Get all active locations and apply user-based filtering
  const allActiveLocations = getActiveLocations()
  const userFilteredLocations = filterLocations(allActiveLocations)



  // Define the desired order for locations
  const locationOrder = [
    "muaither",
    "medinat khalifa",
    "d-ring road",
    "home",
    "online"
  ]

  // Separate regular locations from special locations (using filtered locations)
  const regularLocations = userFilteredLocations.filter(loc =>
    loc.id !== "home" && loc.id !== "online"
  );
  const onlineLocation = userFilteredLocations.find(loc => loc.id === "online");
  const homeLocation = userFilteredLocations.find(loc => loc.id === "home");

  // Sort regular locations according to the desired order
  const sortedRegularLocations = regularLocations.sort((a, b) => {
    const aIndex = locationOrder.findIndex(name =>
      a.name.toLowerCase().includes(name) || name.includes(a.name.toLowerCase())
    );
    const bIndex = locationOrder.findIndex(name =>
      b.name.toLowerCase().includes(name) || name.includes(b.name.toLowerCase())
    );

    // If both locations are in the order array, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in the order array, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in the order array, maintain alphabetical order
    return a.name.localeCompare(b.name);
  });

  // Define the location buttons in the specified order
  const locationButtons = [
    { id: "all", label: "All" },
    // Add regular locations in the custom order
    ...sortedRegularLocations.map(location => ({
      id: location.id,
      label: location.name
    })),
    // Add Home Service option if enabled - only for admin users
    ...(isHomeServiceEnabled && homeLocation && user?.role === "ADMIN" ? [{ id: "home", label: "Home service" }] : []),
    // Add Online Store option after Home service
    ...(onlineLocation ? [{ id: "online", label: "Online store" }] : [])
  ]

  // Remove duplicates based on label/name (keep the first occurrence)
  // This handles cases where database has duplicate locations with different IDs but same names
  const uniqueLocationButtons = locationButtons.filter((button, index, array) =>
    array.findIndex(b => b.label.toLowerCase().trim() === button.label.toLowerCase().trim()) === index
  )

  // Check if any duplicates were removed and log warning if needed
  if (locationButtons.length !== uniqueLocationButtons.length) {
    console.warn('⚠️ LocationButtons - Removed duplicate location buttons by name:',
      locationButtons.length - uniqueLocationButtons.length)
    console.warn('⚠️ LocationButtons - Duplicate buttons found:',
      locationButtons.filter((button, index, array) =>
        array.findIndex(b => b.label.toLowerCase().trim() === button.label.toLowerCase().trim()) !== index
      ).map(btn => ({ id: btn.id, label: btn.label }))
    )
  }







  return (
    <div className={cn("flex flex-wrap", className)}>
      {uniqueLocationButtons.map((location, index) => {
        const isFirst = index === 0
        const isLast = index === uniqueLocationButtons.length - 1
        const isSelected = currentLocation === location.id

        return (
          <Button
            key={location.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "border-r-0 last:border-r",
              {
                "rounded-l-md rounded-r-none": isFirst,
                "rounded-none": !isFirst && !isLast,
                "rounded-r-md rounded-l-none": isLast,
                "bg-black text-white hover:bg-gray-800": isSelected,
              }
            )}
            onClick={() => handleLocationClick(location.id)}
          >
            {location.label}
          </Button>
        )
      })}
    </div>
  )
}
