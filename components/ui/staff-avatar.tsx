"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStaffAvatarUrl, generateInitials } from "@/lib/female-avatars"
import { cn } from "@/lib/utils"

interface StaffAvatarProps {
  staff: {
    id: string
    name: string
    profileImage?: string
    avatar?: string
    color?: string
  }
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10", 
  lg: "h-12 w-12",
  xl: "h-16 w-16"
}

export function StaffAvatar({ 
  staff, 
  size = "md", 
  className,
  showFallback = true 
}: StaffAvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const [femaleAvatarError, setFemaleAvatarError] = React.useState(false)
  
  const avatarInfo = getStaffAvatarUrl(staff)
  const initials = generateInitials(staff.name)

  // Reset error states when staff changes
  React.useEffect(() => {
    setImageError(false)
    setFemaleAvatarError(false)
  }, [staff.id, staff.profileImage])

  const handleImageError = () => {
    setImageError(true)
  }

  const handleFemaleAvatarError = () => {
    setFemaleAvatarError(true)
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {/* First priority: Profile image */}
      {avatarInfo.type === 'profile' && !imageError && (
        <AvatarImage
          src={avatarInfo.url}
          alt={staff.name}
          onError={handleImageError}
          className="object-cover"
        />
      )}
      
      {/* Second priority: Female avatar (if profile image failed or doesn't exist) */}
      {(avatarInfo.type === 'female-avatar' || (avatarInfo.type === 'profile' && imageError)) && 
       !femaleAvatarError && (
        <AvatarImage
          src={avatarInfo.type === 'female-avatar' ? avatarInfo.url : getStaffAvatarUrl(staff).url}
          alt={`${staff.name} avatar`}
          onError={handleFemaleAvatarError}
          className="object-cover"
        />
      )}
      
      {/* Final fallback: Initials (only if both images fail and showFallback is true) */}
      {showFallback && (imageError || femaleAvatarError) && (
        <AvatarFallback className={cn(
          "font-medium text-sm",
          staff.color || "bg-gray-100 text-gray-600"
        )}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

// Simplified version for when you just need the image URL
export function useStaffAvatarUrl(staff: {
  id: string
  name: string
  profileImage?: string
  avatar?: string
}) {
  return React.useMemo(() => {
    const avatarInfo = getStaffAvatarUrl(staff)
    return avatarInfo.url || ''
  }, [staff.id, staff.profileImage, staff.name])
}
