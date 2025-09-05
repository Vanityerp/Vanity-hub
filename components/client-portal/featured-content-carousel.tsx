"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedImage } from "@/components/ui/enhanced-image"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { ChevronLeft, ChevronRight, Star, Calendar, ShoppingCart, Sparkles, Crown, Flame } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FeaturedItem {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  images?: string[]
  price?: number
  originalPrice?: number
  type: "service" | "product" | "promotion"
  badge?: "featured" | "new" | "bestseller" | "sale" | "limited"
  ctaText: string
  ctaLink: string
  gradient?: string
}

interface FeaturedContentCarouselProps {
  items: FeaturedItem[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showDots?: boolean
  className?: string
}

const badgeConfig = {
  featured: { icon: Crown, color: "bg-gradient-to-r from-purple-500 to-pink-500", text: "Featured" },
  new: { icon: Sparkles, color: "bg-gradient-to-r from-green-500 to-emerald-500", text: "New" },
  bestseller: { icon: Flame, color: "bg-gradient-to-r from-orange-500 to-red-500", text: "Bestseller" },
  sale: { icon: Star, color: "bg-gradient-to-r from-red-500 to-pink-500", text: "Sale" },
  limited: { icon: Star, color: "bg-gradient-to-r from-blue-500 to-indigo-500", text: "Limited" }
}

export function FeaturedContentCarousel({
  items,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  className
}: FeaturedContentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || items.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, isHovered, items.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length)
  }

  if (items.length === 0) {
    return null
  }

  const currentItem = items[currentIndex]
  const BadgeIcon = currentItem.badge ? badgeConfig[currentItem.badge]?.icon : null
  const badgeColor = currentItem.badge ? badgeConfig[currentItem.badge]?.color : ""
  const badgeText = currentItem.badge ? badgeConfig[currentItem.badge]?.text : ""

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-gray-50 to-white border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="relative h-80 md:h-96 z-0">
            {/* Background Image */}
            <div className="absolute inset-0">
              <EnhancedImage
                src={currentItem.image}
                alt={currentItem.title}
                className="w-full h-full"
                aspectRatio="landscape"
                showZoom={false}
                objectFit="cover"
                fallbackSrc="/carousel-placeholder.svg"
                priority={true}
                sizes="100vw"
              />
              <div className={cn(
                "absolute inset-0",
                currentItem.gradient || "bg-gradient-to-r from-black/60 via-black/40 to-transparent"
              )} />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-6 md:px-8">
                <div className="max-w-lg text-white">
                  {/* Badge */}
                  {currentItem.badge && BadgeIcon && (
                    <Badge className={cn(
                      "mb-4 text-white border-0 px-3 py-1.5 text-sm font-medium",
                      badgeColor
                    )}>
                      <BadgeIcon className="w-4 h-4 mr-1.5" />
                      {badgeText}
                    </Badge>
                  )}

                  {/* Title and Subtitle */}
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                    {currentItem.title}
                  </h2>
                  {currentItem.subtitle && (
                    <p className="text-lg md:text-xl text-gray-200 mb-3">
                      {currentItem.subtitle}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {currentItem.description}
                  </p>

                  {/* Price */}
                  {currentItem.price && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-2xl font-bold text-white">
                        <CurrencyDisplay amount={currentItem.price} />
                      </span>
                      {currentItem.originalPrice && currentItem.originalPrice > currentItem.price && (
                        <span className="text-lg text-gray-400 line-through">
                          <CurrencyDisplay amount={currentItem.originalPrice} />
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link href={currentItem.ctaLink} className="inline-flex items-center gap-2">
                      {currentItem.type === "service" && <Calendar className="w-5 h-5" />}
                      {currentItem.type === "product" && <ShoppingCart className="w-5 h-5" />}
                      {currentItem.ctaText}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-pink-600 scale-110" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
