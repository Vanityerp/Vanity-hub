export interface SpecialOffer {
  id: string
  title: string
  description: string
  type: "promotion" | "loyalty" | "seasonal"
  discountType: "percentage" | "fixed" | "bogo" | "points_multiplier"
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
    tierRequirement?: string
  }
  image?: string
  badge?: string
  badgeColor?: string
  ctaText?: string
  ctaLink?: string
  createdAt: Date
  updatedAt: Date
}

class SpecialOffersStorage {
  private storageKey = 'vanity_special_offers'

  private defaultOffers: SpecialOffer[] = [
    {
      id: "summer-glow-2025",
      title: "Summer Glow Special",
      description: "Beat the heat in style! Book any styling service and receive 25% off your next visit. Perfect for vacation prep and summer makeovers.",
      type: "seasonal",
      discountType: "percentage",
      discountValue: 25,
      validFrom: new Date('2025-06-01'),
      validTo: new Date('2025-08-31'),
      isActive: true,
      conditions: {
        minAmount: 50,
        applicableServices: ["styling", "haircut", "color"],
        maxUses: 1000,
        currentUses: 156
      },
      image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
      badge: "25% OFF",
      badgeColor: "bg-orange-500",
      ctaText: "Book Summer Style",
      ctaLink: "/client-portal/appointments/book?serviceId=6",
      createdAt: new Date('2025-05-15'),
      updatedAt: new Date('2025-05-15')
    },
    {
      id: "double-points-weekend",
      title: "Double Points Weekend",
      description: "Earn double loyalty points on all services booked this weekend. Perfect time to boost your rewards balance!",
      type: "loyalty",
      discountType: "points_multiplier",
      discountValue: 2,
      validFrom: new Date('2025-02-15'),
      validTo: new Date('2025-02-16'),
      isActive: true,
      conditions: {
        applicableServices: ["all"],
        maxUses: 500,
        currentUses: 89
      },
      badge: "2X POINTS",
      badgeColor: "bg-purple-500",
      ctaText: "Book Weekend",
      ctaLink: "/client-portal/appointments/book",
      createdAt: new Date('2025-02-10'),
      updatedAt: new Date('2025-02-10')
    },
    {
      id: "new-client-bonus",
      title: "New Client Welcome",
      description: "First time at Vanity Hub? Enjoy 30% off your first service plus 100 bonus loyalty points to get you started!",
      type: "promotion",
      discountType: "percentage",
      discountValue: 30,
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2025-12-31'),
      isActive: true,
      conditions: {
        minAmount: 40,
        maxUses: 200,
        currentUses: 45
      },
      badge: "NEW CLIENT",
      badgeColor: "bg-green-500",
      ctaText: "Book First Visit",
      ctaLink: "/client-portal/appointments/book",
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    },
    {
      id: "birthday-month-special",
      title: "Birthday Month Celebration",
      description: "It's your special month! Enjoy 40% off any service during your birthday month. Because you deserve to be pampered!",
      type: "loyalty",
      discountType: "percentage",
      discountValue: 40,
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2025-12-31'),
      isActive: true,
      conditions: {
        minAmount: 30,
        tierRequirement: "Bronze"
      },
      badge: "BIRTHDAY",
      badgeColor: "bg-pink-500",
      ctaText: "Celebrate",
      ctaLink: "/client-portal/appointments/book",
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    }
  ]

  private getData(): SpecialOffer[] {
    if (typeof window === 'undefined') {
      return this.defaultOffers
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((offer: any) => ({
          ...offer,
          validFrom: new Date(offer.validFrom),
          validTo: new Date(offer.validTo),
          createdAt: new Date(offer.createdAt),
          updatedAt: new Date(offer.updatedAt)
        }))
      }
    } catch (error) {
      console.error('Error loading special offers:', error)
    }

    return this.defaultOffers
  }

  private saveData(offers: SpecialOffer[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(offers))
    } catch (error) {
      console.error('Error saving special offers:', error)
    }
  }

  getOffers(): SpecialOffer[] {
    return this.getData()
  }

  getActiveOffers(): SpecialOffer[] {
    const now = new Date()
    return this.getData().filter(offer => 
      offer.isActive && 
      offer.validFrom <= now && 
      offer.validTo >= now
    )
  }

  getOffersByType(type: SpecialOffer['type']): SpecialOffer[] {
    return this.getData().filter(offer => offer.type === type)
  }

  getOfferById(id: string): SpecialOffer | undefined {
    return this.getData().find(offer => offer.id === id)
  }

  addOffer(offer: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>): SpecialOffer {
    const offers = this.getData()
    const newOffer: SpecialOffer = {
      ...offer,
      id: `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    offers.push(newOffer)
    this.saveData(offers)
    return newOffer
  }

  updateOffer(id: string, updates: Partial<SpecialOffer>): SpecialOffer | null {
    const offers = this.getData()
    const index = offers.findIndex(offer => offer.id === id)
    
    if (index === -1) return null

    offers[index] = {
      ...offers[index],
      ...updates,
      updatedAt: new Date()
    }
    
    this.saveData(offers)
    return offers[index]
  }

  deleteOffer(id: string): boolean {
    const offers = this.getData()
    const filteredOffers = offers.filter(offer => offer.id !== id)
    
    if (filteredOffers.length === offers.length) return false
    
    this.saveData(filteredOffers)
    return true
  }

  toggleOfferStatus(id: string): SpecialOffer | null {
    const offers = this.getData()
    const index = offers.findIndex(offer => offer.id === id)
    
    if (index === -1) return null

    offers[index].isActive = !offers[index].isActive
    offers[index].updatedAt = new Date()
    
    this.saveData(offers)
    return offers[index]
  }

  incrementOfferUsage(id: string): SpecialOffer | null {
    const offers = this.getData()
    const index = offers.findIndex(offer => offer.id === id)
    
    if (index === -1) return null

    if (offers[index].conditions) {
      offers[index].conditions!.currentUses = (offers[index].conditions!.currentUses || 0) + 1
      offers[index].updatedAt = new Date()
      this.saveData(offers)
    }
    
    return offers[index]
  }

  resetToDefaults(): void {
    this.saveData(this.defaultOffers)
  }
}

export const specialOffersStorage = new SpecialOffersStorage()

// React hook for special offers
export function useSpecialOffers() {
  const [offers, setOffers] = React.useState<SpecialOffer[]>([])
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(() => {
    setOffers(specialOffersStorage.getOffers())
    setLoading(false)
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return {
    offers,
    activeOffers: offers.filter(offer => {
      const now = new Date()
      return offer.isActive && offer.validFrom <= now && offer.validTo >= now
    }),
    loading,
    refresh,
    addOffer: (offer: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newOffer = specialOffersStorage.addOffer(offer)
      refresh()
      return newOffer
    },
    updateOffer: (id: string, updates: Partial<SpecialOffer>) => {
      const updated = specialOffersStorage.updateOffer(id, updates)
      refresh()
      return updated
    },
    deleteOffer: (id: string) => {
      const success = specialOffersStorage.deleteOffer(id)
      refresh()
      return success
    },
    toggleStatus: (id: string) => {
      const updated = specialOffersStorage.toggleOfferStatus(id)
      refresh()
      return updated
    }
  }
}

// Add React import for the hook
import React from 'react'
