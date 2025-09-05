"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface MockImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
}

export function MockImage({ src, alt, fill, width, height, className }: MockImageProps) {
  const [color, setColor] = useState<string>("")
  const [initials, setInitials] = useState<string>("")
  
  useEffect(() => {
    // Generate a consistent color based on the src
    const colors = [
      "bg-pink-100", "bg-blue-100", "bg-green-100", "bg-purple-100", 
      "bg-yellow-100", "bg-indigo-100", "bg-red-100", "bg-orange-100"
    ]
    
    // Use the src to deterministically pick a color
    const colorIndex = src.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    setColor(colors[colorIndex])
    
    // Generate initials from the alt text or src
    const text = alt || src
    const words = text.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0)
    
    if (words.length >= 2) {
      setInitials(`${words[0][0]}${words[1][0]}`.toUpperCase())
    } else if (words.length === 1) {
      setInitials(words[0].substring(0, 2).toUpperCase())
    } else {
      // Fallback to using characters from the src
      const srcParts = src.split(/[^a-zA-Z0-9]+/).filter(part => part.length > 0)
      if (srcParts.length > 0) {
        setInitials(srcParts[0].substring(0, 2).toUpperCase())
      } else {
        setInitials("IM")
      }
    }
  }, [src, alt])
  
  // If the image is a staff image, use a person-shaped placeholder
  const isStaffImage = src.includes("staff")
  
  return (
    <div 
      className={`${color} flex items-center justify-center overflow-hidden ${className || ""}`}
      style={fill ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : { width, height }}
    >
      <span className={`text-lg font-bold ${isStaffImage ? "rounded-full p-4" : ""}`}>
        {initials}
      </span>
    </div>
  )
}
