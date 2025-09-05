// DEPRECATED: This service is no longer used
// All client data is now persisted in the database through Prisma
// Use API endpoints to fetch real client data

"use client"

// Client preferences interface
export interface ClientPreferences {
  preferredStylists: string[]
  preferredServices: string[]
  preferredProducts: string[]
  allergies: string[]
  notes: string
}

// Client interface
export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip?: string
  birthday?: string
  lastVisit?: string
  preferredLocation?: string
  locations?: string[]
  status: "Active" | "Inactive" | "Pending"
  avatar?: string
  segment?: "VIP" | "Regular" | "New" | "At Risk"
  totalSpent?: number
  referredBy?: string
  preferences?: ClientPreferences
  notes?: string
  // Auto-registration tracking
  registrationSource?: "manual" | "client_portal" | "appointment_booking" | "walk_in"
  isAutoRegistered?: boolean
  createdAt?: string
  updatedAt?: string
}

// DEPRECATED: All client data is now managed through the database
// Use API endpoints to fetch real client data
const defaultClients: Client[] = []



// DEPRECATED: All localStorage functions removed
// Use API endpoints instead

// Migration function to convert old string preferences to new object structure
function migrateClientPreferences(clients: any[]): Client[] {
  return clients.map(client => {
    // If preferences is a string, convert it to the new object structure
    if (typeof client.preferences === 'string') {
      const oldPreferencesNote = client.preferences
      client.preferences = {
        preferredStylists: [],
        preferredServices: [],
        preferredProducts: [],
        allergies: [],
        notes: oldPreferencesNote
      }
    }
    // If preferences is undefined, initialize with empty structure
    else if (!client.preferences) {
      client.preferences = {
        preferredStylists: [],
        preferredServices: [],
        preferredProducts: [],
        allergies: [],
        notes: ""
      }
    }
    return client as Client
  })
}

// Client Data Service
export const ClientDataService = {
  // Initialize clients with default data if none exists
  initializeClients: (): Client[] => {
    console.log("ClientDataService: Initializing clients...")

    const existingClients = getFromStorage<Client[]>(STORAGE_KEY, [])
    if (existingClients.length > 0) {
      console.log("ClientDataService: Found existing clients:", existingClients.length)
      // Migrate existing clients to new preferences structure
      const migratedClients = migrateClientPreferences(existingClients)
      // Save migrated data back to storage
      saveToStorage(STORAGE_KEY, migratedClients)
      console.log("ClientDataService: Migrated client preferences to new structure")
      return migratedClients
    }

    console.log("ClientDataService: No existing clients found, initializing with defaults")
    const clientsWithTimestamps = defaultClients.map(client => ({
      ...client,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    saveToStorage(STORAGE_KEY, clientsWithTimestamps)
    console.log("ClientDataService: Initialized", clientsWithTimestamps.length, "default clients")
    return clientsWithTimestamps
  },

  // DEPRECATED: Use API endpoints instead
  getClients: (): Client[] => {
    console.warn("ClientDataService.getClients is deprecated. Use GET /api/clients instead.")
    return []
  },

  // Get client by ID
  getClientById: (id: string): Client | undefined => {
    const clients = ClientDataService.getClients()
    return clients.find(client => client.id === id)
  },

  // Get clients by location
  getClientsByLocation: (locationId: string): Client[] => {
    const clients = ClientDataService.getClients()
    return clients.filter(client => 
      client.locations?.includes(locationId) || client.preferredLocation === locationId
    )
  },

  // Get clients by segment
  getClientsBySegment: (segment: string): Client[] => {
    const clients = ClientDataService.getClients()
    return clients.filter(client => client.segment === segment)
  },

  // Search clients
  searchClients: (query: string): Client[] => {
    const clients = ClientDataService.getClients()
    const lowercaseQuery = query.toLowerCase()
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowercaseQuery) ||
      client.email.toLowerCase().includes(lowercaseQuery) ||
      client.phone.includes(query)
    )
  },

  // DEPRECATED: Use API endpoints instead
  saveClients: (clients: Client[]) => {
    console.warn("ClientDataService.saveClients is deprecated. Use POST/PUT /api/clients instead.")
  },

  // DEPRECATED: Use API endpoints instead
  addClient: (clientData: Omit<Client, "id" | "createdAt" | "updatedAt">): Client => {
    console.warn("ClientDataService.addClient is deprecated. Use POST /api/clients instead.")
    return {
      ...clientData,
      id: 'deprecated',
      status: "Active",
      segment: "New",
      locations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  // DEPRECATED: Use API endpoints instead
  updateClient: (id: string, updates: Partial<Client>): Client | null => {
    console.warn("ClientDataService.updateClient is deprecated. Use PUT /api/clients/[id] instead.")
    return null
  },

  // DEPRECATED: Use API endpoints instead
  deleteClient: (id: string): boolean => {
    console.warn("ClientDataService.deleteClient is deprecated. Use DELETE /api/clients/[id] instead.")
    return false
  },

  // DEPRECATED: Use API endpoints for client statistics
  getClientStats: () => {
    console.warn("ClientDataService.getClientStats is deprecated. Use GET /api/clients/stats instead.")
    return {
      total: 0,
      active: 0,
      vip: 0,
      regular: 0,
      new: 0,
      totalSpent: 0
    }
  }
}
