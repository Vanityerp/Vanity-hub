"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { ClientDataService, Client, ClientPreferences } from "@/lib/client-data-service"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { dataCache } from "@/lib/data-cache"

// Re-export types for convenience
export type { Client, ClientPreferences }

interface ClientContextType {
  clients: Client[]
  getClient: (id: string) => Client | undefined
  addClient: (client: Omit<Client, "id" | "avatar" | "segment" | "status">) => Promise<Client>
  updateClient: (id: string, clientData: Partial<Client>) => Client | undefined
  deleteClient: (id: string) => boolean
  updateClientPreferences: (id: string, preferences: ClientPreferences) => Client | undefined
  updateClientSegment: (id: string, segment: Client["segment"]) => Client | undefined
  updateClientStatus: (id: string, status: Client["status"]) => Client | undefined
  // Auto-registration methods
  findClientByPhoneAndName: (phone: string, name: string) => Client | undefined
  autoRegisterClient: (clientData: {
    name: string
    email?: string
    phone: string
    source: "client_portal" | "appointment_booking" | "walk_in"
    preferredLocation?: string
  }) => Promise<Client | null>
  normalizePhoneNumber: (phone: string) => string
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType>({
  clients: [],
  getClient: () => undefined,
  addClient: async () => ({} as Client),
  updateClient: () => undefined,
  deleteClient: () => false,
  updateClientPreferences: () => undefined,
  updateClientSegment: () => undefined,
  updateClientStatus: () => undefined,
  findClientByPhoneAndName: () => undefined,
  autoRegisterClient: async () => null,
  normalizePhoneNumber: () => "",
  refreshClients: async () => {},
})

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  // Load clients from database on initialization
  useEffect(() => {
    if (isInitialized) return;

    const loadClientsFromDatabase = async () => {
      try {
        console.log('Loading clients from database...')
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          // API now returns properly transformed clients
          console.log(`Initial load: API returned ${data.clients.length} clients:`, data.clients.map(c => c.name))
          setClients(data.clients)
          console.log(`Loaded ${data.clients.length} clients from database`)
        } else {
          console.warn('Failed to load clients from database, using fallback:', response.status, response.statusText)
          // Fallback to local storage/mock data
          const fallbackClients = ClientDataService.getClients()
          setClients(Array.isArray(fallbackClients) ? fallbackClients : [])
        }
      } catch (error) {
        console.error("Error loading clients from database:", error)
        // Fallback to local storage/mock data
        try {
          const fallbackClients = ClientDataService.getClients()
          setClients(Array.isArray(fallbackClients) ? fallbackClients : [])
        } catch (fallbackError) {
          console.error("Error loading fallback clients:", fallbackError)
          setClients([])
        }
      }
    }

    loadClientsFromDatabase()
    setIsInitialized(true)
  }, [isInitialized])

  // Helper function to generate initials
  const generateInitials = (name: string): string => {
    const nameParts = name.trim().split(' ')
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return nameParts[0].substring(0, 2).toUpperCase()
  }

  // DEPRECATED: No localStorage saving - database is single source of truth
  useEffect(() => {
    if (!isInitialized || clients.length === 0) return;

    // Only dispatch events for real-time updates
    window.dispatchEvent(new CustomEvent('clients-updated', {
      detail: { clients, timestamp: Date.now() }
    }))
  }, [clients, isInitialized])

  // Listen for external client updates (e.g., from appointment booking)
  useEffect(() => {
    const handleExternalUpdate = () => {
      refreshClients()
    }

    window.addEventListener('refresh-clients', handleExternalUpdate)
    return () => window.removeEventListener('refresh-clients', handleExternalUpdate)
  }, [])

  // Get a client by ID
  const getClient = (id: string) => {
    return clients.find(client => client.id === id)
  }

  // Add a new client with database persistence and duplicate checking
  const addClient = async (clientData: Omit<Client, "id" | "avatar" | "segment" | "status">) => {
    try {
      // First check for duplicates
      const duplicateCheck = await fetch('/api/clients/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: clientData.name,
          phone: clientData.phone
        })
      })

      const duplicateResult = await duplicateCheck.json()

      if (duplicateResult.hasDuplicates) {
        const duplicate = duplicateResult.duplicates[0]
        const duplicateType = duplicate.type === 'phone' ? 'phone number' : 'name'

        toast({
          title: "Duplicate client found",
          description: `A client with this ${duplicateType} already exists: ${duplicate.client.name}`,
          variant: "destructive"
        })

        // Return the existing client instead of creating a new one
        return duplicate.client
      }

      // Create the client via API
      const response = await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...clientData,
          registrationSource: clientData.registrationSource || 'manual',
          isAutoRegistered: clientData.isAutoRegistered || false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 409) {
          // Handle duplicate error from server
          toast({
            title: "Duplicate client found",
            description: errorData.message,
            variant: "destructive"
          })
          return errorData.existingClient
        }

        throw new Error(errorData.error || 'Failed to create client')
      }

      const result = await response.json()
      const newClient = result.client

      // Add to local state
      setClients(prevClients => {
        const updatedClients = [...prevClients, newClient]
        console.log(`Client added to local state. Total clients: ${updatedClients.length}`)
        return updatedClients
      })

      toast({
        title: "Client created",
        description: `${newClient.name} has been added to your client database.`,
      })

      // Trigger a refresh to ensure consistency
      setTimeout(() => {
        refreshClients()
      }, 1000)

      return newClient

    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive"
      })

      // Fallback to local creation if API fails
      const nameParts = clientData.name.split(" ")
      const initials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`
        : nameParts[0].substring(0, 2)

      const fallbackClient: Client = {
        id: uuidv4(),
        avatar: initials.toUpperCase(),
        segment: "New",
        status: "Active",
        ...clientData,
      }

      setClients(prevClients => [...prevClients, fallbackClient])
      return fallbackClient
    }
  }

  // Update an existing client
  const updateClient = (id: string, clientData: Partial<Client>) => {
    let updatedClient: Client | undefined

    setClients(prevClients => {
      const updatedClients = prevClients.map(client => {
        if (client.id === id) {
          updatedClient = { ...client, ...clientData }
          return updatedClient
        }
        return client
      })

      return updatedClients
    })

    if (updatedClient) {
      toast({
        title: "Client updated",
        description: `${updatedClient.name}'s information has been updated.`,
      })
    }

    return updatedClient
  }

  // Delete a client
  const deleteClient = (id: string) => {
    const clientToDelete = getClient(id)

    if (!clientToDelete) return false

    setClients(prevClients => prevClients.filter(client => client.id !== id))

    toast({
      title: "Client deleted",
      description: `${clientToDelete.name} has been removed from your client database.`,
      variant: "destructive",
    })

    return true
  }

  // Update client preferences
  const updateClientPreferences = (id: string, preferences: ClientPreferences) => {
    return updateClient(id, { preferences })
  }

  // Update client segment
  const updateClientSegment = (id: string, segment: Client["segment"]) => {
    return updateClient(id, { segment })
  }

  // Update client status
  const updateClientStatus = (id: string, status: Client["status"]) => {
    return updateClient(id, { status })
  }

  // Normalize phone number for consistent comparison
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '')

    // Handle Qatar phone numbers
    if (digitsOnly.startsWith('974')) {
      return digitsOnly // Already has country code
    } else if (digitsOnly.startsWith('00974')) {
      return digitsOnly.substring(2) // Remove 00 prefix
    } else if (digitsOnly.length === 8) {
      return `974${digitsOnly}` // Add Qatar country code
    }

    return digitsOnly
  }

  // Find client by phone and name (duplicate detection)
  const findClientByPhoneAndName = (phone: string, name: string): Client | undefined => {
    const normalizedPhone = normalizePhoneNumber(phone)
    const normalizedName = name.toLowerCase().trim()

    return clients.find(client => {
      const clientNormalizedPhone = normalizePhoneNumber(client.phone)
      const clientNormalizedName = client.name.toLowerCase().trim()

      // Match if both phone AND name match
      return clientNormalizedPhone === normalizedPhone && clientNormalizedName === normalizedName
    })
  }

  // Auto-register client with duplicate detection
  const autoRegisterClient = async (clientData: {
    name: string
    email?: string
    phone: string
    source: "client_portal" | "appointment_booking" | "walk_in"
    preferredLocation?: string
  }): Promise<Client | null> => {
    try {
      // Check for existing client
      const existingClient = findClientByPhoneAndName(clientData.phone, clientData.name)

      if (existingClient) {
        console.log(`Client already exists: ${existingClient.name} (${existingClient.phone})`)
        return existingClient // Return existing client instead of null
      }

      // Create new client with auto-registration metadata
      const newClientData = {
        name: clientData.name,
        email: clientData.email || "",
        phone: clientData.phone,
        address: "",
        city: "",
        state: "",
        birthday: "",
        preferredLocation: clientData.preferredLocation || "loc1",
        locations: [clientData.preferredLocation || "loc1"],
        totalSpent: 0,
        referredBy: "",
        preferences: {
          preferredStylists: [],
          preferredServices: [],
          allergies: [],
          notes: ""
        },
        registrationSource: clientData.source,
        isAutoRegistered: true,
        notes: `Auto-registered via ${clientData.source.replace('_', ' ')}`
      }

      const newClient = await addClient(newClientData)

      console.log(`Auto-registered new client: ${newClient.name} via ${clientData.source}`)

      return newClient
    } catch (error) {
      console.error("Error auto-registering client:", error)
      return null
    }
  }

  // Refresh clients from database
  const refreshClients = async () => {
    try {
      console.log('Refreshing clients from database...')
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        // API now returns properly transformed clients
        console.log(`API returned ${data.clients.length} clients:`, data.clients.map(c => c.name))
        setClients(data.clients)
        console.log(`Refreshed ${data.clients.length} clients from database`)
      } else {
        console.error('Failed to refresh clients from database:', response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error refreshing clients:", error)
    }
  }

  return (
    <ClientContext.Provider
      value={{
        clients,
        getClient,
        addClient,
        updateClient,
        deleteClient,
        updateClientPreferences,
        updateClientSegment,
        updateClientStatus,
        findClientByPhoneAndName,
        autoRegisterClient,
        normalizePhoneNumber,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export const useClients = () => useContext(ClientContext)
