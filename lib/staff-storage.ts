/**
 * DEPRECATED: This file is deprecated and should not be used.
 * All staff data is now managed through the database using Prisma.
 * Use the /api/staff endpoints instead.
 */

import { v4 as uuidv4 } from 'uuid'
// Mock staff data removed - using real staff data from FileStaffStorage instead

// Storage keys
const STORAGE_KEYS = {
  STAFF: 'vanity_staff',
}

// Staff member type
export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  locations: string[]
  status: string
  avatar: string
  color: string
  homeService: boolean
  // Services/specialties
  specialties?: string[]
  // New fields for enhanced HR management
  employeeNumber?: string
  dateOfBirth?: string // Date of birth in YYYY-MM-DD format
  qidNumber?: string // Qatar ID number
  passportNumber?: string // Passport number
  qidValidity?: string // Qatar ID expiration date in MM-DD-YY format
  passportValidity?: string // Passport expiration date in MM-DD-YY format
  medicalValidity?: string // Medical certificate expiration date in MM-DD-YY format
  // Profile picture support
  profileImage?: string // Base64 encoded image or URL
  profileImageType?: string // MIME type of the image
}

// Document validity status type
export type DocumentValidityStatus = 'valid' | 'expiring' | 'expired'

// Helper function to generate employee number
export function generateEmployeeNumber(existingStaff: StaffMember[]): string {
  const existingNumbers = existingStaff
    .map(staff => staff.employeeNumber)
    .filter(num => num && /^\d{4,}$/.test(num)) // Match 4+ digit numbers
    .map(num => parseInt(num!))
    .filter(num => !isNaN(num) && num >= 9100) // Only consider numbers >= 9100

  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 9100
  return nextNumber.toString()
}

// Helper function to validate employee number uniqueness
export function validateEmployeeNumberUniqueness(
  employeeNumber: string,
  existingStaff: StaffMember[],
  excludeId?: string
): { isValid: boolean; error?: string } {
  if (!employeeNumber) {
    return { isValid: true } // Empty is valid (will be auto-generated)
  }

  // Check format - must be 4+ digit number starting from 9100
  if (!/^\d{4,}$/.test(employeeNumber)) {
    return {
      isValid: false,
      error: "Employee number must be a 4+ digit number (e.g., 9100)"
    }
  }

  const numValue = parseInt(employeeNumber)
  if (numValue < 9100) {
    return {
      isValid: false,
      error: "Employee number must be 9100 or higher"
    }
  }

  // Check uniqueness
  const isDuplicate = existingStaff.some(staff =>
    staff.employeeNumber === employeeNumber && staff.id !== excludeId
  )

  if (isDuplicate) {
    return {
      isValid: false,
      error: "This employee number is already in use"
    }
  }

  return { isValid: true }
}

// Helper function to validate and process image upload
export function validateAndProcessImage(file: File): Promise<{
  isValid: boolean;
  error?: string;
  imageData?: string;
  imageType?: string
}> {
  return new Promise((resolve) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: "Please upload a valid image file (JPEG, PNG, or WebP)"
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      resolve({
        isValid: false,
        error: "Image size must be less than 5MB"
      })
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      resolve({
        isValid: true,
        imageData: result,
        imageType: file.type
      })
    }
    reader.onerror = () => {
      resolve({
        isValid: false,
        error: "Failed to process image file"
      })
    }
    reader.readAsDataURL(file)
  })
}

// Helper function to check document validity status
export function getDocumentValidityStatus(validityDate: string | undefined): DocumentValidityStatus {
  if (!validityDate) return 'expired'

  try {
    // Parse DD-MM-YY format (day-month-year)
    const [day, month, year] = validityDate.split('-').map(Number)
    const fullYear = year < 50 ? 2000 + year : 1900 + year // Assume years 00-49 are 2000s, 50-99 are 1900s
    const expiryDate = new Date(fullYear, month - 1, day)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

    if (expiryDate < today) {
      return 'expired'
    } else if (expiryDate <= thirtyDaysFromNow) {
      return 'expiring'
    } else {
      return 'valid'
    }
  } catch (error) {
    return 'expired'
  }
}

// Helper function to get validity status color
export function getValidityStatusColor(status: DocumentValidityStatus): string {
  switch (status) {
    case 'valid':
      return 'bg-green-100 text-green-800'
    case 'expiring':
      return 'bg-yellow-100 text-yellow-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// DEPRECATED: localStorage functions removed
// All staff data is now persisted in the database through Prisma

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : defaultValue
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Staff Storage Service
export const StaffStorage = {
  // Get all staff members
  getStaff: (): StaffMember[] => {
    console.log('StaffStorage.getStaff: Loading staff from localStorage...')
    const staff = getFromStorage<StaffMember[]>(STORAGE_KEYS.STAFF, [])
    console.log('StaffStorage.getStaff: Loaded', staff.length, 'staff members')

    // Migrate existing staff to add employee numbers if missing
    const migratedStaff = StaffStorage.migrateStaffData(staff)
    if (migratedStaff.length !== staff.length || migratedStaff.some((s, i) => s.employeeNumber !== staff[i]?.employeeNumber)) {
      console.log('StaffStorage.getStaff: Migrating staff data with employee numbers...')
      saveToStorage(STORAGE_KEYS.STAFF, migratedStaff)
      return migratedStaff
    }

    return staff
  },

  // Migrate staff data to ensure all staff have employee numbers
  migrateStaffData: (staff: StaffMember[]): StaffMember[] => {
    return staff.map((member, index) => {
      if (!member.employeeNumber) {
        return {
          ...member,
          employeeNumber: generateEmployeeNumber(staff.slice(0, index))
        }
      }
      return member
    })
  },

  // Save all staff members
  saveStaff: (staff: StaffMember[]) => saveToStorage(STORAGE_KEYS.STAFF, staff),

  // Add a new staff member
  addStaff: (staff: Omit<StaffMember, 'id'>): StaffMember => {
    const staffList = StaffStorage.getStaff()
    const newStaff = {
      id: `staff-${Date.now()}`,
      ...staff,
      // Auto-generate employee number if not provided
      employeeNumber: staff.employeeNumber || generateEmployeeNumber(staffList)
    }
    staffList.push(newStaff)
    saveToStorage(STORAGE_KEYS.STAFF, staffList)
    return newStaff
  },

  // Update an existing staff member
  updateStaff: (updatedStaff: StaffMember): StaffMember | null => {
    if (!updatedStaff || !updatedStaff.id) {
      console.error('Cannot update staff: Invalid staff data')
      return null
    }

    console.log('StaffStorage.updateStaff: Updating staff:', updatedStaff.name, 'with ID:', updatedStaff.id)

    const staffList = StaffStorage.getStaff()
    console.log('StaffStorage.updateStaff: Current staff list length:', staffList.length)

    const index = staffList.findIndex(staff => staff.id === updatedStaff.id)
    console.log('StaffStorage.updateStaff: Found staff at index:', index)

    if (index !== -1) {
      const oldStaff = staffList[index]
      console.log('StaffStorage.updateStaff: Old staff data:', oldStaff.name, oldStaff.email)
      console.log('StaffStorage.updateStaff: New staff data:', updatedStaff.name, updatedStaff.email)

      staffList[index] = updatedStaff
      saveToStorage(STORAGE_KEYS.STAFF, staffList)

      console.log('StaffStorage.updateStaff: Successfully updated and saved to localStorage')

      // Verify the save worked
      const verifyStaff = StaffStorage.getStaff()
      const verifyIndex = verifyStaff.findIndex(staff => staff.id === updatedStaff.id)
      if (verifyIndex !== -1) {
        console.log('StaffStorage.updateStaff: Verification - staff in localStorage:', verifyStaff[verifyIndex].name, verifyStaff[verifyIndex].email)
      }

      return updatedStaff
    }

    console.error(`Cannot update staff: Staff with ID ${updatedStaff.id} not found`)
    return null
  },

  // Delete a staff member
  deleteStaff: (staffId: string): boolean => {
    const staffList = StaffStorage.getStaff()
    const filteredStaff = staffList.filter(staff => staff.id !== staffId)
    
    if (filteredStaff.length < staffList.length) {
      saveToStorage(STORAGE_KEYS.STAFF, filteredStaff)
      return true
    }
    
    console.error(`Cannot delete staff: Staff with ID ${staffId} not found`)
    return false
  },

  // Get a staff member by ID
  getStaffById: (staffId: string): StaffMember | undefined => {
    const staffList = StaffStorage.getStaff()
    return staffList.find(staff => staff.id === staffId)
  },
}
