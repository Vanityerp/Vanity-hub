"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedImage } from "@/components/ui/enhanced-image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StaffAvatar } from "@/components/ui/staff-avatar"
import {
  Star,
  Heart,
  Calendar,
  Award,
  MapPin,
  Clock,
  Scissors,
  Palette,
  Sparkles,
  Crown,
  Languages
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Stylist {
  id: string
  name: string
  role: string
  profileImage?: string
  avatar?: string
  specialties?: string[]
  yearsExperience?: number
  rating?: number
  bio?: string
  isFeatured?: boolean
  certifications?: string[]
  languages?: string[]
  locations?: string[]
  color?: string
}

interface EnhancedStylistCardProps {
  stylist: Stylist
  showBookButton?: boolean
  showFavoriteButton?: boolean
  compact?: boolean
  className?: string
  onFavorite?: (stylist: Stylist) => void
}

const roleIcons = {
  stylist: Scissors,
  colorist: Palette,
  nail_technician: Sparkles,
  esthetician: Star,
  massage_therapist: Star,
  barber: Scissors
}

const specialtyColors = {
  "Precision Cuts": "bg-blue-100 text-blue-800",
  "Styling": "bg-purple-100 text-purple-800",
  "Bridal Hair": "bg-pink-100 text-pink-800",
  "Color Correction": "bg-orange-100 text-orange-800",
  "Balayage": "bg-yellow-100 text-yellow-800",
  "Highlights": "bg-green-100 text-green-800",
  "Curly Hair": "bg-indigo-100 text-indigo-800",
  "Natural Styles": "bg-emerald-100 text-emerald-800"
}

export function EnhancedStylistCard({
  stylist,
  showBookButton = true,
  showFavoriteButton = true,
  compact = false,
  className,
  onFavorite
}: EnhancedStylistCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [imageError, setImageError] = useState(false)

  const RoleIcon = roleIcons[stylist.role as keyof typeof roleIcons] || Scissors

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    onFavorite?.(stylist)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < Math.floor(rating) 
            ? "fill-amber-400 text-amber-400" 
            : "fill-gray-200 text-gray-200"
        )}
      />
    ))
  }

  if (compact) {
    return (
      <Card className={cn("group hover:shadow-md transition-all duration-300", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Profile Image */}
            <div className="relative">
              {stylist.profileImage && !imageError ? (
                <EnhancedImage
                  src={stylist.profileImage}
                  alt={stylist.name}
                  className="w-12 h-12 rounded-full"
                  aspectRatio="square"
                  showZoom={false}
                  onError={() => setImageError(true)}
                />
              ) : (
                <StaffAvatar
                  staff={stylist}
                  size="lg"
                />
              )}
              {stylist.isFeatured && (
                <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{stylist.name}</h4>
              <p className="text-xs text-gray-500 capitalize">{stylist.role.replace('_', ' ')}</p>
              {stylist.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {renderStars(stylist.rating)}
                  </div>
                  <span className="text-xs text-gray-500">{stylist.rating}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {showFavoriteButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFavorite}
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
                  )} />
                </Button>
              )}
              {showBookButton && (
                <Button size="sm" asChild>
                  <Link href={`/client-portal/appointments/book?staffId=${stylist.id}`}>
                    Book
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header with Profile Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {stylist.profileImage && !imageError ? (
            <EnhancedImage
              src={stylist.profileImage}
              alt={stylist.name}
              className="w-full h-full"
              aspectRatio="landscape"
              showZoom={false}
              objectFit="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <StaffAvatar
                staff={stylist}
                size="xl"
                className="w-24 h-24"
              />
            </div>
          )}
          
          {/* Overlay with badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Featured badge */}
          {stylist.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}

          {/* Favorite button */}
          {showFavoriteButton && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              onClick={handleFavorite}
            >
              <Heart className={cn(
                "h-4 w-4",
                isFavorited ? "fill-red-500 text-red-500" : "text-white"
              )} />
            </Button>
          )}

          {/* Name and role at bottom */}
          <div className="absolute bottom-3 left-3 text-white">
            <h3 className="font-semibold text-lg">{stylist.name}</h3>
            <div className="flex items-center gap-2">
              <RoleIcon className="w-4 h-4" />
              <span className="text-sm capitalize">{stylist.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Rating and Experience */}
          <div className="flex items-center justify-between">
            {stylist.rating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {renderStars(stylist.rating)}
                </div>
                <span className="text-sm text-gray-600">{stylist.rating}</span>
              </div>
            )}
            {stylist.yearsExperience && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {stylist.yearsExperience} years
              </div>
            )}
          </div>

          {/* Bio */}
          {stylist.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">{stylist.bio}</p>
          )}

          {/* Specialties */}
          {stylist.specialties && stylist.specialties.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Specialties</h4>
              <div className="flex flex-wrap gap-1">
                {stylist.specialties.slice(0, 3).map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      specialtyColors[specialty as keyof typeof specialtyColors] || "bg-gray-100 text-gray-800"
                    )}
                  >
                    {specialty}
                  </Badge>
                ))}
                {stylist.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{stylist.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Certifications */}
          {stylist.certifications && stylist.certifications.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="w-4 h-4" />
              <span>{stylist.certifications.length} certification{stylist.certifications.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Languages */}
          {stylist.languages && stylist.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Languages className="w-4 h-4" />
              <span>{stylist.languages.join(', ')}</span>
            </div>
          )}

          {/* Book button */}
          {showBookButton && (
            <Button className="w-full" asChild>
              <Link href={`/client-portal/appointments/book?staffId=${stylist.id}`}>
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
