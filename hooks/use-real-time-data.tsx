"use client"

import { useState, useEffect, useCallback } from "react"
import { useProducts } from "@/lib/product-provider"
import { useServices } from "@/lib/service-provider"
import { useStaff } from "@/lib/staff-provider"

interface UseRealTimeDataOptions {
  enableProducts?: boolean
  enableServices?: boolean
  enableStaff?: boolean
  refreshInterval?: number
}

interface RealTimeData {
  products: any[]
  services: any[]
  staff: any[]
  isLoading: boolean
  lastUpdated: number
  refresh: () => void
}

export function useRealTimeData({
  enableProducts = true,
  enableServices = true,
  enableStaff = true,
  refreshInterval = 30000 // 30 seconds
}: UseRealTimeDataOptions = {}): RealTimeData {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  // Get data from providers
  const {
    products,
    getRetailProducts,
    refreshProducts,
    lastUpdated: productsLastUpdated
  } = useProducts()

  const {
    services,
    refreshServices,
  } = useServices()

  const {
    staff,
    refreshStaff
  } = useStaff()

  // Enhanced product data with proper image handling
  const enhancedProducts = useCallback(() => {
    if (!enableProducts || !products) return []

    try {
      return getRetailProducts()
        .filter(product => product.isActive && product.visibleInShop)
        .map(product => ({
          ...product,
          // Ensure image is properly formatted with enhanced Unsplash images
          image: product.images?.[0] || product.image || [
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop&crop=center&auto=format&q=80"
          ][Math.floor(Math.random() * 5)],
          images: product.images?.length > 0 ? product.images : [product.image || [
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop&crop=center&auto=format&q=80"
          ][Math.floor(Math.random() * 5)]],
          // Add recommendation score based on category and popularity
          recommendationScore: calculateProductRecommendationScore(product),
          // Enhanced metadata
          isRecommended: product.isBestSeller || product.isNew || (product.rating && product.rating >= 4.5),
          displayPrice: product.salePrice || product.price,
          originalPrice: product.salePrice ? product.price : undefined
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
    } catch (error) {
      console.error('Error enhancing products:', error)
      return []
    }
  }, [enableProducts, products.length])

  // Enhanced service data with proper image handling
  const enhancedServices = useCallback(() => {
    if (!enableServices || !services) return []

    try {
      return services
        .filter(service => service.isActive !== false)
        .map(service => ({
          ...service,
          // Ensure image is properly formatted with enhanced Unsplash images
          image: service.imageUrl || service.image || [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&crop=center&auto=format&q=80"
          ][Math.floor(Math.random() * 5)],
          images: service.imageUrl ? [service.imageUrl] : [service.image || [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&crop=center&auto=format&q=80"
          ][Math.floor(Math.random() * 5)]],
          // Add recommendation score
          recommendationScore: calculateServiceRecommendationScore(service),
          // Enhanced metadata
          isRecommended: service.isPopular || (service.rating && service.rating >= 4.5),
          displayPrice: service.price,
          formattedDuration: service.duration ? formatDuration(service.duration) : undefined
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
    } catch (error) {
      console.error('Error enhancing services:', error)
      return []
    }
  }, [enableServices, services.length])

  // Enhanced staff data with proper image handling
  const enhancedStaff = useCallback(() => {
    if (!enableStaff || !staff) return []

    try {
      return staff
        .filter(member => member.status === "active")
        .map(member => ({
          ...member,
          // Use real profile image or fallback to default avatar
          image: member.profileImage || member.image || '/default-avatar.jpg',
          images: member.profileImage ? [member.profileImage] : [member.image || '/default-avatar.jpg'],
          // Add recommendation score
          recommendationScore: calculateStaffRecommendationScore(member),
          // Enhanced metadata
          isRecommended: (member.rating && member.rating >= 4.5) || member.isTopRated,
          displayName: member.name,
          specialties: member.specialties || [],
          availability: member.availability || "Available"
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
    } catch (error) {
      console.error('Error enhancing staff:', error)
      return []
    }
  }, [enableStaff, staff.length])

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const promises = []
      if (enableProducts) promises.push(refreshProducts())
      if (enableServices) promises.push(refreshServices())
      if (enableStaff) promises.push(refreshStaff())

      await Promise.all(promises)
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setLastUpdated(Date.now())
      setIsLoading(false)
    }
  }, [enableProducts, enableServices, enableStaff, refreshProducts, refreshServices, refreshStaff])

  // Initial load - only run once
  useEffect(() => {
    setIsLoading(false) // Don't auto-refresh on mount to prevent circular dependencies
  }, [])

  // Auto-refresh interval - only if explicitly enabled
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        setLastUpdated(Date.now())
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  // Listen for data changes - simplified
  useEffect(() => {
    if (productsLastUpdated && productsLastUpdated > lastUpdated) {
      setLastUpdated(productsLastUpdated)
    }
  }, [productsLastUpdated])

  return {
    products: enhancedProducts(),
    services: enhancedServices(),
    staff: enhancedStaff(),
    isLoading,
    lastUpdated,
    refresh
  }
}

// Helper functions for recommendation scoring
function calculateProductRecommendationScore(product: any): number {
  let score = 0

  // Base score from rating
  score += (product.rating || 0) * 20

  // Bonus for special flags
  if (product.isBestSeller) score += 30
  if (product.isNew) score += 25
  if (product.isSale) score += 20

  // Bonus for high stock (indicates popularity)
  if (product.stock > 50) score += 15

  // Bonus for recent updates (indicates active management)
  const daysSinceUpdate = (Date.now() - new Date(product.updatedAt || 0).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate < 7) score += 10

  return score
}

function calculateServiceRecommendationScore(service: any): number {
  let score = 0

  // Base score from rating
  score += (service.rating || 0) * 20

  // Bonus for popular services
  if (service.isPopular) score += 30

  // Bonus for reasonable pricing (not too high, not too low)
  if (service.price >= 50 && service.price <= 200) score += 15

  // Bonus for reasonable duration
  if (service.duration >= 30 && service.duration <= 120) score += 10

  return score
}

function calculateStaffRecommendationScore(member: any): number {
  let score = 0

  // Base score from rating
  score += (member.rating || 0) * 20

  // Bonus for top-rated staff
  if (member.isTopRated) score += 30

  // Bonus for experience (assuming years of experience in bio)
  const bio = member.bio || ""
  const experienceMatch = bio.match(/(\d+)\s*years?/i)
  if (experienceMatch) {
    const years = parseInt(experienceMatch[1])
    score += Math.min(years * 2, 20) // Max 20 points for experience
  }

  // Bonus for specialties
  if (member.specialties?.length > 0) score += 15

  return score
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }
}
