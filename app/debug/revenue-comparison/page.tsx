"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { useLocations } from "@/lib/location-provider"
import { TransactionType, TransactionSource, TransactionStatus } from "@/lib/transaction-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Badge } from "@/components/ui/badge"

export default function RevenueComparisonPage() {
  const { transactions } = useTransactions()
  const { locations } = useLocations()
  const [comparisonData, setComparisonData] = useState<any[]>([])

  useEffect(() => {
    console.log('🔍 REVENUE COMPARISON: Starting analysis')
    console.log('🔍 REVENUE COMPARISON: Total transactions:', transactions.length)
    console.log('🔍 REVENUE COMPARISON: Total locations:', locations.length)

    // Get physical locations (excluding special ones)
    const physicalLocations = locations.filter(loc => 
      loc.status === "Active" && 
      loc.id !== "online" && 
      loc.id !== "home"
    )

    console.log('🔍 REVENUE COMPARISON: Physical locations:', physicalLocations.map(l => ({ id: l.id, name: l.name })))

    const comparison = physicalLocations.map(location => {
      console.log(`\n--- ANALYZING LOCATION: ${location.name} (${location.id}) ---`)

      // Method 1: Test page method (all transaction types, exclude cancelled)
      const testPageTransactions = transactions.filter(t => 
        t.location === location.id && 
        t.status !== TransactionStatus.CANCELLED
      )
      const testPageRevenue = testPageTransactions.reduce((sum, t) => sum + t.amount, 0)

      console.log('📊 Test Page Method:')
      console.log('  - Transactions found:', testPageTransactions.length)
      console.log('  - Revenue:', testPageRevenue)
      console.log('  - Transaction details:', testPageTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status
      })))

      // Method 2: Location performance method (specific transaction types, exclude cancelled)
      const locationPerformanceTransactions = transactions.filter(t =>
        t.location === location.id &&
        t.status !== TransactionStatus.CANCELLED &&
        (t.type === TransactionType.PRODUCT_SALE ||
         t.type === TransactionType.SERVICE_SALE ||
         t.type === TransactionType.INVENTORY_SALE ||
         t.type === TransactionType.INCOME)
      )
      const locationPerformanceRevenue = locationPerformanceTransactions.reduce((sum, t) => sum + t.amount, 0)

      console.log('📍 Location Performance Method:')
      console.log('  - Transactions found:', locationPerformanceTransactions.length)
      console.log('  - Revenue:', locationPerformanceRevenue)
      console.log('  - Transaction details:', locationPerformanceTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status
      })))

      // Check for transactions that might be excluded by type filtering
      const excludedByType = testPageTransactions.filter(t =>
        !(t.type === TransactionType.PRODUCT_SALE ||
          t.type === TransactionType.SERVICE_SALE ||
          t.type === TransactionType.INVENTORY_SALE ||
          t.type === TransactionType.INCOME)
      )

      console.log('❌ Transactions excluded by type filtering:', excludedByType.length)
      if (excludedByType.length > 0) {
        console.log('  - Excluded transaction types:', excludedByType.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount
        })))
      }

      return {
        location: location.name,
        locationId: location.id,
        testPageRevenue,
        locationPerformanceRevenue,
        testPageTransactionCount: testPageTransactions.length,
        locationPerformanceTransactionCount: locationPerformanceTransactions.length,
        excludedTransactionCount: excludedByType.length,
        match: Math.abs(testPageRevenue - locationPerformanceRevenue) < 0.01
      }
    })

    console.log('\n🔍 REVENUE COMPARISON: Final comparison data:', comparison)
    setComparisonData(comparison)
  }, [transactions, locations])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Calculation Comparison</h1>
          <p className="text-muted-foreground">
            Compare revenue calculations between test page and location performance methods
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {comparisonData.map((data, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{data.location}</span>
                <Badge variant={data.match ? "default" : "destructive"}>
                  {data.match ? "Match" : "Mismatch"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-600">Test Page Method</h3>
                  <p className="text-sm text-muted-foreground">All transaction types, exclude cancelled</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      <CurrencyDisplay amount={data.testPageRevenue} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.testPageTransactionCount} transactions
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-600">Location Performance Method</h3>
                  <p className="text-sm text-muted-foreground">Specific transaction types, exclude cancelled</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      <CurrencyDisplay amount={data.locationPerformanceRevenue} />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.locationPerformanceTransactionCount} transactions
                    </p>
                  </div>
                </div>
              </div>

              {data.excludedTransactionCount > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ {data.excludedTransactionCount} transactions excluded by type filtering
                  </p>
                </div>
              )}

              {!data.match && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ❌ Revenue mismatch detected. Check console for detailed analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Locations</p>
              <p className="text-2xl font-bold">{[...new Set(transactions.map(t => t.location))].length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction Types</p>
              <p className="text-2xl font-bold">{[...new Set(transactions.map(t => t.type))].length}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Transaction Locations:</h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(transactions.map(t => t.location))].map(location => (
                <Badge key={location} variant="outline">
                  {location} ({transactions.filter(t => t.location === location).length})
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Transaction Types:</h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(transactions.map(t => t.type))].map(type => (
                <Badge key={type} variant="outline">
                  {type} ({transactions.filter(t => t.type === type).length})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
