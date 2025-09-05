"use client"

import { z } from "zod"

/**
 * Membership Status Enum
 */
export enum MembershipStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
  PENDING = "pending"
}

/**
 * Membership Duration Enum
 */
export enum MembershipDuration {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMI_ANNUAL = "semi_annual",
  ANNUAL = "annual"
}

/**
 * Membership Tier Interface
 */
export interface MembershipTier {
  id: string
  name: string
  description: string
  price: number
  duration: MembershipDuration
  benefits: string[]
  discountPercentage: number
  maxDiscountAmount?: number
  includedServices: string[]
  priorityBooking: boolean
  freeServices: number
  isActive: boolean
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Membership Interface
 */
export interface Membership {
  id: string
  clientId: string
  clientName: string
  tierId: string
  tierName: string
  status: MembershipStatus
  startDate: Date | string
  endDate: Date | string
  autoRenew: boolean
  price: number
  discountPercentage: number
  usedFreeServices: number
  totalFreeServices: number
  purchaseTransactionId?: string
  renewalTransactionId?: string
  location: string
  notes?: string
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Membership Transaction Interface
 */
export interface MembershipTransaction {
  id: string
  membershipId: string
  clientId: string
  clientName: string
  type: "purchase" | "renewal" | "upgrade" | "downgrade" | "cancellation"
  fromTierId?: string
  fromTierName?: string
  toTierId: string
  toTierName: string
  amount: number
  transactionId?: string
  staffId: string
  staffName: string
  location: string
  notes?: string
  createdAt: Date | string
}

/**
 * Membership Settings Interface
 */
export interface MembershipSettings {
  enabled: boolean
  allowAutoRenewal: boolean
  autoRenewalDaysBefore: number
  gracePeriodDays: number
  prorationEnabled: boolean
  upgradePolicy: "immediate" | "next_cycle"
  downgradePolicy: "immediate" | "next_cycle"
  cancellationPolicy: "immediate" | "end_of_cycle"
  refundPolicy: string
  termsAndConditions: string
  emailNotifications: {
    welcome: boolean
    renewal: boolean
    expiration: boolean
    cancellation: boolean
  }
}

/**
 * Zod Schemas for Validation
 */
export const membershipTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tier name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be non-negative"),
  duration: z.nativeEnum(MembershipDuration),
  benefits: z.array(z.string()),
  discountPercentage: z.number().min(0).max(100, "Discount must be between 0 and 100"),
  maxDiscountAmount: z.number().min(0).optional(),
  includedServices: z.array(z.string()),
  priorityBooking: z.boolean(),
  freeServices: z.number().min(0, "Free services must be non-negative"),
  isActive: z.boolean(),
  sortOrder: z.number().min(0),
  createdAt: z.union([z.date(), z.string().datetime()]).optional(),
  updatedAt: z.union([z.date(), z.string().datetime()]).optional()
})

export const membershipSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  tierId: z.string().min(1, "Tier ID is required"),
  tierName: z.string().min(1, "Tier name is required"),
  status: z.nativeEnum(MembershipStatus),
  startDate: z.union([z.date(), z.string().datetime()]),
  endDate: z.union([z.date(), z.string().datetime()]),
  autoRenew: z.boolean(),
  price: z.number().min(0, "Price must be non-negative"),
  discountPercentage: z.number().min(0).max(100),
  usedFreeServices: z.number().min(0),
  totalFreeServices: z.number().min(0),
  purchaseTransactionId: z.string().optional(),
  renewalTransactionId: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  createdAt: z.union([z.date(), z.string().datetime()]).optional(),
  updatedAt: z.union([z.date(), z.string().datetime()]).optional()
})

export const membershipSettingsSchema = z.object({
  enabled: z.boolean(),
  allowAutoRenewal: z.boolean(),
  autoRenewalDaysBefore: z.number().min(1),
  gracePeriodDays: z.number().min(0),
  prorationEnabled: z.boolean(),
  upgradePolicy: z.enum(["immediate", "next_cycle"]),
  downgradePolicy: z.enum(["immediate", "next_cycle"]),
  cancellationPolicy: z.enum(["immediate", "end_of_cycle"]),
  refundPolicy: z.string(),
  termsAndConditions: z.string(),
  emailNotifications: z.object({
    welcome: z.boolean(),
    renewal: z.boolean(),
    expiration: z.boolean(),
    cancellation: z.boolean()
  })
})

/**
 * Type exports for convenience
 */
export type MembershipTierFormData = z.infer<typeof membershipTierSchema>
export type MembershipFormData = z.infer<typeof membershipSchema>
export type MembershipSettingsFormData = z.infer<typeof membershipSettingsSchema>

/**
 * Helper functions
 */
export function isMembershipActive(membership: Membership): boolean {
  const now = new Date()
  const endDate = new Date(membership.endDate)
  return membership.status === MembershipStatus.ACTIVE && endDate > now
}

export function isMembershipExpiringSoon(membership: Membership, daysBefore: number = 30): boolean {
  const now = new Date()
  const endDate = new Date(membership.endDate)
  const warningDate = new Date(endDate.getTime() - (daysBefore * 24 * 60 * 60 * 1000))
  return membership.status === MembershipStatus.ACTIVE && now >= warningDate && now < endDate
}

export function calculateMembershipDiscount(
  originalAmount: number, 
  discountPercentage: number, 
  maxDiscountAmount?: number
): number {
  const discountAmount = originalAmount * (discountPercentage / 100)
  if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
    return maxDiscountAmount
  }
  return discountAmount
}

export function getDurationInDays(duration: MembershipDuration): number {
  switch (duration) {
    case MembershipDuration.MONTHLY:
      return 30
    case MembershipDuration.QUARTERLY:
      return 90
    case MembershipDuration.SEMI_ANNUAL:
      return 180
    case MembershipDuration.ANNUAL:
      return 365
    default:
      return 30
  }
}
