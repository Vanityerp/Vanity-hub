"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocations } from "@/lib/location-provider"
import { Badge } from "@/components/ui/badge"

export default function LocationTestPage() {
  const { locations, getActiveLocations, refreshLocations } = useLocations()
  const [apiLocations, setApiLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test direct API call
  const testApiCall = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/locations')
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`)
      }
      const data = await response.json()
      setApiLocations(data.locations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Test seeding locations
  const testSeedLocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/seed-locations', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`Seeding failed: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Seeding result:', data)

      // Refresh locations after seeding
      await testApiCall()
      await refreshLocations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Test provider refresh
  const testProviderRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Testing provider refresh...')
      await refreshLocations()
      console.log('Provider refresh completed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testApiCall()
    console.log('LocationTest: Provider locations on mount:', locations)
    console.log('LocationTest: Provider active locations on mount:', getActiveLocations())
  }, [])

  useEffect(() => {
    console.log('LocationTest: Provider locations changed:', locations)
    console.log('LocationTest: Provider active locations changed:', getActiveLocations())
  }, [locations, getActiveLocations])

  const requiredLocations = [
    'D-ring road',
    'Muaither', 
    'Medinat Khalifa',
    'Home service',
    'Online store'
  ]

  const checkLocationExists = (name: string) => {
    return apiLocations.some(loc => loc.name === name)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Data Test</h1>
          <p className="text-muted-foreground">Test database persistence for salon locations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testApiCall} disabled={loading}>
            Refresh API Data
          </Button>
          <Button onClick={testSeedLocations} disabled={loading} variant="outline">
            Seed Locations
          </Button>
          <Button onClick={testProviderRefresh} disabled={loading} variant="secondary">
            Refresh Provider
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Data */}
        <Card>
          <CardHeader>
            <CardTitle>Location Provider Data</CardTitle>
            <p className="text-sm text-muted-foreground">
              Data from useLocations() hook
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Total Locations: {locations.length}</p>
              <p className="font-medium">Active Locations: {getActiveLocations().length}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Locations:</h4>
              {locations.length === 0 ? (
                <p className="text-muted-foreground">No locations found</p>
              ) : (
                locations.map(location => (
                  <div key={location.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">{location.id}</p>
                    </div>
                    <Badge variant={location.status === 'Active' ? 'default' : 'secondary'}>
                      {location.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Data */}
        <Card>
          <CardHeader>
            <CardTitle>Direct API Data</CardTitle>
            <p className="text-sm text-muted-foreground">
              Data from /api/locations endpoint
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Total Locations: {apiLocations.length}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Locations:</h4>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : apiLocations.length === 0 ? (
                <p className="text-muted-foreground">No locations found</p>
              ) : (
                apiLocations.map(location => (
                  <div key={location.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">{location.id}</p>
                    </div>
                    <Badge variant={location.isActive ? 'default' : 'secondary'}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Locations Check */}
      <Card>
        <CardHeader>
          <CardTitle>Required Locations Check</CardTitle>
          <p className="text-sm text-muted-foreground">
            Verify all 5 required locations exist in database
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {requiredLocations.map(name => {
              const exists = checkLocationExists(name)
              return (
                <div key={name} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{name}</p>
                  </div>
                  <Badge variant={exists ? 'default' : 'destructive'}>
                    {exists ? '✓' : '✗'}
                  </Badge>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm">
              <strong>Status:</strong> {requiredLocations.every(checkLocationExists) 
                ? '✅ All required locations exist' 
                : '❌ Some required locations are missing'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
