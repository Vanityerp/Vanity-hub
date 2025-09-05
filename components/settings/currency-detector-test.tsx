"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { detectUserCurrency, getUserCurrency } from "@/lib/geolocation"
import { currencies } from "@/lib/currency-data"

export function CurrencyDetectorTest() {
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null)
  const [storedCurrency, setStoredCurrency] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        setIsLoading(true)
        // Get the stored currency
        const stored = getUserCurrency()
        setStoredCurrency(stored)
        
        // Detect the currency based on location
        const detected = await detectUserCurrency()
        setDetectedCurrency(detected)
      } catch (err) {
        console.error('Error detecting currency:', err)
        setError('Failed to detect currency')
      } finally {
        setIsLoading(false)
      }
    }
    
    detectCurrency()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Detection Test</CardTitle>
        <CardDescription>Testing the currency detection functionality</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Detecting your currency...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Detected Currency:</h3>
              <p>
                {detectedCurrency && currencies[detectedCurrency] 
                  ? `${currencies[detectedCurrency].code} - ${currencies[detectedCurrency].name} (${currencies[detectedCurrency].symbol})`
                  : 'No currency detected'}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Stored Currency Preference:</h3>
              <p>
                {storedCurrency && currencies[storedCurrency]
                  ? `${currencies[storedCurrency].code} - ${currencies[storedCurrency].name} (${currencies[storedCurrency].symbol})`
                  : 'No stored preference'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
