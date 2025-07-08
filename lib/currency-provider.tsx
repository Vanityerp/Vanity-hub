"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { currencies, Currency } from "@/lib/currency-data"
import { detectUserCurrency, getUserCurrency, setUserCurrency } from "@/lib/geolocation"
import { CURRENCY_CACHE_TAGS } from "@/lib/next-cache"
import { revalidateCurrencyCache } from "@/lib/cache-actions"

interface CurrencyContextType {
  /** The currently selected currency code (e.g., "USD", "EUR") */
  currencyCode: string;

  /** The full currency object with details like symbol, name, etc. */
  currency: Currency;

  /** Function to change the current currency */
  setCurrency: (currencyCode: string) => void;

  /** Format a number as a monetary value with the current currency */
  formatCurrency: (amount: number) => string;

  /** Is the currency context still loading? */
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<string>(getUserCurrency())
  const [isLoading, setIsLoading] = useState(true)

  // Initialize currency detection on first load
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Check if we already have a stored preference
        const storedCurrency = getUserCurrency()

        if (!storedCurrency) {
          // If no stored preference, set to QAR as default
          setCurrencyCode("QAR")
          setUserCurrency("QAR")
        } else {
          // Use the stored preference
          setCurrencyCode(storedCurrency)
        }
      } catch (error) {
        console.error("Failed to detect currency:", error)
        // Fallback to QAR on error
        setCurrencyCode("QAR")
        setUserCurrency("QAR")
      } finally {
        setIsLoading(false)
      }
    }

    detectCurrency()
  }, [])

  // Enforce currency consistency across the application
  useEffect(() => {
    // Set a global CSS variable for currency symbol that can be used in CSS
    if (typeof document !== 'undefined') {
      const currencyObj = currencies[currencyCode] || currencies.QAR
      document.documentElement.style.setProperty('--currency-symbol', currencyObj.symbol)

      // Dispatch a custom event that components can listen for
      const event = new CustomEvent('currency-changed', {
        detail: { currencyCode, currency: currencyObj }
      })
      document.dispatchEvent(event)
    }
  }, [currencyCode])

  // Get the current currency object
  const currency = currencies[currencyCode] || currencies.QAR

  // Function to update the currency with cache revalidation
  const setCurrency = useCallback(async (code: string) => {
    if (currencies[code]) {
      setCurrencyCode(code)
      setUserCurrency(code)

      // Temporarily disable currency cache revalidation to prevent infinite loops
      // try {
      //   // Call the server action to revalidate the cache
      //   await revalidateCurrencyCache()

      //   // Dispatch a custom event for components that need to refresh data
      //   if (typeof document !== 'undefined') {
      //     const event = new CustomEvent('currency-cache-revalidated', {
      //       detail: { currencyCode: code }
      //     })
      //     document.dispatchEvent(event)
      //   }
      // } catch (error) {
      //   console.error('Failed to revalidate currency cache:', error)
      // }
    } else {
      console.error(`Invalid currency code: ${code}`)
    }
  }, [])

  // Format a number as a monetary value with the current currency
  const formatCurrency = (amount: number): string => {
    if (!currency) return `QAR ${amount.toFixed(2)}`

    const { symbol, decimalDigits, code } = currency

    // Use the browser's Intl.NumberFormat for better localization
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: decimalDigits,
        maximumFractionDigits: decimalDigits,
      }).format(amount)
    } catch (error) {
      // Fallback to simple formatting if Intl.NumberFormat fails
      console.error("Error formatting currency:", error)
      return `${symbol} ${amount.toFixed(decimalDigits)}`
    }
  }

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currency,
        setCurrency,
        formatCurrency,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

// Hook to use the currency context
export function useCurrency() {
  const context = useContext(CurrencyContext)

  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }

  return context
}

// Utility function to format currency without using the context
// Useful for server components or places where the context isn't available
export function formatCurrencyStatic(amount: number, currencyCode: string = "QAR"): string {
  const currency = currencies[currencyCode] || currencies.QAR
  const { symbol, decimalDigits, code } = currency

  // Use the browser's Intl.NumberFormat for better localization
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    }).format(amount)
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    console.error("Error formatting currency:", error)
    return `${symbol} ${amount.toFixed(decimalDigits)}`
  }
}

// Utility hook to enforce currency consistency in components
export function useCurrencyEnforcer() {
  const { currencyCode, currency, formatCurrency } = useCurrency()

  useEffect(() => {
    // Listen for currency changes from other components
    const handleCurrencyChange = (event: Event) => {
      // You could update local state or re-render components here if needed
      console.log('Currency changed:', (event as CustomEvent).detail)
    }

    document.addEventListener('currency-changed', handleCurrencyChange)

    return () => {
      document.removeEventListener('currency-changed', handleCurrencyChange)
    }
  }, [])

  return { currencyCode, currency, formatCurrency }
}
