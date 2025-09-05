"use client"

import { currencies } from "./currency-data"
import { getUserCurrency } from "./geolocation"

/**
 * Utility to automatically convert currency values in text
 * This can be used to ensure consistent currency display across the application
 */

/**
 * Automatically converts currency symbols in a string to the current currency
 * @param text The text containing currency values
 * @param targetCurrencyCode The currency code to convert to (defaults to user's currency)
 * @returns The text with currency symbols converted
 */
export function autoConvertCurrencyInText(text: string, targetCurrencyCode?: string): string {
  const currencyCode = targetCurrencyCode || getUserCurrency()
  const currency = currencies[currencyCode] || currencies.USD
  
  // List of common currency symbols to replace
  const symbolsToReplace = ['$', '€', '£', '¥', 'QAR', 'ر.ق.‏', 'د.إ', 'ر.س.‏', 'د.ك.‏', 'د.ب.‏', 'ر.ع.‏']
  
  let result = text
  
  // Replace each currency symbol with the target currency symbol
  symbolsToReplace.forEach(symbol => {
    // Use regex to only replace when it's likely a monetary value (symbol followed by digits)
    const regex = new RegExp(`${symbol}\\s*(\\d[\\d,.]*)`,'g')
    result = result.replace(regex, `${currency.symbol}$1`)
  })
  
  return result
}

/**
 * Hook to automatically convert currency in a component
 * This can be used in components that don't directly use the CurrencyDisplay component
 */
export function useCurrencyAutoConverter() {
  return {
    convertText: autoConvertCurrencyInText
  }
}

/**
 * Utility function to check if a string contains a monetary value
 * @param text The text to check
 * @returns True if the text contains a monetary value
 */
export function containsMonetaryValue(text: string): boolean {
  // List of common currency symbols to check
  const symbols = ['$', '€', '£', '¥', 'QAR', 'ر.ق.‏', 'د.إ', 'ر.س.‏', 'د.ك.‏', 'د.ب.‏', 'ر.ع.‏']
  
  // Check if the text contains any currency symbol followed by digits
  return symbols.some(symbol => {
    const regex = new RegExp(`${symbol}\\s*\\d`)
    return regex.test(text)
  })
}

/**
 * Utility function to extract monetary values from text
 * @param text The text containing monetary values
 * @returns An array of extracted monetary values
 */
export function extractMonetaryValues(text: string): { symbol: string, value: string }[] {
  const results: { symbol: string, value: string }[] = []
  
  // List of common currency symbols to check
  const symbols = ['$', '€', '£', '¥', 'QAR', 'ر.ق.‏', 'د.إ', 'ر.س.‏', 'د.ك.‏', 'د.ب.‏', 'ر.ع.‏']
  
  // Extract all monetary values
  symbols.forEach(symbol => {
    const regex = new RegExp(`${symbol}\\s*(\\d[\\d,.]*)`,'g')
    let match
    
    while ((match = regex.exec(text)) !== null) {
      results.push({
        symbol,
        value: match[1]
      })
    }
  })
  
  return results
}
