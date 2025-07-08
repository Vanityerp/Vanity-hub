"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { StaffDataService, StaffMember } from "@/lib/staff-data-service"
import { dataCache } from "@/lib/data-cache"
import { revalidateCacheTags } from "@/lib/cache-actions"
import { useSession } from "next-auth/react"
import { useLocations } from "@/lib/location-provider"

// Define the staff context type
interface StaffContextType {
  staff: StaffMember[]
  filteredStaff: StaffMember[] // Staff filtered by user access
  activeStaff: StaffMember[] // Only active staff (excludes inactive and on-leave)
  getStaffById: (id: string) => StaffMember | undefined
  getStaffByLocation: (locationId: string) => StaffMember[]
  getActiveStaffByLocation: (locationId: string) => StaffMember[] // Only active staff
  getStaffWithHomeService: () => StaffMember[]
  getActiveStaffWithHomeService: () => StaffMember[] // Only active staff with home service
  refreshStaff: () => void
  addStaff: (staff: Omit<StaffMember, "id">) => StaffMember
  updateStaff: (staff: StaffMember) => StaffMember | null
  deleteStaff: (staffId: string) => boolean
  isStaffActive: (staffId: string) => boolean
}

// Create the context with default values
const StaffContext = createContext<StaffContextType>({
  staff: [],
  filteredStaff: [],
  activeStaff: [],
  getStaffById: () => undefined,
  getStaffByLocation: () => [],
  getActiveStaffByLocation: () => [],
  getStaffWithHomeService: () => [],
  getActiveStaffWithHomeService: () => [],
  refreshStaff: () => {},
  addStaff: () => ({ id: "", name: "", email: "", phone: "", role: "", locations: [], status: "Active", avatar: "", color: "", homeService: false }),
  updateStaff: () => null,
  deleteStaff: () => false,
  isStaffActive: () => false,
})

// Define cache tags for staff data
export const STAFF_CACHE_TAGS = {
  ALL: 'staff:all',
  DIRECTORY: 'staff:directory',
  SCHEDULE: 'staff:schedule',
  CALENDAR: 'staff:calendar',
}

// Create the provider component
export function StaffProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { locations } = useLocations()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Debug logging for staff state changes
  useEffect(() => {
    console.log("StaffProvider: Staff state changed - count:", staff.length);
    if (staff.length > 0) {
      console.log("StaffProvider: First 3 staff members:", staff.slice(0, 3).map(s => ({ id: s.id.substring(0, 8), name: s.name })));
    }
  }, [staff])

  // Load initial data from API (real database staff)
  useEffect(() => {
    if (isInitialized) return

    const loadStaffFromAPI = async () => {
      try {
        console.log("StaffProvider: Loading staff data from API...")

        // Fetch staff from the API (real database data)
        console.log("StaffProvider: Loading staff data from API...");
        const response = await fetch('/api/staff', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache' // Ensure we get fresh data
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch staff: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const staffData = data.staff || []

        console.log("StaffProvider: Loaded", staffData.length, "staff members from API")

        // Validate staff data structure
        const validStaff = staffData.filter(s => s && s.id && s.name)
        if (validStaff.length !== staffData.length) {
          console.warn("StaffProvider: Some staff records are invalid, filtered from", staffData.length, "to", validStaff.length)
        }

        // Set the staff data
        setStaff(Array.isArray(validStaff) ? validStaff : [])

        if (validStaff.length === 0) {
          console.error("StaffProvider: No valid staff data received from API!")
        } else {
          console.log("✅ StaffProvider: Successfully loaded", validStaff.length, "staff members");
        }
      } catch (error) {
        console.error("StaffProvider: Error loading staff from API:", error)

        // Fallback to localStorage if API fails
        try {
          console.log("StaffProvider: Attempting localStorage fallback...")
          const rawData = localStorage.getItem("vanity_staff")
          if (rawData) {
            const fallbackData = JSON.parse(rawData)
            console.log("StaffProvider: Using localStorage fallback:", fallbackData.length, "staff members")
            setStaff(Array.isArray(fallbackData) ? fallbackData : [])
          } else {
            console.log("StaffProvider: No localStorage data available")
            setStaff([])
          }
        } catch (fallbackError) {
          console.error("StaffProvider: Fallback also failed:", fallbackError)
          setStaff([])
        }
      }

      setIsInitialized(true)
    }

    loadStaffFromAPI()
  }, [isInitialized])

  // Refresh staff data from API
  const refreshStaff = useCallback(async () => {
    try {
      console.log("StaffProvider: Refreshing staff data from API...")

      // Fetch fresh data from API
      const response = await fetch('/api/staff', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache' // Ensure we get fresh data
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch staff: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const freshStaff = data.staff || []

      // Validate staff data structure
      const validStaff = freshStaff.filter(s => s && s.id && s.name)
      if (validStaff.length !== freshStaff.length) {
        console.warn("StaffProvider: Some staff records are invalid during refresh, filtered from", freshStaff.length, "to", validStaff.length)
      }

      // Update state
      setStaff(validStaff)

      console.log("StaffProvider: Staff data refreshed:", validStaff.length, "staff members")

      if (validStaff.length === 0) {
        console.error("StaffProvider: No valid staff data received during refresh!")
      }
    } catch (error) {
      console.error("StaffProvider: Error refreshing staff from API:", error)
      // No fallback during refresh - keep existing data
    }
  }, [])

  // Set up event listener for staff updates (only once)
  useEffect(() => {
    // Function to handle staff update events
    const handleStaffUpdated = () => {
      console.log("Staff updated event received, refreshing staff data");
      refreshStaff();
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('staff-updated', handleStaffUpdated);
    }

    // Clean up event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('staff-updated', handleStaffUpdated);
      }
    };
  }, []); // Remove refreshStaff dependency to prevent re-adding listeners

  // Save staff to localStorage with debounce (disabled to prevent infinite loops)
  useEffect(() => {
    if (!isInitialized || staff.length === 0) return

    const saveTimeout = setTimeout(() => {
      // Save to localStorage
      StaffDataService.saveStaff(staff)

      // Update the cache
      dataCache.saveToLocalStorage("vanity_staff", staff)

      // Don't dispatch staff-updated event to prevent infinite loops
      // if (typeof window !== 'undefined') {
      //   // Client-side event for components to refresh
      //   window.dispatchEvent(new CustomEvent('staff-updated'))
      // }
    }, 300) // 300ms debounce

    return () => clearTimeout(saveTimeout)
  }, [staff, isInitialized])



  // Helper function to check if staff is active
  const isStaffActive = useCallback((staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return false;

    // Staff is active if status is "Active" or "ACTIVE" (case insensitive)
    const status = staffMember.status?.toLowerCase();
    return status === "active";
  }, [staff]);

  // Get only active staff (excludes inactive and on-leave staff)
  const activeStaff = React.useMemo(() => {
    const active = staff.filter(staffMember => {
      const status = staffMember.status?.toLowerCase();
      return status === "active";
    });

    console.log(`✅ StaffProvider: Active staff filter: ${active.length}/${staff.length} staff are active`);
    return active;
  }, [staff]);

  // Get filtered staff based on user access
  const filteredStaff = React.useMemo(() => {
    if (!session?.user || session.user.role === "ADMIN") {
      return staff; // Admin sees all staff
    }

    const userLocations = session.user.locations || [];

    // If user has "all" access, return all staff
    if (userLocations.includes("all")) {
      return staff;
    }

    // Filter staff to only those at user's accessible locations
    const filtered = staff.filter(staffMember =>
      staffMember.locations.some(loc => userLocations.includes(loc))
    );

    console.log(`🔒 StaffProvider: Filtered staff by user access: ${filtered.length}/${staff.length} staff visible`);
    return filtered;
  }, [staff, session]);

  // Get a staff member by ID
  const getStaffById = useCallback((id: string) => {
    return staff.find(s => s.id === id)
  }, [staff])

  // Get staff members by location with user access filtering
  const getStaffByLocation = useCallback((locationId: string) => {
    console.log(`🔍 StaffProvider.getStaffByLocation called with locationId: "${locationId}"`);
    console.log(`🔍 Total staff available: ${staff.length}`);

    let filteredStaff: StaffMember[] = [];

    // Find home service location ID for later use
    const homeServiceLocation = locations.find(loc => loc.name === "Home service");
    const homeServiceLocationId = homeServiceLocation?.id;

    // First filter by location
    if (locationId === "all") {
      filteredStaff = staff;
      console.log(`🔍 Location "all" - returning all ${filteredStaff.length} staff members`);
    } else if (locationId === "home") {
      // For home service, only admin users can see home service staff
      if (session?.user?.role === "ADMIN") {
        filteredStaff = staff.filter(s =>
          s.homeService === true ||
          s.locations.includes("home") ||
          (homeServiceLocationId && s.locations.includes(homeServiceLocationId))
        );
        console.log(`🔍 Location "home" - found ${filteredStaff.length} staff with home service (admin access)`);
      } else {
        // Staff users cannot access home service staff
        filteredStaff = [];
        console.log(`🔍 Location "home" - access denied for non-admin user`);
      }
    } else {
      filteredStaff = staff.filter(s => s.locations.includes(locationId));
      console.log(`🔍 Location "${locationId}" - found ${filteredStaff.length} staff assigned to this location`);
    }

    // Apply user access filtering
    if (session?.user && session.user.role !== "ADMIN") {
      const userLocations = session.user.locations || [];

      // If user doesn't have "all" access and has specific locations, filter staff
      if (!userLocations.includes("all") && userLocations.length > 0) {
        const beforeCount = filteredStaff.length;

        // For home service location, only admin users can access
        if (locationId === "home") {
          if (session?.user?.role === "ADMIN") {
            filteredStaff = filteredStaff.filter(staffMember => {
              // Staff must have homeService flag OR be assigned to home service location
              const hasHomeServiceCapability = staffMember.homeService === true ||
                staffMember.locations.includes("home") ||
                (homeServiceLocationId && staffMember.locations.includes(homeServiceLocationId));

              // Staff must also be assigned to at least one of the user's locations
              const isAssignedToUserLocation = staffMember.locations.some(loc => userLocations.includes(loc));

              return hasHomeServiceCapability && isAssignedToUserLocation;
            });
          } else {
            // Staff users cannot access home service staff
            filteredStaff = [];
          }
        } else {
          filteredStaff = filteredStaff.filter(staffMember =>
            staffMember.locations.some(loc => userLocations.includes(loc))
          );
        }

        if (beforeCount !== filteredStaff.length) {
          console.log(`🔒 Applied user location filter: ${filteredStaff.length}/${beforeCount} staff visible to user`);
        }
      }
    }

    return filteredStaff;
  }, [staff, session, locations])

  // Get staff members with home service (only for admin users)
  const getStaffWithHomeService = useCallback(() => {
    if (session?.user?.role === "ADMIN") {
      return staff.filter(s => s.homeService === true || s.locations.includes("home"))
    }
    // Staff users cannot access home service staff
    return []
  }, [staff, session])

  // Get ACTIVE staff members by location (excludes inactive and on-leave staff)
  const getActiveStaffByLocation = useCallback((locationId: string) => {
    console.log(`🔍 StaffProvider.getActiveStaffByLocation called with locationId: "${locationId}"`);

    // First get staff by location using existing logic
    const locationStaff = getStaffByLocation(locationId);

    // Then filter to only active staff
    const activeLocationStaff = locationStaff.filter(staffMember => {
      const status = staffMember.status?.toLowerCase();
      return status === "active";
    });

    console.log(`✅ Active staff for location "${locationId}": ${activeLocationStaff.length}/${locationStaff.length} staff are active`);
    return activeLocationStaff;
  }, [getStaffByLocation]);

  // Get ACTIVE staff members with home service (only for admin users)
  const getActiveStaffWithHomeService = useCallback(() => {
    if (session?.user?.role === "ADMIN") {
      const homeServiceStaff = staff.filter(s => s.homeService === true || s.locations.includes("home"));
      const activeHomeServiceStaff = homeServiceStaff.filter(staffMember => {
        const status = staffMember.status?.toLowerCase();
        return status === "active";
      });

      console.log(`✅ Active home service staff: ${activeHomeServiceStaff.length}/${homeServiceStaff.length} staff are active`);
      return activeHomeServiceStaff;
    }
    // Staff users cannot access home service staff
    return []
  }, [staff, session])

  // Add a new staff member
  const addStaff = useCallback((newStaffData: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
    const newStaff = StaffDataService.addStaff(newStaffData)
    setStaff(prev => [...prev, newStaff])
    return newStaff
  }, [])

  // Update a staff member
  const updateStaff = useCallback((updatedStaff: StaffMember) => {
    const result = StaffDataService.updateStaff(updatedStaff.id, updatedStaff)

    if (result) {
      setStaff(prev =>
        prev.map(s => s.id === updatedStaff.id ? result : s)
      )
    }

    return result
  }, [])

  // Delete a staff member
  const deleteStaff = useCallback((staffId: string) => {
    const result = StaffDataService.deleteStaff(staffId)

    if (result) {
      setStaff(prev => prev.filter(s => s.id !== staffId))
    }

    return result
  }, [])

  return (
    <StaffContext.Provider
      value={{
        staff,
        filteredStaff,
        activeStaff,
        getStaffById,
        getStaffByLocation,
        getActiveStaffByLocation,
        getStaffWithHomeService,
        getActiveStaffWithHomeService,
        refreshStaff,
        addStaff,
        updateStaff,
        deleteStaff,
        isStaffActive,
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

// Custom hook to use the staff context
export const useStaff = () => useContext(StaffContext)
