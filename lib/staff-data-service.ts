// DEPRECATED: This service is no longer used
// All staff data is now persisted in the database through Prisma
// Use API endpoints to fetch real staff data

"use client"

// Staff interface
export interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  phone: string
  locations: string[]
  status: "Active" | "Inactive"
  avatar?: string
  profileImage?: string
  color?: string
  homeService?: boolean
  dateOfBirth?: string // Date of birth in YYYY-MM-DD format
  specialties?: string[]
  yearsExperience?: number
  rating?: number
  bio?: string
  isFeatured?: boolean
  certifications?: string[]
  languages?: string[]
  createdAt?: string
  updatedAt?: string
}

// Default staff data - REMOVED: Using real data from FileStaffStorage instead
const defaultStaff: StaffMember[] = [
]

// DEPRECATED: All localStorage functions removed
// All staff data is now persisted in the database through Prisma

// Staff Data Service
export const StaffDataService = {
  // DEPRECATED: Use API endpoints instead
  initializeStaff: (): StaffMember[] => {
    console.warn("StaffDataService.initializeStaff is deprecated. Staff are now seeded in database.")
    return []
  },

  // DEPRECATED: Use API endpoints instead
  getStaff: (): StaffMember[] => {
    console.warn("StaffDataService.getStaff is deprecated. Use GET /api/staff instead.")
    return []
  },

  // Get staff member by ID
  getStaffById: (id: string): StaffMember | undefined => {
    const staff = StaffDataService.getStaff()
    return staff.find(member => member.id === id)
  },

  // Get staff by location
  getStaffByLocation: (locationId: string): StaffMember[] => {
    const staff = StaffDataService.getStaff()
    return staff.filter(member => 
      member.locations.includes(locationId) && member.status === "Active"
    )
  },

  // Get staff by role
  getStaffByRole: (role: string): StaffMember[] => {
    const staff = StaffDataService.getStaff()
    return staff.filter(member => 
      member.role === role && member.status === "Active"
    )
  },

  // DEPRECATED: Use API endpoints instead
  saveStaff: (staff: StaffMember[]) => {
    console.warn("StaffDataService.saveStaff is deprecated. Use POST/PUT /api/staff instead.")
  },

  // DEPRECATED: Use API endpoints instead
  addStaff: (staffMember: Omit<StaffMember, "id" | "createdAt" | "updatedAt">): StaffMember => {
    console.warn("StaffDataService.addStaff is deprecated. Use POST /api/staff instead.")
    return {
      ...staffMember,
      id: 'deprecated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  // DEPRECATED: Use API endpoints instead
  updateStaff: (id: string, updates: Partial<StaffMember>): StaffMember | null => {
    console.warn("StaffDataService.updateStaff is deprecated. Use PUT /api/staff/[id] instead.")
    return null
  },

  // DEPRECATED: Use API endpoints instead
  deleteStaff: (id: string): boolean => {
    console.warn("StaffDataService.deleteStaff is deprecated. Use DELETE /api/staff/[id] instead.")
    return false
  },

  // Get active staff count
  getActiveStaffCount: (): number => {
    const staff = StaffDataService.getStaff()
    return staff.filter(member => member.status === "Active").length
  },

  // Get staff roles
  getStaffRoles: (): string[] => {
    const staff = StaffDataService.getStaff()
    const roles = [...new Set(staff.map(member => member.role))]
    return roles.sort()
  }
}
