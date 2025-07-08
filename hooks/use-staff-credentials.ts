import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface StaffMember {
  id: string
  name: string
  employeeNumber?: string
  jobRole?: string
  status: string
  hasCredentials: boolean
  user?: {
    id: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  locations: {
    id: string
    name: string
    city: string
    isActive: boolean
  }[]
}

interface Location {
  id: string
  name: string
  city: string
}

export function useStaffCredentials() {
  const { toast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStaffCredentials = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/staff/credentials')
      const data = await response.json()
      
      if (response.ok) {
        setStaff(data.staff || [])
      } else {
        throw new Error(data.error || 'Failed to fetch staff credentials')
      }
    } catch (error) {
      console.error('Error fetching staff credentials:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch staff credentials",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      
      if (response.ok) {
        setLocations(data.locations || [])
      } else {
        throw new Error(data.error || 'Failed to fetch locations')
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch locations",
        variant: "destructive"
      })
    }
  }, [toast])

  const createCredentials = useCallback(async (staffId: string, locationIds: string[]) => {
    try {
      const response = await fetch('/api/staff/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          locationIds,
          generatePassword: true
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Login credentials created successfully",
        })
        await fetchStaffCredentials() // Refresh data
        return result.credentials
      } else {
        throw new Error(result.error || 'Failed to create credentials')
      }
    } catch (error) {
      console.error('Error creating credentials:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create credentials",
        variant: "destructive"
      })
      throw error
    }
  }, [toast, fetchStaffCredentials])

  const resetPassword = useCallback(async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/credentials/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Password Reset",
          description: "A new temporary password has been generated",
        })
        await fetchStaffCredentials() // Refresh data
        return result.temporaryPassword
      } else {
        throw new Error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive"
      })
      throw error
    }
  }, [toast, fetchStaffCredentials])

  const updateLocations = useCallback(async (staffId: string, locationIds: string[]) => {
    try {
      const response = await fetch(`/api/staff/credentials/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_locations',
          locationIds 
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Location assignments updated successfully",
        })
        await fetchStaffCredentials() // Refresh data
        return result
      } else {
        throw new Error(result.error || 'Failed to update locations')
      }
    } catch (error) {
      console.error('Error updating locations:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update locations",
        variant: "destructive"
      })
      throw error
    }
  }, [toast, fetchStaffCredentials])

  const toggleActive = useCallback(async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/credentials/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active' })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Account ${result.isActive ? 'activated' : 'deactivated'} successfully`,
        })
        await fetchStaffCredentials() // Refresh data
        return result
      } else {
        throw new Error(result.error || 'Failed to toggle account status')
      }
    } catch (error) {
      console.error('Error toggling account status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle account status",
        variant: "destructive"
      })
      throw error
    }
  }, [toast, fetchStaffCredentials])

  const generateTestCredentials = useCallback(async () => {
    try {
      const response = await fetch('/api/staff/credentials/generate-test', {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        const { successfulCredentials, existingCredentials, totalLocations } = result.summary
        const message = successfulCredentials > 0
          ? `Created credentials for ${successfulCredentials} staff members`
          : `Found ${existingCredentials} staff members with existing credentials across ${totalLocations} locations`

        toast({
          title: "Credential Check Complete",
          description: message,
        })
        await fetchStaffCredentials() // Refresh data
        return result
      } else {
        throw new Error(result.error || 'Failed to check test credentials')
      }
    } catch (error) {
      console.error('Error generating test credentials:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate test credentials",
        variant: "destructive"
      })
      throw error
    }
  }, [toast, fetchStaffCredentials])

  return {
    staff,
    locations,
    loading,
    fetchStaffCredentials,
    fetchLocations,
    createCredentials,
    resetPassword,
    updateLocations,
    toggleActive,
    generateTestCredentials
  }
}
