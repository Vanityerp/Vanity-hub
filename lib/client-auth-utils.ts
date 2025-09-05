"use client"

/**
 * Utility functions for client authentication and ID management
 */

/**
 * Get the current client ID with consistent fallback logic
 * This ensures the same client ID is used across all components
 */
export function getCurrentClientId(): string {
  if (typeof window === 'undefined') {
    return "guest"
  }

  // Try to get stored client ID first
  const storedClientId = localStorage.getItem("client_id")
  if (storedClientId) {
    return storedClientId
  }

  // Fall back to email if no client ID
  const storedEmail = localStorage.getItem("client_email")
  if (storedEmail) {
    return storedEmail
  }

  // Check if user is authenticated but no ID/email stored
  const authToken = localStorage.getItem("client_auth_token")
  if (authToken) {
    // If authenticated but no ID, use the default mock client ID
    return "client123"
  }

  // Not authenticated, use guest
  return "guest"
}

/**
 * Get client authentication status
 */
export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const token = localStorage.getItem("client_auth_token")
  const email = localStorage.getItem("client_email")
  
  return !!(token && email)
}

/**
 * Get client information from localStorage
 */
export function getClientInfo() {
  if (typeof window === 'undefined') {
    return {
      clientId: "guest",
      clientEmail: null,
      authToken: null,
      isAuthenticated: false
    }
  }

  const clientId = localStorage.getItem("client_id")
  const clientEmail = localStorage.getItem("client_email")
  const authToken = localStorage.getItem("client_auth_token")
  const isAuthenticated = !!(authToken && clientEmail)

  return {
    clientId: getCurrentClientId(),
    clientEmail,
    authToken,
    isAuthenticated
  }
}

/**
 * Set client authentication data
 */
export function setClientAuth(clientId: string, clientEmail: string, authToken: string = "sample_token") {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem("client_id", clientId)
  localStorage.setItem("client_email", clientEmail)
  localStorage.setItem("client_auth_token", authToken)

  // Dispatch auth change event
  window.dispatchEvent(new CustomEvent('client-auth-changed', { 
    detail: { isLoggedIn: true } 
  }))
}

/**
 * Clear client authentication data
 */
export function clearClientAuth() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem("client_id")
  localStorage.removeItem("client_email")
  localStorage.removeItem("client_auth_token")

  // Dispatch auth change event
  window.dispatchEvent(new CustomEvent('client-auth-changed', { 
    detail: { isLoggedIn: false } 
  }))
}

/**
 * Debug function to log current client auth state
 */
export function debugClientAuth() {
  const info = getClientInfo()
  console.log('🔍 CLIENT AUTH DEBUG:', {
    ...info,
    storedClientId: localStorage.getItem("client_id"),
    storedClientEmail: localStorage.getItem("client_email"),
    storedAuthToken: localStorage.getItem("client_auth_token")
  })
  return info
}
