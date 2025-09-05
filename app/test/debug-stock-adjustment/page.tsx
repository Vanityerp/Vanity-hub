"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { Package, Database, Bug } from "lucide-react"

export default function DebugStockAdjustment() {
  const { currentLocation } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Test database connection
      const dbResponse = await fetch("/api/test-db")
      const dbData = await dbResponse.json()
      console.log("Database test:", dbData)

      // Load products
      const productsResponse = await fetch("/api/products")
      const productsData = await productsResponse.json()
      setProducts(productsData.products || [])

      // Load locations
      const locationsResponse = await fetch("/api/locations")
      const locationsData = await locationsResponse.json()
      setLocations(locationsData.locations || [])

      console.log("Loaded data:", {
        products: productsData.products?.length || 0,
        locations: locationsData.locations?.length || 0
      })
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const testStockAdjustment = async (product: any) => {
    setLoading(true)
    try {
      // Determine location ID
      let locationId = currentLocation
      if (currentLocation === "all") {
        locationId = "loc1"
      }

      const adjustmentData = {
        productId: product.id,
        locationId: locationId,
        adjustmentType: "add",
        quantity: 1,
        reason: "purchase",
        notes: "Debug test"
      }

      console.log("🔄 Testing stock adjustment with data:", adjustmentData)

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentData),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("📡 Raw response:", responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = { error: "Failed to parse response", rawResponse: responseText }
      }

      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        request: adjustmentData
      })

    } catch (error) {
      console.error("❌ Test failed:", error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Debug Stock Adjustment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current Location</div>
              <div className="font-medium">{currentLocation || "Not set"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Products Loaded</div>
              <div className="font-medium">{products.length}</div>
            </div>
          </div>
          
          <Button onClick={loadData} disabled={loading}>
            <Database className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-muted-foreground">No locations found</div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center gap-2">
                  <Badge variant="outline">{location.id}</Badge>
                  <span>{location.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Products</CardTitle>
          <CardDescription>Click to test stock adjustment</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-muted-foreground">No products found</div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {product.id} • Category: {product.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Locations: {product.locations?.length || 0}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => testStockAdjustment(product)}
                    disabled={loading}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Test Adjust
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className={testResult.success ? "text-green-600" : "text-red-600"}>
              Test Result: {testResult.success ? "Success" : "Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Status Code</div>
                <div className="text-sm text-muted-foreground">{testResult.status}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Request Data</div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult.request, null, 2)}
                </pre>
              </div>
              
              <div>
                <div className="text-sm font-medium">Response Data</div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
              
              {testResult.error && (
                <div>
                  <div className="text-sm font-medium text-red-600">Error</div>
                  <div className="text-sm text-red-600">{testResult.error}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
