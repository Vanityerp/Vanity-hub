"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, Play, Database, Package } from "lucide-react"

export default function ApiDebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      timestamp: new Date().toISOString()
    }])
  }

  const clearResults = () => {
    setResults([])
  }

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFn()
      addResult(testName, true, result)
      console.log(`✅ Test passed: ${testName}`, result)
    } catch (error) {
      addResult(testName, false, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      })
      console.error(`❌ Test failed: ${testName}`, error)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    clearResults()

    // Test 1: Check API endpoint exists
    await runTest("API Endpoint Check", async () => {
      const response = await fetch("/api/inventory/adjust")
      const data = await response.json()
      return { status: response.status, data }
    })

    // Test 2: Check database connection
    await runTest("Database Connection", async () => {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      return { status: response.status, data }
    })

    // Test 3: Get sample product and location
    await runTest("Get Sample Data", async () => {
      const [productsRes, locationsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/locations")
      ])
      
      const products = await productsRes.json()
      const locations = await locationsRes.json()
      
      return {
        products: products.products?.slice(0, 3) || [],
        locations: locations.locations?.slice(0, 3) || []
      }
    })

    // Test 4: Test inventory adjustment with minimal data
    await runTest("Minimal Inventory Adjustment", async () => {
      const testPayload = {
        productId: "test-product-id",
        locationId: "loc1",
        quantity: 1,
        adjustmentType: "add",
        reason: "purchase"
      }

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      })

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText }
      }

      return {
        status: response.status,
        ok: response.ok,
        payload: testPayload,
        response: data
      }
    })

    // Test 5: Test with real product if available
    await runTest("Real Product Adjustment", async () => {
      // Get a real product first
      const productsRes = await fetch("/api/products")
      const productsData = await productsRes.json()
      const products = productsData.products || []
      
      if (products.length === 0) {
        throw new Error("No products available for testing")
      }

      const testProduct = products[0]
      const testPayload = {
        productId: testProduct.id,
        locationId: "loc1",
        quantity: 1,
        adjustmentType: "add",
        reason: "purchase",
        notes: "API debug test"
      }

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      })

      const responseText = await response.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { rawResponse: responseText }
      }

      return {
        status: response.status,
        ok: response.ok,
        product: {
          id: testProduct.id,
          name: testProduct.name
        },
        payload: testPayload,
        response: data
      }
    })

    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">API Debug Console</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run comprehensive tests to debug the inventory adjustment API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {loading ? "Running Tests..." : "Run All Tests"}
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
              {results.filter(r => r.success).length} passed, {results.filter(r => !r.success).length} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "✅ PASS" : "❌ FAIL"}
                      </Badge>
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium mb-2">
                        View Details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p><strong>💡 Debug Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Run all tests to identify where the API is failing</li>
          <li>Check the browser console for detailed logs</li>
          <li>Look for specific error messages in the test results</li>
          <li>Pay attention to the "Real Product Adjustment" test result</li>
        </ul>
      </div>
    </div>
  )
}
