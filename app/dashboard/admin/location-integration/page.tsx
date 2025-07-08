"use client"

import { useAuth } from "@/lib/auth-provider"
import { LocationIntegrationPanel } from "@/components/admin/location-integration-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Info } from "lucide-react"

export default function LocationIntegrationPage() {
  const { hasPermission } = useAuth()

  // Check if user has admin permissions
  if (!hasPermission("manage_settings")) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <MapPin className="h-6 w-6" />
        <div>
          <h1 className="text-3xl font-bold">Location Integration Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage relationships between services, staff, and locations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            This panel helps you ensure that all services and staff members are properly linked to locations.
            Proper location integration is essential for:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Accurate service availability across different locations</li>
            <li>Proper staff scheduling and assignment</li>
            <li>Location-based filtering and reporting</li>
            <li>Consistent booking and appointment management</li>
            <li>Proper inventory and resource allocation</li>
          </ul>
        </CardContent>
      </Card>

      <LocationIntegrationPanel />

      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Service-Location Relationships</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>All services should be available at all locations unless specifically restricted</li>
              <li>Use location-specific pricing when services have different costs at different locations</li>
              <li>Regularly sync relationships when adding new services or locations</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Staff-Location Assignments</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Staff members should be assigned to their primary working locations</li>
              <li>Multi-location staff can be assigned to multiple locations</li>
              <li>Home service staff should have the "Home Service" flag enabled</li>
              <li>Inactive staff should not be assigned to any locations</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Data Consistency</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Run sync operations after bulk imports or data migrations</li>
              <li>Monitor completion percentages to ensure full integration</li>
              <li>Address any orphaned records (services/staff without locations)</li>
              <li>Regularly review and update location assignments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
