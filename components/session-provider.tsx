"use client"

import { SessionProvider } from "next-auth/react"

export function NextAuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
      // Refetch session when coming back online
      refetchWhenOffline={false}
      // Base URL for NextAuth (helps with fetch issues)
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  )
}
