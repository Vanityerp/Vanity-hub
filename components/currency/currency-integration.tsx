"use client"

import { useEffect } from "react"
import { useCurrency } from "@/lib/currency-provider"
import { useToast } from "@/components/ui/use-toast"

/**
 * Currency Integration Component
 * This component ensures consistent currency display across the entire application
 * It monitors currency changes and updates all monetary displays accordingly
 */
export function CurrencyIntegration() {
  const { currencyCode, currency, formatCurrency } = useCurrency()
  const { toast } = useToast()

  // Monitor currency changes and update global styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Set CSS custom properties for currency display
      document.documentElement.style.setProperty('--currency-symbol', `"${currency.symbol}"`)
      document.documentElement.style.setProperty('--currency-code', `"${currency.code}"`)
      
      // Add currency class to body for CSS targeting
      document.body.classList.remove(...Array.from(document.body.classList).filter(c => c.startsWith('currency-')))
      document.body.classList.add(`currency-${currencyCode.toLowerCase()}`)
      
      // Dispatch global currency change event
      const event = new CustomEvent('currency-updated', {
        detail: { currencyCode, currency, formatCurrency }
      })
      document.dispatchEvent(event)
      
      console.log(`Currency Integration: Updated to ${currencyCode} (${currency.symbol})`)
    }
  }, [currencyCode, currency, formatCurrency])

  // Show toast notification when currency changes
  useEffect(() => {
    if (currencyCode && currency) {
      // Don't show toast on initial load
      const isInitialLoad = !document.body.classList.contains('currency-initialized')
      if (!isInitialLoad) {
        toast({
          title: "Currency Updated",
          description: `All prices are now displayed in ${currency.name} (${currency.symbol})`,
          duration: 3000,
        })
      }
      
      // Mark as initialized
      document.body.classList.add('currency-initialized')
    }
  }, [currencyCode, currency, toast])

  // This component doesn't render anything visible
  return null
}

/**
 * Enhanced Currency Display Component
 * Use this component to display monetary values with consistent formatting
 */
interface CurrencyDisplayProps {
  amount: number
  className?: string
  showCode?: boolean
  showSymbol?: boolean
  precision?: number
}

export function EnhancedCurrencyDisplay({ 
  amount, 
  className = "", 
  showCode = false, 
  showSymbol = true,
  precision 
}: CurrencyDisplayProps) {
  const { formatCurrency, currency } = useCurrency()
  
  // Format the amount with the current currency
  const formattedAmount = formatCurrency(amount)
  
  // Extract parts for custom display
  const numericAmount = amount.toFixed(precision ?? currency.decimalPlaces ?? 2)
  
  return (
    <span className={`currency-display ${className}`} data-currency={currency.code}>
      {showSymbol && <span className="currency-symbol">{currency.symbol}</span>}
      <span className="currency-amount">{numericAmount}</span>
      {showCode && <span className="currency-code">{currency.code}</span>}
    </span>
  )
}

/**
 * Currency Converter Hook
 * Use this hook to convert amounts between currencies (future enhancement)
 */
export function useCurrencyConverter() {
  const { currencyCode, formatCurrency } = useCurrency()
  
  const convertAmount = (amount: number, fromCurrency?: string, toCurrency?: string) => {
    // For now, just return the formatted amount in the current currency
    // In the future, this could integrate with exchange rate APIs
    return formatCurrency(amount)
  }
  
  const formatAmount = (amount: number, options?: {
    showSymbol?: boolean
    showCode?: boolean
    precision?: number
  }) => {
    const { showSymbol = true, showCode = false, precision } = options || {}
    const { currency } = useCurrency()
    
    const numericAmount = amount.toFixed(precision ?? currency.decimalPlaces ?? 2)
    
    let formatted = ""
    if (showSymbol) formatted += currency.symbol + " "
    formatted += numericAmount
    if (showCode) formatted += ` ${currency.code}`
    
    return formatted
  }
  
  return {
    convertAmount,
    formatAmount,
    currentCurrency: currencyCode
  }
}

/**
 * Currency Validation Utilities
 */
export const CurrencyUtils = {
  /**
   * Validate if an amount is a valid monetary value
   */
  isValidAmount: (amount: any): boolean => {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount >= 0
  },
  
  /**
   * Parse a string amount to a number
   */
  parseAmount: (amountString: string): number => {
    const cleaned = amountString.replace(/[^\d.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  },
  
  /**
   * Round amount to currency precision
   */
  roundToCurrency: (amount: number, decimalPlaces: number = 2): number => {
    return Math.round(amount * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  },
  
  /**
   * Calculate percentage of an amount
   */
  calculatePercentage: (amount: number, percentage: number): number => {
    return CurrencyUtils.roundToCurrency((amount * percentage) / 100)
  },
  
  /**
   * Add tax to an amount
   */
  addTax: (amount: number, taxRate: number): number => {
    return CurrencyUtils.roundToCurrency(amount + CurrencyUtils.calculatePercentage(amount, taxRate))
  },
  
  /**
   * Calculate discount on an amount
   */
  applyDiscount: (amount: number, discountPercentage: number): number => {
    return CurrencyUtils.roundToCurrency(amount - CurrencyUtils.calculatePercentage(amount, discountPercentage))
  }
}

/**
 * Global Currency Event Listeners
 * Components can use these to react to currency changes
 */
export const CurrencyEvents = {
  /**
   * Listen for currency changes
   */
  onCurrencyChange: (callback: (event: CustomEvent) => void) => {
    if (typeof document !== 'undefined') {
      document.addEventListener('currency-updated', callback as EventListener)
      
      // Return cleanup function
      return () => {
        document.removeEventListener('currency-updated', callback as EventListener)
      }
    }
    return () => {}
  },
  
  /**
   * Trigger a manual currency update
   */
  triggerCurrencyUpdate: () => {
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('currency-refresh')
      document.dispatchEvent(event)
    }
  }
}
