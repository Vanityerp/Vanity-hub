"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, Minus, RefreshCw, Bug } from "lucide-react"

export default function StockAdjustmentDebug() {
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("remove")
  const [quantity, setQuantity] = useState("70")
  const [reason, setReason] = useState("transfer")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, locationsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/locations")
      ])
      
      const productsData = await productsRes.json()
      const locationsData = await locationsRes.json()
      
      setProducts(productsData.products || [])
      setLocations(locationsData.locations || [])
      
      // Auto-select first product and location
      if (productsData.products?.length > 0) {
        setSelectedProduct(productsData.products[0])
      }
      if (locationsData.locations?.length > 0) {
        setSelectedLocation(locationsData.locations[0].id)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const testStockAdjustment = async () => {
    if (!selectedProduct || !selectedLocation) {
      addResult("❌ Error", "Please select a product and location")
      return
    }

    setLoading(true)
    try {
      const adjustmentData = {
        productId: selectedProduct.id,
        locationId: selectedLocation,
        adjustmentType: adjustmentType,
        quantity: parseInt(quantity),
        reason: reason,
        notes: `Debug test - ${adjustmentType} ${quantity} units`
      }

      console.log("🧪 Testing stock adjustment:", adjustmentData)
      addResult("📤 Request", adjustmentData)

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentData),
      })

      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { rawResponse: responseText }
      }

      addResult(
        response.ok ? "✅ Success" : "❌ Error",
        {
          status: response.status,
          ok: response.ok,
          data: responseData
        }
      )

      if (response.ok) {
        // Refresh product data to see updated stock
        await loadData()
      }

    } catch (error) {
      console.error("Test failed:", error)
      addResult("❌ Exception", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const addResult = (type: string, data: any) => {
    setResults(prev => [...prev, {
      type,
      data,
      timestamp: new Date().toISOString()
    }])
  }

  const clearResults = () => {
    setResults([])
  }

  const getCurrentStock = () => {
    if (!selectedProduct || !selectedLocation) return "N/A"
    
    // Find the stock for the selected location
    const locationStock = selectedProduct.locations?.find((loc: any) => 
      loc.locationId === selectedLocation
    )
    
    return locationStock?.stock ?? 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Stock Adjustment Debug Tool</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configure and test stock adjustments to debug the issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select 
                value={selectedProduct?.id || ""} 
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value)
                  setSelectedProduct(product)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: "add" | "remove") => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedProduct && selectedLocation && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <strong>Current Stock:</strong> {getCurrentStock()} units
              </div>
              <div className="text-sm">
                <strong>After Adjustment:</strong> {
                  adjustmentType === "add" 
                    ? getCurrentStock() + parseInt(quantity || "0")
                    : getCurrentStock() - parseInt(quantity || "0")
                } units
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={testStockAdjustment} disabled={loading}>
              {adjustmentType === "add" ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
              Test {adjustmentType === "add" ? "Add" : "Remove"} {quantity} Units
            </Button>
            <Button onClick={loadData} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {results.length} test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={result.type.includes("✅") ? "default" : result.type.includes("❌") ? "destructive" : "secondary"}>
                      {result.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p><strong>💡 Debug Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Select the "Clip-In Hair Extensions - 18 inch" product</li>
          <li>Set adjustment type to "Remove Stock"</li>
          <li>Set quantity to 70</li>
          <li>Click "Test Remove 70 Units"</li>
          <li>Check the results to see what's happening</li>
          <li>Look at browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  )
}
