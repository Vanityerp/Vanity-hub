"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { LocationSelector } from "@/components/location-selector"
import { LocationButtons } from "@/components/location-buttons"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export default function TestLocationSyncPage() {
  const { currentLocation } = useAuth()
  const { locations } = useLocations()
  const [debugInfo, setDebugInfo] = useState<any[]>([])

  // Track location changes for debugging
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString()
    const newDebugEntry = {
      timestamp,
      currentLocation,
      availableLocations: locations.map(loc => ({ id: loc.id, name: loc.name })),
      locationCount: locations.length
    }

    setDebugInfo(prev => [newDebugEntry, ...prev.slice(0, 9)]) // Keep last 10 entries

    console.log("🔍 Location Debug:", newDebugEntry)
  }, [currentLocation, locations])

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Location Synchronization Test</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Location State</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">
            <strong>Current Location:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{currentLocation || "null"}</code>
          </p>
          <div className="text-sm text-gray-600">
            <p><strong>Available Locations:</strong> {locations.length} loaded</p>
            <div className="mt-2 space-y-1">
              {locations.map(loc => (
                <div key={loc.id} className="flex justify-between">
                  <span>ID: <code className="bg-gray-100 px-1 rounded">{loc.id}</code></span>
                  <span>Name: {loc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dropdown Location Selector</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This dropdown should reflect the same location as the horizontal buttons below.
          </p>
          <LocationSelector />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horizontal Location Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            These buttons should reflect the same location as the dropdown above.
          </p>
          <LocationButtons />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <p><strong>1.</strong> Select a location from the dropdown above</p>
              <p><strong>2.</strong> Verify that the corresponding horizontal button becomes highlighted</p>
              <p><strong>3.</strong> Click a different horizontal button</p>
              <p><strong>4.</strong> Verify that the dropdown updates to show the same location</p>
              <p><strong>5.</strong> Check that the "Current Location State" above updates correctly</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Test Across Pages</h4>
              <p className="text-sm text-gray-600 mb-3">
                Navigate to these pages to verify location synchronization persists:
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/appointments">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Appointments
                  </Button>
                </Link>
                <Link href="/dashboard/accounting">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Accounting
                  </Button>
                </Link>
                <Link href="/dashboard/reports">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Reports
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">Recent location state changes (newest first):</p>
            {debugInfo.length === 0 ? (
              <p className="text-gray-400">No debug information yet...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {debugInfo.map((entry, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3 py-1">
                    <div className="font-mono text-xs text-gray-500">{entry.timestamp}</div>
                    <div><strong>Current:</strong> <code className="bg-gray-100 px-1 rounded">{entry.currentLocation || "null"}</code></div>
                    <div><strong>Available:</strong> {entry.locationCount} locations</div>
                    <div className="text-xs text-gray-600">
                      {entry.availableLocations.map((loc: any) => `${loc.id}:${loc.name}`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
