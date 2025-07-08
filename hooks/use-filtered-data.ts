import { useState, useEffect } from "react"
import { useLocationFilter } from "./use-location-filter"

interface Location {
  id: string
  name: string
  address: string
  city: string
  phone: string
  isActive: boolean
}

interface StaffMember {
  id: string
  name: string
  locations: string[]
  [key: string]: any
}

interface Appointment {
  id: string
  location: string
  [key: string]: any
}

/**
 * Hook to fetch and filter locations based on user access
 */
export function useFilteredLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { filterLocations } = useLocationFilter()

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/locations')
        const data = await response.json()
        
        if (response.ok) {
          // Apply location filtering based on user access
          const filteredData = filterLocations(data.locations || [])
          setLocations(filteredData)
        } else {
          throw new Error(data.error || 'Failed to fetch locations')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations')
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [filterLocations])

  return { locations, loading, error, refetch: () => window.location.reload() }
}

/**
 * Hook to fetch and filter staff based on user access
 */
export function useFilteredStaff(locationId?: string) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { filterStaff } = useLocationFilter()

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const url = locationId ? `/api/staff?locationId=${locationId}` : '/api/staff'
        const response = await fetch(url)
        const data = await response.json()
        
        if (response.ok) {
          // Apply staff filtering based on user access
          const filteredData = filterStaff(data.staff || [])
          setStaff(filteredData)
        } else {
          throw new Error(data.error || 'Failed to fetch staff')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff')
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [locationId, filterStaff])

  return { staff, loading, error, refetch: () => window.location.reload() }
}

/**
 * Hook to fetch and filter appointments based on user access
 */
export function useFilteredAppointments(filters?: {
  locationId?: string
  staffId?: string
  clientId?: string
  date?: string
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { filterAppointments } = useLocationFilter()

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (filters?.locationId) params.append('locationId', filters.locationId)
        if (filters?.staffId) params.append('staffId', filters.staffId)
        if (filters?.clientId) params.append('clientId', filters.clientId)
        if (filters?.date) params.append('date', filters.date)
        
        const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        
        if (response.ok) {
          // Apply appointment filtering based on user access
          const filteredData = filterAppointments(data.appointments || [])
          setAppointments(filteredData)
        } else {
          throw new Error(data.error || 'Failed to fetch appointments')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [filters?.locationId, filters?.staffId, filters?.clientId, filters?.date, filterAppointments])

  return { appointments, loading, error, refetch: () => window.location.reload() }
}
