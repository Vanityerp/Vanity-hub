"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plus, RefreshCw, CheckCircle } from "lucide-react"

export default function FixLocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const loadLocations = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
        setMessage(`✅ Loaded ${data.locations?.length || 0} locations`)
      } else {
        throw new Error("Failed to load locations")
      }
    } catch (error) {
      console.error("Error loading locations:", error)
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultLocations = async () => {
    setLoading(true)
    try {
      const defaultLocations = [
        {
          name: 'D-ring road',
          address: '123 D-Ring Road',
          city: 'Doha',
          state: 'Doha',
          zipCode: '12345',
          country: 'Qatar',
          phone: '(974) 123-4567',
          email: 'dring@vanityhub.com'
        },
        {
          name: 'Muaither',
          address: '456 Muaither St',
          city: 'Doha',
          state: 'Doha',
          zipCode: '23456',
          country: 'Qatar',
          phone: '(974) 234-5678',
          email: 'muaither@vanityhub.com'
        },
        {
          name: 'Medinat Khalifa',
          address: '789 Medinat Khalifa Blvd',
          city: 'Doha',
          state: 'Doha',
          zipCode: '34567',
          country: 'Qatar',
          phone: '(974) 345-6789',
          email: 'medinat@vanityhub.com'
        },
        {
          name: 'Home service',
          address: 'Client\'s Location',
          city: 'Doha',
          state: 'Doha',
          zipCode: '',
          country: 'Qatar',
          phone: '(974) 456-7890',
          email: 'homeservice@vanityhub.com'
        },
        {
          name: 'Online store',
          address: 'Virtual Location',
          city: 'Doha',
          state: 'Doha',
          zipCode: '',
          country: 'Qatar',
          phone: '(974) 567-8901',
          email: 'online@vanityhub.com'
        }
      ]

      let created = 0
      let errors = 0

      for (const location of defaultLocations) {
        try {
          const response = await fetch("/api/locations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(location),
          })

          if (response.ok) {
            created++
            console.log(`✅ Created location: ${location.name}`)
          } else {
            const errorData = await response.json()
            console.error(`❌ Failed to create ${location.name}:`, errorData)
            errors++
          }
        } catch (error) {
          console.error(`❌ Error creating ${location.name}:`, error)
          errors++
        }
      }

      setMessage(`✅ Created ${created} locations, ${errors} errors`)
      loadLocations() // Refresh the list
    } catch (error) {
      console.error("Error creating locations:", error)
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testStockAdjustment = async () => {
    if (locations.length === 0) {
      setMessage("❌ No locations available for testing")
      return
    }

    setLoading(true)
    try {
      // Get a sample product first
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()
      const products = productsData.products || []

      if (products.length === 0) {
        setMessage("❌ No products available for testing")
        return
      }

      const testProduct = products[0]
      const testLocation = locations[0]

      const adjustmentData = {
        productId: testProduct.id,
        locationId: testLocation.id,
        adjustmentType: "add",
        quantity: 1,
        reason: "purchase",
        notes: "Location fix test"
      }

      console.log("🧪 Testing stock adjustment with:", adjustmentData)

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentData),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`✅ Stock adjustment test successful! Used location: ${testLocation.name}`)
        console.log("✅ Test result:", result)
      } else {
        const errorData = await response.json()
        setMessage(`❌ Stock adjustment test failed: ${errorData.error}`)
        console.error("❌ Test failed:", errorData)
      }
    } catch (error) {
      console.error("Error testing stock adjustment:", error)
      setMessage(`❌ Test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Fix Locations for Stock Adjustment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Management</CardTitle>
          <CardDescription>
            Ensure locations exist in the database for stock adjustments to work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={loadLocations} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Load Locations
            </Button>
            <Button onClick={createDefaultLocations} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Default Locations
            </Button>
            <Button onClick={testStockAdjustment} disabled={loading || locations.length === 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Stock Adjustment
            </Button>
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-700' :
              message.includes('❌') ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Locations</CardTitle>
          <CardDescription>
            {locations.length} locations found in database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No locations found. Click "Create Default Locations" to add them.
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{location.name}</span>
                      <Badge variant="outline">{location.id.substring(0, 8)}...</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {location.address}, {location.city}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {location.phone} • {location.email}
                    </div>
                  </div>
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>💡 Fix Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Load Locations" to see current locations in database</li>
          <li>If no locations exist, click "Create Default Locations"</li>
          <li>Click "Test Stock Adjustment" to verify the fix works</li>
          <li>Go back to the main inventory page and try adjusting stock</li>
        </ul>
      </div>
    </div>
  )
}
