// Carousel Storage Service
// Manages persistent storage and real-time updates for carousel content

export interface CarouselItem {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  price?: number
  originalPrice?: number
  type: "service" | "product" | "stylist" | "promotion"
  badge?: "sale" | "new" | "featured" | "hot"
  ctaText: string
  ctaLink: string
  gradient: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface FeaturedSection {
  id: string
  title: string
  type: "services" | "products" | "stylists"
  items: Array<{
    id: string
    name: string
    image: string
    price?: number
    rating?: number
    isActive: boolean
  }>
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface SpecialOffer {
  id: string
  title: string
  description: string
  type: "promotion" | "loyalty" | "seasonal"
  discountType: "percentage" | "fixed" | "bogo"
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  conditions?: {
    minAmount?: number
    applicableServices?: string[]
    applicableProducts?: string[]
    maxUses?: number
    currentUses?: number
  }
  createdAt: Date
  updatedAt: Date
}

class CarouselStorageService {
  private storageKey = 'salon_carousel_data'
  private listeners: Set<() => void> = new Set()

  // Default data
  private defaultData = {
    carouselItems: [
      {
        id: "featured-1",
        title: "Summer Glow Special",
        subtitle: "Beat the Heat in Style",
        description: "Get ready for summer with our refreshing treatments! Book any styling service and receive 25% off your next visit. Perfect for vacation prep!",
        image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
        price: 135,
        originalPrice: 180,
        type: "service" as const,
        badge: "sale" as const,
        ctaText: "Book Summer Style",
        ctaLink: "/client-portal/appointments/book?serviceId=6",
        gradient: "bg-gradient-to-r from-orange-900/80 via-pink-900/60 to-transparent",
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "featured-2",
        title: "Premium Hair Care",
        subtitle: "Professional Products",
        description: "Discover our exclusive line of premium hair care products. Get 15% off your first purchase!",
        image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
        price: 45,
        originalPrice: 55,
        type: "product" as const,
        badge: "new" as const,
        ctaText: "Shop Products",
        ctaLink: "/client-portal/shop",
        gradient: "bg-gradient-to-r from-blue-900/80 via-purple-900/60 to-transparent",
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "featured-3",
        title: "Meet Sarah",
        subtitle: "Master Colorist",
        description: "Book with our award-winning colorist Sarah. Specializing in balayage and color corrections.",
        image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
        type: "stylist" as const,
        badge: "featured" as const,
        ctaText: "Book with Sarah",
        ctaLink: "/client-portal/appointments/book?stylistId=2",
        gradient: "bg-gradient-to-r from-green-900/80 via-teal-900/60 to-transparent",
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    quickActions: [
      {
        id: "book-appointment",
        title: "Book Appointment",
        description: "Schedule your next visit",
        icon: "Calendar",
        href: "/client-portal/appointments/book",
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "our-services",
        title: "Our Services",
        description: "Explore our services",
        icon: "Scissors",
        href: "/client-portal/services",
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "shop-products",
        title: "Shop Products",
        description: "Browse our products",
        icon: "ShoppingBag",
        href: "/client-portal/shop",
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "loyalty-program",
        title: "Loyalty Program",
        description: "View your points & rewards",
        icon: "Gift",
        href: "/client-portal/loyalty",
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "my-reviews",
        title: "My Reviews",
        description: "Share your feedback",
        icon: "Star",
        href: "/client-portal/reviews",
        isActive: true,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "my-orders",
        title: "My Orders",
        description: "Track your purchases",
        icon: "Package",
        href: "/client-portal/orders",
        isActive: true,
        order: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    featuredSections: [
      {
        id: "featured-services",
        title: "Featured Services",
        type: "services" as const,
        items: [
          {
            id: "service-1",
            name: "Hair Coloring",
            image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            price: 150,
            rating: 4.8,
            isActive: true
          },
          {
            id: "service-2",
            name: "Hair Styling",
            image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            price: 80,
            rating: 4.9,
            isActive: true
          }
        ],
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "featured-products",
        title: "Featured Products",
        type: "products" as const,
        items: [
          {
            id: "product-1",
            name: "Premium Shampoo",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
            price: 45,
            rating: 4.7,
            isActive: true
          }
        ],
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    specialOffers: []
  }

  // Get all data
  getData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        return this.deserializeDates(parsed)
      }
    } catch (error) {
      console.error('Error loading carousel data:', error)
    }
    return this.defaultData
  }

  // Save all data
  saveData(data: any) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      this.notifyListeners()
    } catch (error) {
      console.error('Error saving carousel data:', error)
    }
  }

  // Carousel Items
  getCarouselItems(): CarouselItem[] {
    return this.getData().carouselItems.sort((a: CarouselItem, b: CarouselItem) => a.order - b.order)
  }

  saveCarouselItems(items: CarouselItem[]) {
    const data = this.getData()
    data.carouselItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
      updatedAt: new Date()
    }))
    this.saveData(data)
  }

  addCarouselItem(item: Omit<CarouselItem, 'id' | 'order' | 'createdAt' | 'updatedAt'>): CarouselItem {
    const data = this.getData()
    const newItem: CarouselItem = {
      ...item,
      id: `carousel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: data.carouselItems.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    data.carouselItems.push(newItem)
    this.saveData(data)
    return newItem
  }

  updateCarouselItem(id: string, updates: Partial<CarouselItem>) {
    const data = this.getData()
    const index = data.carouselItems.findIndex((item: CarouselItem) => item.id === id)
    if (index !== -1) {
      data.carouselItems[index] = {
        ...data.carouselItems[index],
        ...updates,
        updatedAt: new Date()
      }
      this.saveData(data)
    }
  }

  deleteCarouselItem(id: string) {
    const data = this.getData()
    data.carouselItems = data.carouselItems.filter((item: CarouselItem) => item.id !== id)
    this.saveData(data)
  }

  // Quick Actions
  getQuickActions(): QuickAction[] {
    const data = this.getData()
    const quickActions = data.quickActions || this.defaultData.quickActions
    return quickActions.sort((a: QuickAction, b: QuickAction) => a.order - b.order)
  }

  saveQuickActions(actions: QuickAction[]) {
    const data = this.getData()
    data.quickActions = actions.map((action, index) => ({
      ...action,
      order: index + 1,
      updatedAt: new Date()
    }))
    this.saveData(data)
  }

  // Reset quick actions to defaults
  resetQuickActionsToDefaults() {
    const data = this.getData()
    data.quickActions = this.defaultData.quickActions
    this.saveData(data)
  }

  // Featured Sections
  getFeaturedSections(): FeaturedSection[] {
    return this.getData().featuredSections.sort((a: FeaturedSection, b: FeaturedSection) => a.order - b.order)
  }

  addFeaturedSection(section: Omit<FeaturedSection, 'id' | 'order' | 'createdAt' | 'updatedAt'>): FeaturedSection {
    const data = this.getData()
    const newSection: FeaturedSection = {
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: data.featuredSections.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    data.featuredSections.push(newSection)
    this.saveData(data)
    return newSection
  }

  updateFeaturedSection(id: string, updates: Partial<FeaturedSection>) {
    const data = this.getData()
    const index = data.featuredSections.findIndex((section: FeaturedSection) => section.id === id)
    if (index !== -1) {
      data.featuredSections[index] = {
        ...data.featuredSections[index],
        ...updates,
        updatedAt: new Date()
      }
      this.saveData(data)
    }
  }

  deleteFeaturedSection(id: string) {
    const data = this.getData()
    data.featuredSections = data.featuredSections.filter((section: FeaturedSection) => section.id !== id)
    this.saveData(data)
  }

  addFeaturedSectionItem(sectionId: string, item: Omit<FeaturedSection['items'][0], 'id'>) {
    const data = this.getData()
    const sectionIndex = data.featuredSections.findIndex((section: FeaturedSection) => section.id === sectionId)
    if (sectionIndex !== -1) {
      const newItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      data.featuredSections[sectionIndex].items.push(newItem)
      data.featuredSections[sectionIndex].updatedAt = new Date()
      this.saveData(data)
    }
  }

  updateFeaturedSectionItem(sectionId: string, itemId: string, updates: Partial<FeaturedSection['items'][0]>) {
    const data = this.getData()
    const sectionIndex = data.featuredSections.findIndex((section: FeaturedSection) => section.id === sectionId)
    if (sectionIndex !== -1) {
      const itemIndex = data.featuredSections[sectionIndex].items.findIndex(item => item.id === itemId)
      if (itemIndex !== -1) {
        data.featuredSections[sectionIndex].items[itemIndex] = {
          ...data.featuredSections[sectionIndex].items[itemIndex],
          ...updates
        }
        data.featuredSections[sectionIndex].updatedAt = new Date()
        this.saveData(data)
      }
    }
  }

  deleteFeaturedSectionItem(sectionId: string, itemId: string) {
    const data = this.getData()
    const sectionIndex = data.featuredSections.findIndex((section: FeaturedSection) => section.id === sectionId)
    if (sectionIndex !== -1) {
      data.featuredSections[sectionIndex].items = data.featuredSections[sectionIndex].items.filter(item => item.id !== itemId)
      data.featuredSections[sectionIndex].updatedAt = new Date()
      this.saveData(data)
    }
  }

  // Special Offers
  getSpecialOffers(): SpecialOffer[] {
    return this.getData().specialOffers || []
  }

  addSpecialOffer(offer: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>): SpecialOffer {
    const data = this.getData()
    const newOffer: SpecialOffer = {
      ...offer,
      id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    if (!data.specialOffers) {
      data.specialOffers = []
    }
    data.specialOffers.push(newOffer)
    this.saveData(data)
    return newOffer
  }

  updateSpecialOffer(id: string, updates: Partial<SpecialOffer>) {
    const data = this.getData()
    if (!data.specialOffers) {
      data.specialOffers = []
    }
    const index = data.specialOffers.findIndex((offer: SpecialOffer) => offer.id === id)
    if (index !== -1) {
      data.specialOffers[index] = {
        ...data.specialOffers[index],
        ...updates,
        updatedAt: new Date()
      }
      this.saveData(data)
    }
  }

  deleteSpecialOffer(id: string) {
    const data = this.getData()
    if (data.specialOffers) {
      data.specialOffers = data.specialOffers.filter((offer: SpecialOffer) => offer.id !== id)
      this.saveData(data)
    }
  }

  // Real-time updates
  subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback())
  }

  private deserializeDates(data: any): any {
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(item => this.deserializeDates(item))
      }
      
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (key.endsWith('At') && typeof value === 'string') {
          result[key] = new Date(value)
        } else if (typeof value === 'object') {
          result[key] = this.deserializeDates(value)
        } else {
          result[key] = value
        }
      }
      return result
    }
    return data
  }

  // Reset to defaults
  resetToDefaults() {
    localStorage.removeItem(this.storageKey)
    this.notifyListeners()
  }

  // Export data
  exportData() {
    return JSON.stringify(this.getData(), null, 2)
  }

  // Import data
  importData(jsonData: string) {
    try {
      const data = JSON.parse(jsonData)
      this.saveData(data)
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

// Singleton instance
export const carouselStorage = new CarouselStorageService()

// React hook for real-time updates
export function useCarouselData() {
  const [data, setData] = useState(() => carouselStorage.getData())

  useEffect(() => {
    const unsubscribe = carouselStorage.subscribe(() => {
      setData(carouselStorage.getData())
    })
    return unsubscribe
  }, [])

  return {
    carouselItems: data.carouselItems,
    quickActions: data.quickActions,
    featuredSections: data.featuredSections,
    specialOffers: data.specialOffers,
    refresh: () => setData(carouselStorage.getData())
  }
}

// Import React for the hook
import { useState, useEffect } from 'react'
