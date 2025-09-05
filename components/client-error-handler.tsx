"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { clientErrorHandler, setErrorUserId, clearErrorUserId } from '@/lib/error-handling/client-error-handler'

export function ClientErrorHandler() {
  const { data: session } = useSession()

  useEffect(() => {
    // Set user ID for error tracking when user is logged in
    if (session?.user?.id) {
      setErrorUserId(session.user.id)
    } else {
      clearErrorUserId()
    }
  }, [session?.user?.id])

  // The client error handler is automatically initialized
  // This component just manages the user ID
  return null
}
