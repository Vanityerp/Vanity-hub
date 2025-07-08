"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestDbPage() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setError(null)
    try {
      const response = await fetch('/api/init', { method: 'POST' })
      const data = await response.json()
      setResult(data)
      console.log('Init result:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize')
    } finally {
      setIsInitializing(false)
    }
  }

  const seedDatabase = async () => {
    setIsSeeding(true)
    setError(null)
    try {
      const response = await fetch('/api/products/seed', { method: 'POST' })
      const data = await response.json()
      setResult(data)
      console.log('Seed result:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed')
    } finally {
      setIsSeeding(false)
    }
  }

  const testProducts = async () => {
    setIsTesting(true)
    setError(null)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setResult(data)
      console.log('Products result:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Database Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>1. Initialize</CardTitle>
            <CardDescription>Create locations and basic setup</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={initializeDatabase} 
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? "Initializing..." : "Initialize DB"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Seed Products</CardTitle>
            <CardDescription>Add comprehensive product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={seedDatabase} 
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? "Seeding..." : "Seed Products"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Test Products</CardTitle>
            <CardDescription>Fetch products from API</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testProducts} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? "Testing..." : "Test Products API"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
