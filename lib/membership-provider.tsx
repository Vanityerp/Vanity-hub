"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  Membership, 
  MembershipTier, 
  MembershipTransaction, 
  MembershipSettings,
  MembershipStatus,
  MembershipDuration,
  isMembershipActive,
  isMembershipExpiringSoon,
  calculateMembershipDiscount,
  getDurationInDays
} from './membership-types'
import { useAuth } from './auth-provider'
import { useTransactions } from './transaction-provider'
import { TransactionType, PaymentMethod, TransactionStatus, TransactionSource } from './transaction-types'

interface MembershipContextType {
  memberships: Membership[]
  membershipTiers: MembershipTier[]
  membershipTransactions: MembershipTransaction[]
  settings: MembershipSettings
  isLoading: boolean
  
  // Membership Management
  createMembership: (membership: Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Membership>
  updateMembership: (id: string, updates: Partial<Membership>) => Promise<void>
  cancelMembership: (id: string, reason: string) => Promise<void>
  renewMembership: (id: string, paymentMethod: PaymentMethod) => Promise<Membership>
  
  // Tier Management
  createTier: (tier: Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MembershipTier>
  updateTier: (id: string, updates: Partial<MembershipTier>) => Promise<void>
  deleteTier: (id: string) => Promise<void>
  
  // Membership Operations
  getMembershipByClient: (clientId: string) => Membership | null
  getActiveMembership: (clientId: string) => Membership | null
  calculateDiscount: (clientId: string, originalAmount: number) => { discount: number; finalAmount: number }
  checkMembershipBenefits: (clientId: string) => { hasActiveMembership: boolean; tier?: MembershipTier; membership?: Membership }
  
  // Settings
  updateSettings: (settings: Partial<MembershipSettings>) => Promise<void>
  
  // Utility functions
  refreshData: () => Promise<void>
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined)

const MEMBERSHIPS_KEY = 'vanity_memberships'
const TIERS_KEY = 'vanity_membership_tiers'
const TRANSACTIONS_KEY = 'vanity_membership_transactions'
const SETTINGS_KEY = 'vanity_membership_settings'

const defaultTiers: MembershipTier[] = [
  {
    id: 'tier_bronze',
    name: 'Bronze',
    description: 'Basic membership with essential benefits',
    price: 29.99,
    duration: MembershipDuration.MONTHLY,
    benefits: ['5% discount on all services', 'Priority booking', 'Birthday special'],
    discountPercentage: 5,
    includedServices: [],
    priorityBooking: true,
    freeServices: 0,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tier_silver',
    name: 'Silver',
    description: 'Enhanced membership with additional perks',
    price: 49.99,
    duration: MembershipDuration.MONTHLY,
    benefits: ['10% discount on all services', 'Priority booking', '1 free basic service', 'Birthday special'],
    discountPercentage: 10,
    includedServices: ['basic_manicure'],
    priorityBooking: true,
    freeServices: 1,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tier_gold',
    name: 'Gold',
    description: 'Premium membership with exclusive benefits',
    price: 79.99,
    duration: MembershipDuration.MONTHLY,
    benefits: ['15% discount on all services', 'Priority booking', '2 free services', 'Exclusive events', 'Birthday special'],
    discountPercentage: 15,
    maxDiscountAmount: 50,
    includedServices: ['basic_manicure', 'basic_facial'],
    priorityBooking: true,
    freeServices: 2,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const defaultSettings: MembershipSettings = {
  enabled: true,
  allowAutoRenewal: true,
  autoRenewalDaysBefore: 7,
  gracePeriodDays: 3,
  prorationEnabled: true,
  upgradePolicy: 'immediate',
  downgradePolicy: 'next_cycle',
  cancellationPolicy: 'end_of_cycle',
  refundPolicy: 'No refunds for membership fees. Cancellations take effect at the end of the current billing cycle.',
  termsAndConditions: 'Membership terms and conditions apply. Benefits are non-transferable.',
  emailNotifications: {
    welcome: true,
    renewal: true,
    expiration: true,
    cancellation: true
  }
}

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>(defaultTiers)
  const [membershipTransactions, setMembershipTransactions] = useState<MembershipTransaction[]>([])
  const [settings, setSettings] = useState<MembershipSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  
  const { user, currentLocation } = useAuth()
  const { addTransaction } = useTransactions()

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedMemberships = localStorage.getItem(MEMBERSHIPS_KEY)
        const storedTiers = localStorage.getItem(TIERS_KEY)
        const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY)
        const storedSettings = localStorage.getItem(SETTINGS_KEY)

        if (storedMemberships) {
          setMemberships(JSON.parse(storedMemberships))
        }
        
        if (storedTiers) {
          setMembershipTiers(JSON.parse(storedTiers))
        }
        
        if (storedTransactions) {
          setMembershipTransactions(JSON.parse(storedTransactions))
        }
        
        if (storedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) })
        }
      } catch (error) {
        console.error('Error loading membership data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Save data to localStorage
  const saveMemberships = (membershipList: Membership[]) => {
    localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(membershipList))
    setMemberships(membershipList)
  }

  const saveTiers = (tierList: MembershipTier[]) => {
    localStorage.setItem(TIERS_KEY, JSON.stringify(tierList))
    setMembershipTiers(tierList)
  }

  const saveTransactions = (transactionList: MembershipTransaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactionList))
    setMembershipTransactions(transactionList)
  }

  const saveSettings = (newSettings: MembershipSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    setSettings(newSettings)
  }

  // Membership Management Functions
  const createMembership = async (membershipData: Omit<Membership, 'id' | 'createdAt' | 'updatedAt'>): Promise<Membership> => {
    const newMembership: Membership = {
      ...membershipData,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedMemberships = [...memberships, newMembership]
    saveMemberships(updatedMemberships)

    // Create transaction for membership purchase
    if (user) {
      const transaction = await addTransaction({
        date: new Date(),
        type: TransactionType.MEMBERSHIP_SALE,
        category: 'Membership Sale',
        description: `Membership purchase - ${newMembership.tierName}`,
        amount: newMembership.price,
        paymentMethod: PaymentMethod.CREDIT_CARD, // This would be determined by actual payment
        status: TransactionStatus.COMPLETED,
        location: newMembership.location,
        source: TransactionSource.POS,
        clientId: newMembership.clientId,
        clientName: newMembership.clientName,
        staffId: user.id,
        staffName: user.name,
        reference: {
          type: 'membership',
          id: newMembership.id
        },
        metadata: {
          membershipTier: newMembership.tierName,
          membershipDuration: membershipTiers.find(t => t.id === newMembership.tierId)?.duration
        }
      })

      // Update membership with transaction ID
      newMembership.purchaseTransactionId = transaction.id
      const finalMemberships = updatedMemberships.map(m => 
        m.id === newMembership.id ? newMembership : m
      )
      saveMemberships(finalMemberships)
    }

    return newMembership
  }

  const updateMembership = async (id: string, updates: Partial<Membership>): Promise<void> => {
    const updatedMemberships = memberships.map(membership => 
      membership.id === id 
        ? { ...membership, ...updates, updatedAt: new Date() }
        : membership
    )
    saveMemberships(updatedMemberships)
  }

  const cancelMembership = async (id: string, reason: string): Promise<void> => {
    const membership = memberships.find(m => m.id === id)
    if (!membership) {
      throw new Error('Membership not found')
    }

    const cancelDate = settings.cancellationPolicy === 'immediate' ? new Date() : new Date(membership.endDate)
    
    await updateMembership(id, {
      status: MembershipStatus.CANCELLED,
      autoRenew: false,
      notes: `${membership.notes || ''}\nCancelled: ${reason}`.trim()
    })

    // Create transaction record
    const transaction: MembershipTransaction = {
      id: `mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      membershipId: id,
      clientId: membership.clientId,
      clientName: membership.clientName,
      type: 'cancellation',
      toTierId: membership.tierId,
      toTierName: membership.tierName,
      amount: 0,
      staffId: user?.id || 'system',
      staffName: user?.name || 'System',
      location: currentLocation || membership.location,
      notes: reason,
      createdAt: new Date()
    }

    const updatedTransactions = [...membershipTransactions, transaction]
    saveTransactions(updatedTransactions)
  }

  const renewMembership = async (id: string, paymentMethod: PaymentMethod): Promise<Membership> => {
    const membership = memberships.find(m => m.id === id)
    if (!membership) {
      throw new Error('Membership not found')
    }

    const tier = membershipTiers.find(t => t.id === membership.tierId)
    if (!tier) {
      throw new Error('Membership tier not found')
    }

    const newEndDate = new Date(membership.endDate)
    newEndDate.setDate(newEndDate.getDate() + getDurationInDays(tier.duration))

    await updateMembership(id, {
      status: MembershipStatus.ACTIVE,
      endDate: newEndDate
    })

    // Create renewal transaction
    if (user) {
      const transaction = await addTransaction({
        date: new Date(),
        type: TransactionType.MEMBERSHIP_RENEWAL,
        category: 'Membership Renewal',
        description: `Membership renewal - ${membership.tierName}`,
        amount: membership.price,
        paymentMethod,
        status: TransactionStatus.COMPLETED,
        location: currentLocation || membership.location,
        source: TransactionSource.POS,
        clientId: membership.clientId,
        clientName: membership.clientName,
        staffId: user.id,
        staffName: user.name,
        reference: {
          type: 'membership_renewal',
          id: membership.id
        }
      })

      await updateMembership(id, {
        renewalTransactionId: transaction.id
      })
    }

    return memberships.find(m => m.id === id)!
  }

  // Tier Management Functions
  const createTier = async (tierData: Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>): Promise<MembershipTier> => {
    const newTier: MembershipTier = {
      ...tierData,
      id: `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedTiers = [...membershipTiers, newTier]
    saveTiers(updatedTiers)

    return newTier
  }

  const updateTier = async (id: string, updates: Partial<MembershipTier>): Promise<void> => {
    const updatedTiers = membershipTiers.map(tier => 
      tier.id === id 
        ? { ...tier, ...updates, updatedAt: new Date() }
        : tier
    )
    saveTiers(updatedTiers)
  }

  const deleteTier = async (id: string): Promise<void> => {
    // Check if tier is in use
    const tierInUse = memberships.some(m => m.tierId === id && m.status === MembershipStatus.ACTIVE)
    if (tierInUse) {
      throw new Error('Cannot delete tier that is currently in use by active memberships')
    }

    const updatedTiers = membershipTiers.filter(tier => tier.id !== id)
    saveTiers(updatedTiers)
  }

  // Membership Operations
  const getMembershipByClient = (clientId: string): Membership | null => {
    return memberships.find(m => m.clientId === clientId) || null
  }

  const getActiveMembership = (clientId: string): Membership | null => {
    return memberships.find(m => m.clientId === clientId && isMembershipActive(m)) || null
  }

  const calculateDiscount = (clientId: string, originalAmount: number): { discount: number; finalAmount: number } => {
    const activeMembership = getActiveMembership(clientId)
    if (!activeMembership) {
      return { discount: 0, finalAmount: originalAmount }
    }

    const tier = membershipTiers.find(t => t.id === activeMembership.tierId)
    if (!tier) {
      return { discount: 0, finalAmount: originalAmount }
    }

    const discount = calculateMembershipDiscount(originalAmount, tier.discountPercentage, tier.maxDiscountAmount)
    return { discount, finalAmount: originalAmount - discount }
  }

  const checkMembershipBenefits = (clientId: string): { hasActiveMembership: boolean; tier?: MembershipTier; membership?: Membership } => {
    const activeMembership = getActiveMembership(clientId)
    if (!activeMembership) {
      return { hasActiveMembership: false }
    }

    const tier = membershipTiers.find(t => t.id === activeMembership.tierId)
    return { 
      hasActiveMembership: true, 
      tier, 
      membership: activeMembership 
    }
  }

  const updateSettings = async (newSettings: Partial<MembershipSettings>): Promise<void> => {
    const updatedSettings = { ...settings, ...newSettings }
    saveSettings(updatedSettings)
  }

  const refreshData = async (): Promise<void> => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const value: MembershipContextType = {
    memberships,
    membershipTiers,
    membershipTransactions,
    settings,
    isLoading,
    createMembership,
    updateMembership,
    cancelMembership,
    renewMembership,
    createTier,
    updateTier,
    deleteTier,
    getMembershipByClient,
    getActiveMembership,
    calculateDiscount,
    checkMembershipBenefits,
    updateSettings,
    refreshData
  }

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  )
}

export function useMemberships() {
  const context = useContext(MembershipContext)
  if (context === undefined) {
    throw new Error('useMemberships must be used within a MembershipProvider')
  }
  return context
}
