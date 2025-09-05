"use client"

import { StaffMember, StaffStorage } from './staff-storage'
import { User, SettingsStorage } from './settings-storage'
import { v4 as uuidv4 } from 'uuid'

/**
 * UnifiedStaffService
 * 
 * This service synchronizes data between the Staff directory and Users & Permissions section.
 * It ensures that staff members and users are kept in sync, with changes in one system
 * automatically reflected in the other.
 */

// Map staff roles to user roles
const staffRoleToUserRole: Record<string, string> = {
  'super_admin': 'super_admin',
  'org_admin': 'org_admin',
  'location_manager': 'location_manager',
  'stylist': 'staff',
  'colorist': 'staff',
  'nail_technician': 'staff',
  'esthetician': 'staff',
  'massage_therapist': 'staff',
  'receptionist': 'receptionist',
  'staff': 'staff'
}

// Map user roles to staff roles (default mapping)
const userRoleToStaffRole: Record<string, string> = {
  'super_admin': 'super_admin',
  'org_admin': 'org_admin',
  'location_manager': 'location_manager',
  'staff': 'stylist',
  'receptionist': 'receptionist'
}

// Generate avatar initials from name
function getAvatarInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// Generate a random color for avatar
function getRandomAvatarColor(): string {
  const colors = [
    "bg-purple-100 text-purple-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800"
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const UnifiedStaffService = {
  /**
   * Initialize the service by synchronizing existing data
   * This should be called when the application starts
   */
  initialize: () => {
    // Get existing data
    const staffMembers = StaffStorage.getStaff()
    const users = SettingsStorage.getUsers()

    // Create a map of existing users by email for quick lookup
    const usersByEmail = new Map<string, User>()
    users.forEach(user => {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), user)
      }
    })

    // Create a map of existing staff by email for quick lookup
    const staffByEmail = new Map<string, StaffMember>()
    staffMembers.forEach(staff => {
      if (staff.email) {
        staffByEmail.set(staff.email.toLowerCase(), staff)
      }
    })

    // Create users for staff members that don't have corresponding users
    const newUsers: User[] = []
    staffMembers.forEach(staff => {
      if (staff.email && !usersByEmail.has(staff.email.toLowerCase())) {
        const newUser: User = {
          id: `user-${uuidv4()}`,
          name: staff.name,
          email: staff.email,
          role: staffRoleToUserRole[staff.role] || 'staff',
          locations: staff.locations,
          status: staff.status,
          avatar: staff.avatar,
          color: staff.color,
          lastLogin: 'Never'
        }
        newUsers.push(newUser)
        usersByEmail.set(staff.email.toLowerCase(), newUser)
      }
    })

    // Create staff members for users that don't have corresponding staff
    const newStaff: StaffMember[] = []
    users.forEach(user => {
      if (user.email && !staffByEmail.has(user.email.toLowerCase())) {
        const newStaffMember: StaffMember = {
          id: `staff-${uuidv4()}`,
          name: user.name,
          email: user.email,
          phone: '', // Default empty phone
          role: userRoleToStaffRole[user.role] || 'stylist',
          locations: user.locations,
          status: user.status,
          avatar: user.avatar,
          color: user.color,
          homeService: false // Default to false
        }
        newStaff.push(newStaffMember)
        staffByEmail.set(user.email.toLowerCase(), newStaffMember)
      }
    })

    // Save the new users and staff
    if (newUsers.length > 0) {
      SettingsStorage.saveUsers([...users, ...newUsers])
    }

    if (newStaff.length > 0) {
      StaffStorage.saveStaff([...staffMembers, ...newStaff])
    }

    // Return the counts for reporting
    return {
      newUsersCreated: newUsers.length,
      newStaffCreated: newStaff.length
    }
  },

  /**
   * Add a new staff member and corresponding user
   */
  addStaffMember: (staffData: Omit<StaffMember, 'id'>): { staff: StaffMember, user: User } => {
    // Generate avatar and color if not provided
    const avatar = staffData.avatar || getAvatarInitials(staffData.name)
    const color = staffData.color || getRandomAvatarColor()

    // Create the staff member
    const newStaff: StaffMember = {
      id: `staff-${uuidv4()}`,
      ...staffData,
      avatar,
      color
    }
    
    // Create the corresponding user
    const newUser: User = {
      id: `user-${uuidv4()}`,
      name: staffData.name,
      email: staffData.email,
      role: staffRoleToUserRole[staffData.role] || 'staff',
      locations: staffData.locations,
      status: staffData.status || 'Active',
      avatar,
      color,
      lastLogin: 'Never'
    }

    // Save both records
    const savedStaff = StaffStorage.addStaff(newStaff)
    SettingsStorage.addUser(newUser)

    return { staff: savedStaff, user: newUser }
  },

  /**
   * Update a staff member and synchronize with user data
   */
  updateStaffMember: (staffData: StaffMember): { staff: StaffMember | null, user: User | null } => {
    // Update the staff member
    const updatedStaff = StaffStorage.updateStaff(staffData)
    
    if (!updatedStaff) {
      return { staff: null, user: null }
    }

    // Find the corresponding user by email
    const users = SettingsStorage.getUsers()
    const userIndex = users.findIndex(u => u.email && u.email.toLowerCase() === staffData.email.toLowerCase())
    
    if (userIndex === -1) {
      // Create a new user if one doesn't exist
      const newUser: User = {
        id: `user-${uuidv4()}`,
        name: staffData.name,
        email: staffData.email,
        role: staffRoleToUserRole[staffData.role] || 'staff',
        locations: staffData.locations,
        status: staffData.status,
        avatar: staffData.avatar,
        color: staffData.color,
        lastLogin: 'Never'
      }
      
      SettingsStorage.addUser(newUser)
      return { staff: updatedStaff, user: newUser }
    } else {
      // Update the existing user
      const updatedUser: User = {
        ...users[userIndex],
        name: staffData.name,
        email: staffData.email,
        role: staffRoleToUserRole[staffData.role] || 'staff',
        locations: staffData.locations, // Sync locations from staff to user
        status: staffData.status,
        avatar: staffData.avatar,
        color: staffData.color
      }

      console.log(`UnifiedStaffService: Synchronizing user locations for ${updatedUser.name}: ${updatedUser.locations.join(', ')}`)
      SettingsStorage.updateUser(updatedUser)
      return { staff: updatedStaff, user: updatedUser }
    }
  },

  /**
   * Update a user and synchronize with staff data
   */
  updateUser: (userData: User): { user: User, staff: StaffMember | null } => {
    // Update the user
    SettingsStorage.updateUser(userData)
    
    // Find the corresponding staff member by email
    const staffMembers = StaffStorage.getStaff()
    const staffIndex = staffMembers.findIndex(s => s.email && userData.email && s.email.toLowerCase() === userData.email.toLowerCase())
    
    if (staffIndex === -1) {
      // Create a new staff member if one doesn't exist
      const newStaffMember: StaffMember = {
        id: `staff-${uuidv4()}`,
        name: userData.name,
        email: userData.email,
        phone: '', // Default empty phone
        role: userRoleToStaffRole[userData.role] || 'stylist',
        locations: userData.locations,
        status: userData.status,
        avatar: userData.avatar,
        color: userData.color,
        homeService: false // Default to false
      }
      
      const savedStaff = StaffStorage.addStaff(newStaffMember)
      return { user: userData, staff: savedStaff }
    } else {
      // Update the existing staff member
      const updatedStaff: StaffMember = {
        ...staffMembers[staffIndex],
        name: userData.name,
        email: userData.email,
        role: userRoleToStaffRole[userData.role] || 'stylist',
        locations: userData.locations,
        status: userData.status,
        avatar: userData.avatar,
        color: userData.color
      }
      
      const result = StaffStorage.updateStaff(updatedStaff)
      return { user: userData, staff: result }
    }
  },

  /**
   * Delete a staff member and its corresponding user
   */
  deleteStaffMember: (staffId: string): boolean => {
    // Get the staff member
    const staffMembers = StaffStorage.getStaff()
    const staffMember = staffMembers.find(s => s.id === staffId)

    if (!staffMember) {
      return false
    }

    // Delete the staff member
    const staffDeleted = StaffStorage.deleteStaff(staffId)
    
    // Find and delete the corresponding user
    if (staffMember.email) {
      const users = SettingsStorage.getUsers()
      const userIndex = users.findIndex(u => u.email && u.email.toLowerCase() === staffMember.email.toLowerCase())
      
      if (userIndex !== -1) {
        SettingsStorage.deleteUser(users[userIndex].id)
      }
    }
    
    return staffDeleted
  },

  /**
   * Delete a user and its corresponding staff member
   */
  deleteUser: (userId: string): boolean => {
    // Get the user
    const users = SettingsStorage.getUsers()
    const user = users.find(u => u.id === userId)
    
    if (!user) {
      return false
    }
    
    // Delete the user
    SettingsStorage.deleteUser(userId)
    
    // Find and delete the corresponding staff member
    if (user.email) {
      const staffMembers = StaffStorage.getStaff()
      const staffMember = staffMembers.find(s => s.email && s.email.toLowerCase() === user.email.toLowerCase())

      if (staffMember) {
        StaffStorage.deleteStaff(staffMember.id)
      }
    }
    
    return true
  },

  /**
   * Get all staff members with their corresponding user data
   */
  getAllStaffWithUserData: (): Array<{ staff: StaffMember, user: User | null }> => {
    // Use StaffStorage for client-side access (will be synced from FileStaffStorage via API)
    const staffMembers = StaffStorage.getStaff()
    const users = SettingsStorage.getUsers()
    
    // Create a map of users by email for quick lookup
    const usersByEmail = new Map<string, User>()
    users.forEach(user => {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), user)
      }
    })
    
    // Map staff members to their corresponding users
    return staffMembers.map(staff => {
      const user = staff.email ? usersByEmail.get(staff.email.toLowerCase()) || null : null
      return { staff, user }
    })
  },

  /**
   * Get all users with their corresponding staff data
   */
  getAllUsersWithStaffData: (): Array<{ user: User, staff: StaffMember | null }> => {
    const users = SettingsStorage.getUsers()
    const staffMembers = StaffStorage.getStaff()

    // Create a map of staff by email for quick lookup
    const staffByEmail = new Map<string, StaffMember>()
    staffMembers.forEach(staff => {
      if (staff.email) {
        staffByEmail.set(staff.email.toLowerCase(), staff)
      }
    })

    // Map users to their corresponding staff members
    return users.map(user => {
      const staff = user.email ? staffByEmail.get(user.email.toLowerCase()) || null : null
      return { user, staff }
    })
  },

  /**
   * Synchronize all user locations with their corresponding staff locations
   * This ensures that user location data matches staff location assignments
   */
  syncUserLocationsFromStaff: (): { updated: number, errors: number } => {
    console.log('UnifiedStaffService: Starting user location synchronization...')

    const users = SettingsStorage.getUsers()
    const staffMembers = StaffStorage.getStaff()

    // Create a map of staff by email for quick lookup
    const staffByEmail = new Map<string, StaffMember>()
    staffMembers.forEach(staff => {
      if (staff.email) {
        staffByEmail.set(staff.email.toLowerCase(), staff)
      }
    })

    let updated = 0
    let errors = 0

    // Update each user's locations to match their corresponding staff member
    const updatedUsers = users.map(user => {
      try {
        const staff = user.email ? staffByEmail.get(user.email.toLowerCase()) : null

        if (staff) {
          // Check if locations need to be updated
          const currentLocations = user.locations || []
          const staffLocations = staff.locations || []

          // Compare arrays (order doesn't matter)
          const locationsMatch = currentLocations.length === staffLocations.length &&
            currentLocations.every(loc => staffLocations.includes(loc)) &&
            staffLocations.every(loc => currentLocations.includes(loc))

          if (!locationsMatch) {
            console.log(`UnifiedStaffService: Updating locations for ${user.name}: ${currentLocations.join(', ')} -> ${staffLocations.join(', ')}`)
            updated++
            return {
              ...user,
              locations: staffLocations
            }
          }
        }

        return user
      } catch (error) {
        console.error(`UnifiedStaffService: Error updating user ${user.name}:`, error)
        errors++
        return user
      }
    })

    // Save the updated users
    if (updated > 0) {
      SettingsStorage.saveUsers(updatedUsers)
      console.log(`UnifiedStaffService: Synchronized ${updated} user location assignments`)
    } else {
      console.log('UnifiedStaffService: All user locations are already synchronized')
    }

    return { updated, errors }
  }
}
