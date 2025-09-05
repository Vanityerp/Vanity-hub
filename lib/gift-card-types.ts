"use client"

import { z } from "zod"

/**
 * Gift Card Status Enum
 */
export enum GiftCardStatus {
  ACTIVE = "active",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
  CANCELLED = "cancelled"
}

/**
 * Gift Card Type Enum
 */
export enum GiftCardType {
  PHYSICAL = "physical",
  DIGITAL = "digital"
}

/**
 * Gift Card Interface
 */
export interface GiftCard {
  id: string
  code: string
  type: GiftCardType
  originalAmount: number
  currentBalance: number
  status: GiftCardStatus
  issuedDate: Date | string
  expirationDate?: Date | string
  issuedBy: string // Staff ID
  issuedByName: string // Staff name
  issuedTo?: string // Client ID
  issuedToName?: string // Client name
  purchaserEmail?: string
  purchaserPhone?: string
  message?: string
  location: string
  transactionId?: string // Original purchase transaction
  createdAt: Date | string
  updatedAt: Date | string
}

/**
 * Gift Card Transaction Interface
 */
export interface GiftCardTransaction {
  id: string
  giftCardId: string
  giftCardCode: string
  type: "redemption" | "refund" | "adjustment"
  amount: number
  balanceBefore: number
  balanceAfter: number
  transactionId?: string // Related transaction ID
  staffId: string
  staffName: string
  clientId?: string
  clientName?: string
  location: string
  notes?: string
  createdAt: Date | string
}

/**
 * Gift Card Settings Interface
 */
export interface GiftCardSettings {
  enabled: boolean
  allowCustomAmounts: boolean
  predefinedAmounts: number[]
  minAmount: number
  maxAmount: number
  defaultExpirationMonths: number
  allowNoExpiration: boolean
  requirePurchaserInfo: boolean
  allowDigitalDelivery: boolean
  emailTemplate: string
  termsAndConditions: string
}

/**
 * Zod Schemas for Validation
 */
export const giftCardSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(6, "Gift card code must be at least 6 characters"),
  type: z.nativeEnum(GiftCardType),
  originalAmount: z.number().positive("Amount must be positive"),
  currentBalance: z.number().min(0, "Balance cannot be negative"),
  status: z.nativeEnum(GiftCardStatus),
  issuedDate: z.union([z.date(), z.string().datetime()]),
  expirationDate: z.union([z.date(), z.string().datetime()]).optional(),
  issuedBy: z.string().min(1, "Issued by is required"),
  issuedByName: z.string().min(1, "Issued by name is required"),
  issuedTo: z.string().optional(),
  issuedToName: z.string().optional(),
  purchaserEmail: z.string().email().optional(),
  purchaserPhone: z.string().optional(),
  message: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  transactionId: z.string().optional(),
  createdAt: z.union([z.date(), z.string().datetime()]).optional(),
  updatedAt: z.union([z.date(), z.string().datetime()]).optional()
})

export const giftCardTransactionSchema = z.object({
  id: z.string().optional(),
  giftCardId: z.string().min(1, "Gift card ID is required"),
  giftCardCode: z.string().min(1, "Gift card code is required"),
  type: z.enum(["redemption", "refund", "adjustment"]),
  amount: z.number().positive("Amount must be positive"),
  balanceBefore: z.number().min(0, "Balance before cannot be negative"),
  balanceAfter: z.number().min(0, "Balance after cannot be negative"),
  transactionId: z.string().optional(),
  staffId: z.string().min(1, "Staff ID is required"),
  staffName: z.string().min(1, "Staff name is required"),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  createdAt: z.union([z.date(), z.string().datetime()]).optional()
})

export const giftCardSettingsSchema = z.object({
  enabled: z.boolean(),
  allowCustomAmounts: z.boolean(),
  predefinedAmounts: z.array(z.number().positive()),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive(),
  defaultExpirationMonths: z.number().min(1),
  allowNoExpiration: z.boolean(),
  requirePurchaserInfo: z.boolean(),
  allowDigitalDelivery: z.boolean(),
  emailTemplate: z.string(),
  termsAndConditions: z.string()
})

/**
 * Type exports for convenience
 */
export type GiftCardFormData = z.infer<typeof giftCardSchema>
export type GiftCardTransactionFormData = z.infer<typeof giftCardTransactionSchema>
export type GiftCardSettingsFormData = z.infer<typeof giftCardSettingsSchema>

/**
 * Helper functions
 */
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result.match(/.{1,4}/g)?.join('-') || result
}

export function isGiftCardExpired(giftCard: GiftCard): boolean {
  if (!giftCard.expirationDate) return false
  const expDate = new Date(giftCard.expirationDate)
  return expDate < new Date()
}

export function isGiftCardValid(giftCard: GiftCard): boolean {
  return giftCard.status === GiftCardStatus.ACTIVE && 
         giftCard.currentBalance > 0 && 
         !isGiftCardExpired(giftCard)
}
