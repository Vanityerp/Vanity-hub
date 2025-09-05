"use client"

import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useLocationFilter } from "@/hooks/use-location-filter"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSelector } from "@/components/location-selector"

export default function LocationDebugPage() {
  const { currentLocation, user } = useAuth()
  const { locations, getActiveLocations, isLoading } = useLocations()
  const { filterLocations, userLocations, isAdmin } = useLocationFilter()
  const { data: session } = useSession()

  const activeLocations = getActiveLocations()
  const filteredLocations = filterLocations(activeLocations)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Location Debug Information</h1>

      <Card>
        <CardHeader>
          <CardTitle>Location Selector Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Location Selector:</label>
              <div className="mt-2">
                <LocationSelector />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Current Location: {currentLocation || 'None'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Session</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                session: session?.user,
                authUser: user,
                currentLocation,
                isAdmin
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                isLoading,
                locationsCount: locations.length,
                activeLocationsCount: activeLocations.length,
                filteredLocationsCount: filteredLocations.length,
                userLocations
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(locations.map(loc => ({
                id: loc.id,
                name: loc.name,
                status: loc.status
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(activeLocations.map(loc => ({
                id: loc.id,
                name: loc.name,
                status: loc.status
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtered Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(filteredLocations.map(loc => ({
                id: loc.id,
                name: loc.name,
                status: loc.status
              })), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Filter Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>User Locations:</strong> {JSON.stringify(userLocations)}</p>
              <p><strong>Is Admin:</strong> {isAdmin.toString()}</p>
              <p><strong>Session Role:</strong> {session?.user?.role}</p>
              <p><strong>Session Locations:</strong> {JSON.stringify(session?.user?.locations)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
