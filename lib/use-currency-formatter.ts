"use client"

import { useCallback } from "react"
import { useCurrency } from "./currency-provider"
import { autoConvertCurrencyInText } from "./currency-auto-converter"

/**
 * A hook that provides utility functions for formatting currency values
 * This is a more comprehensive version of the useCurrency hook
 * that includes additional formatting options
 */
export function useCurrencyFormatter() {
  const { currency, currencyCode, formatCurrency } = useCurrency()
  
  /**
   * Format a number as a monetary value with the current currency
   * @param amount The amount to format
   * @param options Formatting options
   * @returns Formatted currency string
   */
  const format = useCallback((
    amount: number, 
    options?: { 
      showSymbol?: boolean; 
      useLocaleFormat?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): string => {
    const { 
      showSymbol = true, 
      useLocaleFormat = true,
      minimumFractionDigits = currency.decimalDigits,
      maximumFractionDigits = currency.decimalDigits
    } = options || {}
    
    if (useLocaleFormat) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    }
    
    return `${showSymbol ? currency.symbol + ' ' : ''}${amount.toFixed(maximumFractionDigits)}`
  }, [currency, currencyCode])
  
  /**
   * Convert text containing currency symbols to use the current currency
   * @param text Text containing currency symbols
   * @returns Text with currency symbols converted to the current currency
   */
  const convertText = useCallback((text: string): string => {
    return autoConvertCurrencyInText(text, currencyCode)
  }, [currencyCode])
  
  /**
   * Get CSS variables for the current currency
   * @returns CSS variables for the current currency
   */
  const getCssVariables = useCallback((): Record<string, string> => {
    return {
      '--currency-symbol': currency.symbol,
      '--currency-code': currencyCode,
      '--currency-name': currency.name,
      '--currency-decimal-digits': currency.decimalDigits.toString(),
    }
  }, [currency, currencyCode])
  
  /**
   * Get data attributes for the current currency
   * @returns Data attributes for the current currency
   */
  const getDataAttributes = useCallback((): Record<string, string> => {
    return {
      'data-currency': currencyCode,
      'data-currency-symbol': currency.symbol,
      'data-currency-name': currency.name,
    }
  }, [currency, currencyCode])
  
  return {
    currency,
    currencyCode,
    format,
    formatCurrency,
    convertText,
    getCssVariables,
    getDataAttributes,
    symbol: currency.symbol,
    name: currency.name,
    decimalDigits: currency.decimalDigits,
  }
}
