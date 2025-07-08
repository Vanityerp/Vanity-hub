"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

export function AuthErrorHandler() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    // Handle NextAuth client fetch errors
    const handleAuthError = (event: any) => {
      console.error('NextAuth client error:', event)
      
      // Only show user-facing error for critical auth failures
      if (event?.error?.message?.includes('Failed to fetch')) {
        // Check if we're in a critical auth flow
        const isAuthPage = window.location.pathname.includes('/login') || 
                          window.location.pathname.includes('/dashboard')
        
        if (isAuthPage) {
          toast({
            title: "Connection Issue",
            description: "Having trouble connecting to the authentication service. Please check your internet connection and try again.",
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    }

    // Listen for NextAuth errors
    window.addEventListener('next-auth-error', handleAuthError)

    // Override console.error to catch NextAuth CLIENT_FETCH_ERROR
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if this is a NextAuth CLIENT_FETCH_ERROR
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('CLIENT_FETCH_ERROR') || arg.includes('next-auth'))
      )) {
        // Log the error but don't show it to users unless it's critical
        originalConsoleError('[NextAuth Debug]', ...args)
        
        // Only show user notification for persistent errors
        const errorMessage = args.join(' ')
        if (errorMessage.includes('Failed to fetch') && 
            (window.location.pathname.includes('/login') || 
             window.location.pathname.includes('/dashboard'))) {
          
          // Debounce error notifications
          if (!window.lastAuthErrorTime || 
              Date.now() - window.lastAuthErrorTime > 10000) {
            window.lastAuthErrorTime = Date.now()
            
            toast({
              title: "Authentication Service Unavailable",
              description: "Please refresh the page or try again in a moment.",
              variant: "destructive",
              duration: 8000,
            })
          }
        }
      } else {
        // For non-NextAuth errors, use original console.error
        originalConsoleError(...args)
      }
    }

    return () => {
      window.removeEventListener('next-auth-error', handleAuthError)
      console.error = originalConsoleError
    }
  }, [toast])

  // Handle session loading states
  useEffect(() => {
    if (status === 'loading') {
      // Session is loading, this is normal
      return
    }

    if (status === 'unauthenticated') {
      // User is not authenticated, this might be expected
      const isProtectedRoute = window.location.pathname.startsWith('/dashboard')
      
      if (isProtectedRoute && !window.location.pathname.includes('/login')) {
        // User is on a protected route but not authenticated
        console.log('User not authenticated on protected route, redirecting to login')
        window.location.href = '/login'
      }
    }

    if (status === 'authenticated' && session) {
      // User is authenticated successfully
      console.log('User authenticated:', session.user?.email)
    }
  }, [status, session])

  // This component doesn't render anything
  return null
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    lastAuthErrorTime?: number
  }
}
