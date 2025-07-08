"use client"

import React, { useEffect, useRef, useCallback, useState, memo } from "react"
import { useCurrency } from "@/lib/currency-provider"
import { currencies } from "@/lib/currency-data"

/**
 * This component enforces a global currency rule across the entire application.
 * It should be placed high in the component tree to ensure all components
 * have access to the same currency context.
 *
 * Performance optimized version with:
 * - Throttled DOM operations
 * - Selective node processing
 * - Reduced mutation observer scope
 * - Idle callback scheduling
 */
export const GlobalCurrencyEnforcer = memo(({ children }: { children: React.ReactNode }) => {
  const { currencyCode, currency } = useCurrency()
  const observerRef = useRef<MutationObserver | null>(null)
  const prevCurrencyRef = useRef<string>(currencyCode)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingRef = useRef<boolean>(false) // Use ref instead of state for better performance
  const processedNodesRef = useRef<WeakSet<Node>>(new WeakSet()) // Track already processed nodes

  // Function to replace hardcoded currency symbols in text nodes - memoized to prevent recreation
  const replaceCurrencySymbols = useCallback((node: Node, depth = 0) => {
    // Skip already processed nodes
    if (processedNodesRef.current.has(node)) {
      return
    }

    // Limit recursion depth for performance
    if (depth > 3) {
      return
    }

    // Mark this node as processed
    processedNodesRef.current.add(node)

    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      // List of common currency symbols to replace - only include the most common ones
      const symbolsToReplace = ['$', '€', '£', '¥', 'QAR']

      // Skip nodes that are part of the CurrencyDisplay component
      const parent = node.parentElement
      if (!parent ||
          parent.hasAttribute('data-currency-code') ||
          parent.closest('[data-currency-display="true"]')) {
        return
      }

      // Quick check for any currency symbol before doing more expensive operations
      const textContent = node.textContent
      let hasSymbol = false
      for (const symbol of symbolsToReplace) {
        if (textContent.includes(symbol)) {
          hasSymbol = true
          break
        }
      }

      if (hasSymbol) {
        // Check if it looks like a monetary value (symbol followed by digits)
        const containsCurrencySymbol = symbolsToReplace.some(symbol =>
          new RegExp(`${symbol}\\s*\\d`).test(textContent)
        )

        if (containsCurrencySymbol) {
          // Replace the currency symbol with the current one
          let newText = textContent
          for (const symbol of symbolsToReplace) {
            if (textContent.includes(symbol)) {
              // Use a regex to only replace when it's likely a monetary value
              newText = newText.replace(
                new RegExp(`${symbol}\\s*(\\d[\\d,.]*)`,'g'),
                `${currency.symbol}$1`
              )
            }
          }
          node.textContent = newText
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip script and style elements
      const element = node as Element
      const tagName = element.tagName.toLowerCase()

      // Skip elements that shouldn't need currency replacement
      const skipTags = ['script', 'style', 'svg', 'canvas', 'video', 'audio', 'img', 'input', 'textarea', 'code', 'pre']
      if (skipTags.includes(tagName)) {
        return
      }

      // Skip elements with specific attributes that indicate they handle currency
      if (element.hasAttribute('data-currency-display') ||
          element.hasAttribute('data-currency-code')) {
        return
      }

      // Process child nodes - limit the number of children processed for performance
      const childNodes = node.childNodes
      const childCount = childNodes.length
      const processLimit = Math.min(childCount, 10) // Process at most 10 children

      for (let i = 0; i < processLimit; i++) {
        replaceCurrencySymbols(childNodes[i], depth + 1)
      }
    }
  }, [currency.symbol])

  // Function to update currency variables in the DOM
  const updateCurrencyVariables = useCallback(() => {
    if (typeof document === 'undefined') return

    // Set CSS variables for currency - this is fast and doesn't need optimization
    document.documentElement.style.setProperty('--currency-symbol', currency.symbol)
    document.documentElement.style.setProperty('--currency-code', currencyCode)
    document.documentElement.style.setProperty('--currency-name', currency.name)
    document.documentElement.style.setProperty('--currency-decimal-digits', currency.decimalDigits.toString())

    // Add data attributes to the html element for easier styling and JS access
    document.documentElement.setAttribute('data-currency', currencyCode)
    document.documentElement.setAttribute('data-currency-symbol', currency.symbol)
  }, [currency, currencyCode])

  // Listen for currency cache revalidation events
  useEffect(() => {
    const handleCacheRevalidated = () => {
      // Update currency variables
      updateCurrencyVariables()

      // Process DOM when cache is revalidated
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      // Reset the processed nodes tracking
      processedNodesRef.current = new WeakSet()

      // Schedule DOM processing
      timeoutRef.current = setTimeout(() => {
        if (!processingRef.current) {
          processingRef.current = true
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
              const mainContent = document.querySelector('main') || document.body
              replaceCurrencySymbols(mainContent)
              processingRef.current = false
            }, { timeout: 500 })
          } else {
            setTimeout(() => {
              const mainContent = document.querySelector('main') || document.body
              replaceCurrencySymbols(mainContent)
              processingRef.current = false
            }, 300)
          }
        }
      }, 100)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('currency-cache-revalidated', handleCacheRevalidated)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('currency-cache-revalidated', handleCacheRevalidated)
      }
    }
  }, [replaceCurrencySymbols, updateCurrencyVariables])

  // Set up global currency enforcement
  useEffect(() => {
    if (typeof document === 'undefined') return

    // Update currency variables
    updateCurrencyVariables()

    // Only process the DOM when currency changes
    if (prevCurrencyRef.current !== currencyCode) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Reset the processed nodes tracking
      processedNodesRef.current = new WeakSet()

      // Mark as processing
      processingRef.current = true

      // Use requestIdleCallback for non-critical operations
      const processDOM = () => {
        // Process only key elements that are likely to contain currency values
        const currencyContainers = document.querySelectorAll('.card, .table, [data-currency-container]')

        if (currencyContainers.length > 0) {
          // Process a limited set of containers
          const containersToProcess = Array.from(currencyContainers).slice(0, 5)
          containersToProcess.forEach(container => replaceCurrencySymbols(container))
        } else {
          // Fallback to processing main content areas only
          const mainContent = document.querySelector('main') || document.body
          replaceCurrencySymbols(mainContent)
        }

        prevCurrencyRef.current = currencyCode
        processingRef.current = false
      }

      // Schedule the DOM processing during idle time
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(processDOM, { timeout: 500 })
      } else {
        // Fallback to setTimeout for browsers that don't support requestIdleCallback
        timeoutRef.current = setTimeout(processDOM, 300)
      }
    }

    // Set up a more targeted MutationObserver
    if (!observerRef.current) {
      observerRef.current = new MutationObserver(mutations => {
        // Skip if already processing
        if (processingRef.current) return

        // Throttle mutations processing
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          // Skip if there are no significant mutations
          const significantMutations = mutations.filter(mutation =>
            mutation.type === 'childList' &&
            mutation.addedNodes.length > 0 &&
            // Only process mutations in elements that likely contain currency values
            (mutation.target.nodeType === Node.ELEMENT_NODE &&
             ((mutation.target as Element).classList.contains('card') ||
              (mutation.target as Element).classList.contains('table') ||
              (mutation.target as Element).hasAttribute('data-currency-container')))
          )

          if (significantMutations.length === 0) {
            timeoutRef.current = null
            return
          }

          processingRef.current = true

          // Process only the first few significant mutations
          const limitedMutations = significantMutations.slice(0, 3)

          limitedMutations.forEach(mutation => {
            if (mutation.type === 'childList') {
              // Process only the first few added nodes
              const nodesToProcess = Array.from(mutation.addedNodes)
                .filter(node => node.nodeType === Node.ELEMENT_NODE)
                .slice(0, 3)

              nodesToProcess.forEach(node => {
                replaceCurrencySymbols(node)
              })
            }
          })

          processingRef.current = false
          timeoutRef.current = null
        }, 500) // Longer debounce for better performance
      })

      // Observe only specific parts of the DOM that are likely to contain currency values
      const observeTargets = document.querySelectorAll('.card, .table, [data-currency-container]')

      if (observeTargets.length > 0) {
        observeTargets.forEach(target => {
          observerRef.current?.observe(target, {
            childList: true,
            subtree: true,
            characterData: false
          })
        })
      } else {
        // Fallback to observing the main content area only
        const mainContent = document.querySelector('main') || document.body
        observerRef.current.observe(mainContent, {
          childList: true,
          subtree: true,
          characterData: false
        })
      }
    }

    // Dispatch a global event when currency changes
    const event = new CustomEvent('global-currency-changed', {
      detail: { currencyCode, currency }
    })
    document.dispatchEvent(event)

    // Clean up observer and timeouts on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [currencyCode, currency, replaceCurrencySymbols])

  return <>{children}</>
})

// Add display name for better debugging
GlobalCurrencyEnforcer.displayName = 'GlobalCurrencyEnforcer'

/**
 * Hook to listen for global currency changes
 * Use this in components that need to react to currency changes
 * but don't directly use the currency context
 *
 * Performance optimized version that uses a ref for the callback
 * to prevent unnecessary re-renders
 */
export function useGlobalCurrencyChange(callback: (currencyCode: string) => void) {
  // Use a ref for the callback to prevent unnecessary effect reruns
  const callbackRef = useRef(callback)

  // Update the ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Create a stable event handler that uses the ref
    const handleCurrencyChange = (event: Event) => {
      const { currencyCode } = (event as CustomEvent).detail
      callbackRef.current(currencyCode)
    }

    document.addEventListener('global-currency-changed', handleCurrencyChange)
    return () => {
      document.removeEventListener('global-currency-changed', handleCurrencyChange)
    }
  }, []) // Empty dependency array since we're using a ref
}
