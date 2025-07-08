/**
 * Female Avatar Service
 * Provides professional female avatar images for salon staff
 */

// High-quality professional female avatar images from Unsplash
// These are diverse, professional, and appropriate for a beauty salon context
export const FEMALE_AVATARS = [
  // Diverse professional women - beauty/salon appropriate
  "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 1
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 2
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 3
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 4
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 5
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 6
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 7
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 8
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 9
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 10
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 11
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop&crop=face&auto=format&q=80", // Professional woman 12
] as const

/**
 * Get a female avatar image URL based on staff ID or name
 * This ensures consistent avatar assignment for each staff member
 */
export function getFemaleAvatarUrl(identifier: string): string {
  // Create a simple hash from the identifier to ensure consistency
  const hash = identifier.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  // Use modulo to select an avatar from the array
  const index = hash % FEMALE_AVATARS.length
  return FEMALE_AVATARS[index]
}

/**
 * Get a random female avatar URL
 * Useful for new staff members or when you want variety
 */
export function getRandomFemaleAvatarUrl(): string {
  const randomIndex = Math.floor(Math.random() * FEMALE_AVATARS.length)
  return FEMALE_AVATARS[randomIndex]
}

/**
 * Check if a given URL is one of our female avatar URLs
 */
export function isFemaleAvatarUrl(url: string): boolean {
  return FEMALE_AVATARS.includes(url as any)
}

/**
 * Get avatar URL with fallback logic
 * Priority: profileImage -> female avatar -> initials (as last resort)
 */
export function getStaffAvatarUrl(staff: {
  id: string
  name: string
  profileImage?: string
  avatar?: string
}): { type: 'profile' | 'female-avatar' | 'initials', url?: string, initials?: string } {
  // First priority: existing profile image
  if (staff.profileImage && staff.profileImage.trim() !== '') {
    return { type: 'profile', url: staff.profileImage }
  }
  
  // Second priority: female avatar
  const femaleAvatarUrl = getFemaleAvatarUrl(staff.id || staff.name)
  return { type: 'female-avatar', url: femaleAvatarUrl }
}

/**
 * Generate initials as absolute fallback
 * Only used when images fail to load
 */
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Extract first name from full name
 * Used for simplified staff display in calendar views
 */
export function getFirstName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return ''
  }

  const trimmedName = fullName.trim()
  const nameParts = trimmedName.split(' ')

  // Return the first part of the name
  return nameParts[0] || ''
}
