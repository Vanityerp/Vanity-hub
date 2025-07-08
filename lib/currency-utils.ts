/**
 * Utility functions for currency handling across the application
 */

import { getUserCurrency } from "./geolocation"
import { currencies } from "./currency-data"

/**
 * Formats a monetary value using the application's currency settings
 * This is a standalone utility that doesn't require the React context
 * 
 * @param amount - The monetary amount to format
 * @param forceCurrencyCode - Optional currency code to override the user's preference
 * @returns Formatted currency string
 */
export function formatMonetaryValue(amount: number, forceCurrencyCode?: string): string {
  // Get the currency code from user preferences or use the forced one
  const currencyCode = forceCurrencyCode || getUserCurrency() || "USD"
  const currency = currencies[currencyCode] || currencies.USD
  
  try {
    // Use Intl.NumberFormat for consistent formatting
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimalDigits,
      maximumFractionDigits: currency.decimalDigits,
    }).format(amount)
  } catch (error) {
    // Fallback to simple formatting
    return `${currency.symbol} ${amount.toFixed(currency.decimalDigits)}`
  }
}

/**
 * Gets the currency symbol for the current or specified currency
 * 
 * @param currencyCode - Optional currency code to override the user's preference
 * @returns Currency symbol (e.g., "$", "€", etc.)
 */
export function getCurrencySymbol(currencyCode?: string): string {
  const code = currencyCode || getUserCurrency() || "USD"
  const currency = currencies[code] || currencies.USD
  return currency.symbol
}

/**
 * Converts an amount from one currency to another
 * Note: In a real application, this would use exchange rates from an API
 * 
 * @param amount - The monetary amount to convert
 * @param fromCurrency - The source currency code
 * @param toCurrency - The target currency code
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // This is a placeholder implementation
  // In a real app, you would use exchange rates from an API
  
  // For demonstration purposes, we'll use some fixed rates
  const rates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.75,
    JPY: 110.0,
    QAR: 3.64, // Qatari Riyal
    // Add more currencies as needed
  }
  
  // Convert to USD first (as base currency)
  const amountInUSD = fromCurrency === "USD" 
    ? amount 
    : amount / rates[fromCurrency]
  
  // Then convert from USD to target currency
  return toCurrency === "USD" 
    ? amountInUSD 
    : amountInUSD * rates[toCurrency]
}
