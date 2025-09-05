"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Create a context to share the mobile state across components
const MobileContext = React.createContext<boolean>(false)

// Provider component that will wrap the app
export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  // Only run this effect once on the client side
  React.useEffect(() => {
    // Initial check
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Set up the media query listener with debounce
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    let debounceTimeout: NodeJS.Timeout | null = null

    const onChange = () => {
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }

      // Set a new timeout to debounce the resize event
      debounceTimeout = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        debounceTimeout = null
      }, 100)
    }

    // Add the event listener
    mql.addEventListener("change", onChange)

    // Clean up
    return () => {
      mql.removeEventListener("change", onChange)
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [])

  return (
    <MobileContext.Provider value={isMobile}>
      {children}
    </MobileContext.Provider>
  )
}

// Hook to use the mobile context
export function useIsMobile() {
  return React.useContext(MobileContext)
}
