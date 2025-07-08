"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { StaffMember } from "@/lib/staff-storage"
import { User } from "@/lib/settings-storage"
import { UnifiedStaffService } from "@/lib/unified-staff-service"
import { useToast } from "@/components/ui/use-toast"

// Define the context type
interface UnifiedStaffContextType {
  // Staff operations
  staff: StaffMember[]
  getStaffById: (id: string) => StaffMember | undefined
  getStaffByLocation: (locationId: string) => StaffMember[]
  addStaffMember: (staff: Omit<StaffMember, "id">) => { staff: StaffMember, user: User }
  updateStaffMember: (staff: StaffMember) => { staff: StaffMember | null, user: User | null }
  deleteStaffMember: (staffId: string) => boolean
  
  // User operations
  users: User[]
  getUserById: (id: string) => User | undefined
  getUserByEmail: (email: string) => User | undefined
  updateUser: (user: User) => { user: User, staff: StaffMember | null }
  deleteUser: (userId: string) => boolean
  
  // Combined data
  staffWithUserData: Array<{ staff: StaffMember, user: User | null }>
  usersWithStaffData: Array<{ user: User, staff: StaffMember | null }>

  // Refresh data
  refreshData: () => void
  syncUserLocations: () => { updated: number, errors: number }
  isInitialized: boolean
}

// Create the context with default values
const UnifiedStaffContext = createContext<UnifiedStaffContextType>({
  staff: [],
  getStaffById: () => undefined,
  getStaffByLocation: () => [],
  addStaffMember: () => ({ 
    staff: { 
      id: "", name: "", email: "", phone: "", role: "", 
      locations: [], status: "", avatar: "", color: "", homeService: false 
    },
    user: { 
      id: "", name: "", email: "", role: "", 
      locations: [], status: "", avatar: "", color: "" 
    }
  }),
  updateStaffMember: () => ({ staff: null, user: null }),
  deleteStaffMember: () => false,
  
  users: [],
  getUserById: () => undefined,
  getUserByEmail: () => undefined,
  updateUser: () => ({ 
    user: { 
      id: "", name: "", email: "", role: "", 
      locations: [], status: "", avatar: "", color: "" 
    }, 
    staff: null 
  }),
  deleteUser: () => false,
  
  staffWithUserData: [],
  usersWithStaffData: [],

  refreshData: () => {},
  syncUserLocations: () => ({ updated: 0, errors: 0 }),
  isInitialized: false
})

// Provider component
export function UnifiedStaffProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [staffWithUserData, setStaffWithUserData] = useState<Array<{ staff: StaffMember, user: User | null }>>([])
  const [usersWithStaffData, setUsersWithStaffData] = useState<Array<{ user: User, staff: StaffMember | null }>>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize data with debouncing to prevent race conditions
  const refreshData = useCallback(() => {
    try {
      console.log('UnifiedStaffProvider.refreshData: Starting data refresh...')

      // Synchronize user locations with staff locations first
      const syncResult = UnifiedStaffService.syncUserLocationsFromStaff()
      if (syncResult.updated > 0) {
        console.log(`UnifiedStaffProvider.refreshData: Synchronized ${syncResult.updated} user location assignments`)
      }

      // Get staff and user data
      const staffData = UnifiedStaffService.getAllStaffWithUserData()
      const userData = UnifiedStaffService.getAllUsersWithStaffData()

      console.log('UnifiedStaffProvider.refreshData: Got staff data:', staffData.length, 'items')
      console.log('UnifiedStaffProvider.refreshData: Got user data:', userData.length, 'items')

      // Update state
      const newStaff = staffData.map(item => item.staff)
      const newUsers = userData.map(item => item.user)

      console.log('UnifiedStaffProvider.refreshData: Setting staff state with', newStaff.length, 'staff members')
      setStaff(newStaff)
      setUsers(newUsers)
      setStaffWithUserData(staffData)
      setUsersWithStaffData(userData)

      console.log('UnifiedStaffProvider.refreshData: Data refresh completed')
    } catch (error) {
      console.error("Error refreshing unified staff data:", error)
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (isInitialized) return

    try {
      // Initialize the service
      const result = UnifiedStaffService.initialize()
      
      // Show toast if any new records were created
      if (result.newUsersCreated > 0 || result.newStaffCreated > 0) {
        toast({
          title: "Data Synchronized",
          description: `Created ${result.newUsersCreated} new users and ${result.newStaffCreated} new staff records.`,
        })
      }
      
      // Refresh data
      refreshData()
      setIsInitialized(true)
    } catch (error) {
      console.error("Error initializing unified staff service:", error)
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to synchronize staff and user data.",
      })
    }
  }, [isInitialized, refreshData, toast])

  // Get staff by ID
  const getStaffById = useCallback((id: string) => {
    return staff.find(s => s.id === id)
  }, [staff])

  // Get staff by location
  const getStaffByLocation = useCallback((locationId: string) => {
    if (locationId === 'all') {
      return staff
    } else if (locationId === 'home') {
      return staff.filter(s => s.homeService === true || s.locations.includes('home'))
    } else {
      return staff.filter(s => s.locations.includes(locationId))
    }
  }, [staff])

  // Get user by ID
  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id)
  }, [users])

  // Get user by email
  const getUserByEmail = useCallback((email: string) => {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }, [users])

  // Add staff member
  const addStaffMember = useCallback((staffData: Omit<StaffMember, "id">) => {
    const result = UnifiedStaffService.addStaffMember(staffData)
    // Only refresh if the operation was successful
    if (result.staff) {
      refreshData()
    }
    return result
  }, [refreshData])

  // Update staff member
  const updateStaffMember = useCallback((staffData: StaffMember) => {
    const result = UnifiedStaffService.updateStaffMember(staffData)

    if (result.staff) {
      // Immediately update the local state to prevent stale data
      setStaff(prev => prev.map(s => s.id === staffData.id ? result.staff! : s))
      // Don't call refreshData here to prevent loops
    }

    return result
  }, [])

  // Delete staff member
  const deleteStaffMember = useCallback((staffId: string) => {
    const result = UnifiedStaffService.deleteStaffMember(staffId)
    // Only refresh if the operation was successful
    if (result) {
      refreshData()
    }
    return result
  }, [refreshData])

  // Update user
  const updateUser = useCallback((userData: User) => {
    const result = UnifiedStaffService.updateUser(userData)
    // Only refresh if the operation was successful
    if (result.user) {
      refreshData()
    }
    return result
  }, [refreshData])

  // Delete user
  const deleteUser = useCallback((userId: string) => {
    const result = UnifiedStaffService.deleteUser(userId)
    // Only refresh if the operation was successful
    if (result) {
      refreshData()
    }
    return result
  }, [refreshData])

  // Synchronize user locations with staff locations
  const syncUserLocations = useCallback(() => {
    const result = UnifiedStaffService.syncUserLocationsFromStaff()
    if (result.updated > 0) {
      refreshData()
    }
    return result
  }, [refreshData])

  return (
    <UnifiedStaffContext.Provider
      value={{
        staff,
        getStaffById,
        getStaffByLocation,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,

        users,
        getUserById,
        getUserByEmail,
        updateUser,
        deleteUser,

        staffWithUserData,
        usersWithStaffData,

        refreshData,
        syncUserLocations,
        isInitialized
      }}
    >
      {children}
    </UnifiedStaffContext.Provider>
  )
}

// Hook to use the unified staff context
export function useUnifiedStaff() {
  const context = useContext(UnifiedStaffContext)
  
  if (context === undefined) {
    throw new Error("useUnifiedStaff must be used within a UnifiedStaffProvider")
  }
  
  return context
}
