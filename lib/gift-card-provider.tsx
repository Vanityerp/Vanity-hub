"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  GiftCard,
  GiftCardTransaction,
  GiftCardSettings,
  GiftCardStatus,
  GiftCardType,
  generateGiftCardCode,
  isGiftCardValid
} from './gift-card-types'
import { useAuth } from './auth-provider'
import { useTransactions } from './transaction-provider'
import { TransactionType, PaymentMethod, TransactionStatus, TransactionSource } from './transaction-types'
import { SettingsStorage } from './settings-storage'

interface GiftCardContextType {
  giftCards: GiftCard[]
  giftCardTransactions: GiftCardTransaction[]
  settings: GiftCardSettings
  isLoading: boolean
  
  // Gift Card Management
  createGiftCard: (giftCard: Omit<GiftCard, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<GiftCard>
  updateGiftCard: (id: string, updates: Partial<GiftCard>) => Promise<void>
  deleteGiftCard: (id: string) => Promise<void>
  getGiftCardByCode: (code: string) => GiftCard | null
  validateGiftCard: (code: string) => { valid: boolean; giftCard?: GiftCard; message: string }
  
  // Gift Card Transactions
  redeemGiftCard: (code: string, amount: number, transactionId?: string) => Promise<GiftCardTransaction>
  refundGiftCard: (giftCardId: string, amount: number, reason: string) => Promise<GiftCardTransaction>
  adjustGiftCardBalance: (giftCardId: string, amount: number, reason: string) => Promise<GiftCardTransaction>
  
  // Settings
  updateSettings: (settings: Partial<GiftCardSettings>) => Promise<void>
  
  // Utility functions
  refreshData: () => Promise<void>
}

const GiftCardContext = createContext<GiftCardContextType | undefined>(undefined)

const STORAGE_KEY = 'vanity_gift_cards'
const TRANSACTIONS_KEY = 'vanity_gift_card_transactions'
const SETTINGS_KEY = 'vanity_gift_card_settings'

const defaultSettings: GiftCardSettings = {
  enabled: true,
  allowCustomAmounts: true,
  predefinedAmounts: [50, 100, 200, 500, 1000],
  minAmount: 10,
  maxAmount: 1000,
  defaultExpirationMonths: 12,
  allowNoExpiration: false,
  requirePurchaserInfo: true,
  allowDigitalDelivery: true,
  emailTemplate: `Dear {customerName},

Thank you for your gift card purchase! Here are the details:

Gift Card Code: {giftCardCode}
Amount: {amount}
Expires: {expirationDate}

{message}

Terms and conditions apply.

Best regards,
{businessName}`,
  termsAndConditions: 'Gift cards are non-refundable and cannot be exchanged for cash. Valid for services and products only.'
}

export function GiftCardProvider({ children }: { children: React.ReactNode }) {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [giftCardTransactions, setGiftCardTransactions] = useState<GiftCardTransaction[]>([])
  const [settings, setSettings] = useState<GiftCardSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  
  const { user, currentLocation } = useAuth()
  const { addTransaction } = useTransactions()

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedGiftCards = localStorage.getItem(STORAGE_KEY)
        const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY)

        if (storedGiftCards) {
          setGiftCards(JSON.parse(storedGiftCards))
        }

        if (storedTransactions) {
          setGiftCardTransactions(JSON.parse(storedTransactions))
        }

        // Load settings from the unified settings storage
        const giftCardMembershipSettings = SettingsStorage.getGiftCardMembershipSettings()
        const giftCardSettings: GiftCardSettings = {
          enabled: giftCardMembershipSettings.giftCards.enabled,
          allowCustomAmounts: giftCardMembershipSettings.giftCards.allowCustomAmounts,
          predefinedAmounts: giftCardMembershipSettings.giftCards.predefinedAmounts,
          minAmount: giftCardMembershipSettings.giftCards.minAmount,
          maxAmount: giftCardMembershipSettings.giftCards.maxAmount,
          defaultExpirationMonths: giftCardMembershipSettings.giftCards.defaultExpirationMonths,
          allowNoExpiration: giftCardMembershipSettings.giftCards.allowNoExpiration,
          requirePurchaserInfo: giftCardMembershipSettings.giftCards.requirePurchaserInfo,
          allowDigitalDelivery: giftCardMembershipSettings.giftCards.allowDigitalDelivery,
          emailTemplate: giftCardMembershipSettings.giftCards.emailTemplate,
          termsAndConditions: giftCardMembershipSettings.giftCards.termsAndConditions
        }
        setSettings(giftCardSettings)
      } catch (error) {
        console.error('Error loading gift card data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Listen for settings changes from the settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vanity_gift_card_membership_settings') {
        // Reload settings when they change
        try {
          const giftCardMembershipSettings = SettingsStorage.getGiftCardMembershipSettings()
          const giftCardSettings: GiftCardSettings = {
            enabled: giftCardMembershipSettings.giftCards.enabled,
            allowCustomAmounts: giftCardMembershipSettings.giftCards.allowCustomAmounts,
            predefinedAmounts: giftCardMembershipSettings.giftCards.predefinedAmounts,
            minAmount: giftCardMembershipSettings.giftCards.minAmount,
            maxAmount: giftCardMembershipSettings.giftCards.maxAmount,
            defaultExpirationMonths: giftCardMembershipSettings.giftCards.defaultExpirationMonths,
            allowNoExpiration: giftCardMembershipSettings.giftCards.allowNoExpiration,
            requirePurchaserInfo: giftCardMembershipSettings.giftCards.requirePurchaserInfo,
            allowDigitalDelivery: giftCardMembershipSettings.giftCards.allowDigitalDelivery,
            emailTemplate: giftCardMembershipSettings.giftCards.emailTemplate,
            termsAndConditions: giftCardMembershipSettings.giftCards.termsAndConditions
          }
          setSettings(giftCardSettings)
          console.log('🔄 Gift card settings updated from settings page:', giftCardSettings.predefinedAmounts)
        } catch (error) {
          console.error('Error reloading gift card settings:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Save data to localStorage
  const saveGiftCards = (cards: GiftCard[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
    setGiftCards(cards)
  }

  const saveTransactions = (transactions: GiftCardTransaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
    setGiftCardTransactions(transactions)
  }



  // Gift Card Management Functions
  const createGiftCard = async (giftCardData: Omit<GiftCard, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<GiftCard> => {
    const newGiftCard: GiftCard = {
      ...giftCardData,
      id: `gc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: generateGiftCardCode(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedCards = [...giftCards, newGiftCard]
    saveGiftCards(updatedCards)

    // Create transaction for gift card sale
    if (user) {
      await addTransaction({
        date: new Date(),
        type: TransactionType.GIFT_CARD_SALE,
        category: 'Gift Card Sale',
        description: `Gift card sale - ${newGiftCard.code}`,
        amount: newGiftCard.originalAmount,
        paymentMethod: PaymentMethod.CREDIT_CARD, // This would be determined by actual payment
        status: TransactionStatus.COMPLETED,
        location: newGiftCard.location,
        source: TransactionSource.POS,
        clientId: newGiftCard.issuedTo,
        clientName: newGiftCard.issuedToName,
        staffId: newGiftCard.issuedBy,
        staffName: newGiftCard.issuedByName,
        reference: {
          type: 'gift_card',
          id: newGiftCard.id
        },
        metadata: {
          giftCardCode: newGiftCard.code,
          giftCardType: newGiftCard.type
        }
      })
    }

    return newGiftCard
  }

  const updateGiftCard = async (id: string, updates: Partial<GiftCard>): Promise<void> => {
    const updatedCards = giftCards.map(card => 
      card.id === id 
        ? { ...card, ...updates, updatedAt: new Date() }
        : card
    )
    saveGiftCards(updatedCards)
  }

  const deleteGiftCard = async (id: string): Promise<void> => {
    const updatedCards = giftCards.filter(card => card.id !== id)
    saveGiftCards(updatedCards)
  }

  const getGiftCardByCode = (code: string): GiftCard | null => {
    return giftCards.find(card => card.code === code) || null
  }

  const validateGiftCard = (code: string): { valid: boolean; giftCard?: GiftCard; message: string } => {
    const giftCard = getGiftCardByCode(code)
    
    if (!giftCard) {
      return { valid: false, message: 'Gift card not found' }
    }
    
    if (!isGiftCardValid(giftCard)) {
      if (giftCard.status === GiftCardStatus.REDEEMED) {
        return { valid: false, giftCard, message: 'Gift card has been fully redeemed' }
      }
      if (giftCard.status === GiftCardStatus.EXPIRED) {
        return { valid: false, giftCard, message: 'Gift card has expired' }
      }
      if (giftCard.status === GiftCardStatus.CANCELLED) {
        return { valid: false, giftCard, message: 'Gift card has been cancelled' }
      }
      if (giftCard.currentBalance <= 0) {
        return { valid: false, giftCard, message: 'Gift card has no remaining balance' }
      }
    }
    
    return { valid: true, giftCard, message: 'Gift card is valid' }
  }

  // Gift Card Transaction Functions
  const redeemGiftCard = async (code: string, amount: number, transactionId?: string): Promise<GiftCardTransaction> => {
    const validation = validateGiftCard(code)
    if (!validation.valid || !validation.giftCard) {
      throw new Error(validation.message)
    }

    const giftCard = validation.giftCard
    if (amount > giftCard.currentBalance) {
      throw new Error('Redemption amount exceeds gift card balance')
    }

    const newBalance = giftCard.currentBalance - amount
    const newStatus = newBalance === 0 ? GiftCardStatus.REDEEMED : GiftCardStatus.ACTIVE

    // Update gift card
    await updateGiftCard(giftCard.id, {
      currentBalance: newBalance,
      status: newStatus
    })

    // Create transaction record
    const transaction: GiftCardTransaction = {
      id: `gct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      giftCardId: giftCard.id,
      giftCardCode: giftCard.code,
      type: 'redemption',
      amount,
      balanceBefore: giftCard.currentBalance,
      balanceAfter: newBalance,
      transactionId,
      staffId: user?.id || 'system',
      staffName: user?.name || 'System',
      location: currentLocation || giftCard.location,
      createdAt: new Date()
    }

    const updatedTransactions = [...giftCardTransactions, transaction]
    saveTransactions(updatedTransactions)

    // Create accounting transaction for gift card redemption
    if (user && transactionId) {
      await addTransaction({
        date: new Date(),
        type: TransactionType.GIFT_CARD_REDEMPTION,
        category: 'Gift Card Redemption',
        description: `Gift card redemption - ${giftCard.code}`,
        amount: amount,
        paymentMethod: PaymentMethod.GIFT_CARD,
        status: TransactionStatus.COMPLETED,
        location: currentLocation || giftCard.location,
        source: TransactionSource.POS,
        staffId: user.id,
        staffName: user.name,
        reference: {
          type: 'gift_card_redemption',
          id: transaction.id
        },
        metadata: {
          giftCardCode: giftCard.code,
          originalTransactionId: transactionId,
          remainingBalance: newBalance
        }
      })
    }

    return transaction
  }

  const refundGiftCard = async (giftCardId: string, amount: number, reason: string): Promise<GiftCardTransaction> => {
    const giftCard = giftCards.find(card => card.id === giftCardId)
    if (!giftCard) {
      throw new Error('Gift card not found')
    }

    const newBalance = giftCard.currentBalance + amount
    
    // Update gift card
    await updateGiftCard(giftCard.id, {
      currentBalance: newBalance,
      status: GiftCardStatus.ACTIVE
    })

    // Create transaction record
    const transaction: GiftCardTransaction = {
      id: `gct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      giftCardId: giftCard.id,
      giftCardCode: giftCard.code,
      type: 'refund',
      amount,
      balanceBefore: giftCard.currentBalance,
      balanceAfter: newBalance,
      staffId: user?.id || 'system',
      staffName: user?.name || 'System',
      location: currentLocation || giftCard.location,
      notes: reason,
      createdAt: new Date()
    }

    const updatedTransactions = [...giftCardTransactions, transaction]
    saveTransactions(updatedTransactions)

    return transaction
  }

  const adjustGiftCardBalance = async (giftCardId: string, amount: number, reason: string): Promise<GiftCardTransaction> => {
    const giftCard = giftCards.find(card => card.id === giftCardId)
    if (!giftCard) {
      throw new Error('Gift card not found')
    }

    const newBalance = Math.max(0, giftCard.currentBalance + amount)
    
    // Update gift card
    await updateGiftCard(giftCard.id, {
      currentBalance: newBalance,
      status: newBalance > 0 ? GiftCardStatus.ACTIVE : GiftCardStatus.REDEEMED
    })

    // Create transaction record
    const transaction: GiftCardTransaction = {
      id: `gct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      giftCardId: giftCard.id,
      giftCardCode: giftCard.code,
      type: 'adjustment',
      amount: Math.abs(amount),
      balanceBefore: giftCard.currentBalance,
      balanceAfter: newBalance,
      staffId: user?.id || 'system',
      staffName: user?.name || 'System',
      location: currentLocation || giftCard.location,
      notes: reason,
      createdAt: new Date()
    }

    const updatedTransactions = [...giftCardTransactions, transaction]
    saveTransactions(updatedTransactions)

    return transaction
  }

  const updateSettings = async (newSettings: Partial<GiftCardSettings>): Promise<void> => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Update the unified settings storage
    const currentGiftCardMembershipSettings = SettingsStorage.getGiftCardMembershipSettings()
    const updatedGiftCardMembershipSettings = {
      ...currentGiftCardMembershipSettings,
      giftCards: {
        ...currentGiftCardMembershipSettings.giftCards,
        enabled: updatedSettings.enabled,
        allowCustomAmounts: updatedSettings.allowCustomAmounts,
        predefinedAmounts: updatedSettings.predefinedAmounts,
        minAmount: updatedSettings.minAmount,
        maxAmount: updatedSettings.maxAmount,
        defaultExpirationMonths: updatedSettings.defaultExpirationMonths,
        allowNoExpiration: updatedSettings.allowNoExpiration,
        requirePurchaserInfo: updatedSettings.requirePurchaserInfo,
        allowDigitalDelivery: updatedSettings.allowDigitalDelivery,
        emailTemplate: updatedSettings.emailTemplate,
        termsAndConditions: updatedSettings.termsAndConditions
      }
    }
    SettingsStorage.saveGiftCardMembershipSettings(updatedGiftCardMembershipSettings)
  }

  const refreshData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      // Reload settings from the unified settings storage
      const giftCardMembershipSettings = SettingsStorage.getGiftCardMembershipSettings()
      const giftCardSettings: GiftCardSettings = {
        enabled: giftCardMembershipSettings.giftCards.enabled,
        allowCustomAmounts: giftCardMembershipSettings.giftCards.allowCustomAmounts,
        predefinedAmounts: giftCardMembershipSettings.giftCards.predefinedAmounts,
        minAmount: giftCardMembershipSettings.giftCards.minAmount,
        maxAmount: giftCardMembershipSettings.giftCards.maxAmount,
        defaultExpirationMonths: giftCardMembershipSettings.giftCards.defaultExpirationMonths,
        allowNoExpiration: giftCardMembershipSettings.giftCards.allowNoExpiration,
        requirePurchaserInfo: giftCardMembershipSettings.giftCards.requirePurchaserInfo,
        allowDigitalDelivery: giftCardMembershipSettings.giftCards.allowDigitalDelivery,
        emailTemplate: giftCardMembershipSettings.giftCards.emailTemplate,
        termsAndConditions: giftCardMembershipSettings.giftCards.termsAndConditions
      }
      setSettings(giftCardSettings)
      console.log('🔄 Gift card settings refreshed:', giftCardSettings.predefinedAmounts)
    } catch (error) {
      console.error('Error refreshing gift card data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: GiftCardContextType = {
    giftCards,
    giftCardTransactions,
    settings,
    isLoading,
    createGiftCard,
    updateGiftCard,
    deleteGiftCard,
    getGiftCardByCode,
    validateGiftCard,
    redeemGiftCard,
    refundGiftCard,
    adjustGiftCardBalance,
    updateSettings,
    refreshData
  }

  return (
    <GiftCardContext.Provider value={value}>
      {children}
    </GiftCardContext.Provider>
  )
}

export function useGiftCards() {
  const context = useContext(GiftCardContext)
  if (context === undefined) {
    throw new Error('useGiftCards must be used within a GiftCardProvider')
  }
  return context
}
