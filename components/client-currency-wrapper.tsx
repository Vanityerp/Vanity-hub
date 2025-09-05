"use client"

import dynamic from "next/dynamic"

// Dynamically import the GlobalCurrencyEnforcer
const GlobalCurrencyEnforcer = dynamic(
  () => import("@/components/global-currency-enforcer").then(mod => mod.GlobalCurrencyEnforcer),
  { ssr: false } // Disable server-side rendering for this component
)

export function ClientCurrencyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GlobalCurrencyEnforcer>
      {children}
    </GlobalCurrencyEnforcer>
  )
}
