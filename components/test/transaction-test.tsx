"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { InventoryTransactionService } from "@/lib/inventory-transaction-service"
import { TransactionType, TransactionSource, PaymentMethod } from "@/lib/transaction-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Badge } from "@/components/ui/badge"

export function TransactionTest() {
  const { transactions, addTransaction, getTransactionsBySource } = useTransactions()
  const [isTestRunning, setIsTestRunning] = useState(false)

  const runTransactionTest = async () => {
    setIsTestRunning(true)

    try {
      // Initialize inventory service
      const inventoryService = new InventoryTransactionService(addTransaction)

      console.log("🧪 Starting transaction integration test...")

      // Test 1: Client Portal Product Sale
      console.log("📱 Testing client portal product sale...")
      const clientPortalSale = inventoryService.recordInventorySale(
        "test-product-1",
        "Test Beauty Serum",
        "loc1",
        2,
        15.00, // cost price
        35.00, // sale price
        "test-client-1",
        "Test Customer",
        {
          type: "client_portal_order",
          id: "ORDER-TEST-123"
        }
      )

      // Test 2: POS Product Sale
      console.log("🏪 Testing POS product sale...")
      const posSale = inventoryService.recordProductSale(
        "test-product-2",
        "Test Hair Mask",
        1,
        45.00,
        "test-client-2",
        "Walk-in Customer",
        "staff-1",
        "Emma Johnson",
        "loc1",
        PaymentMethod.CREDIT_CARD,
        {
          type: "pos_sale",
          id: "POS-TEST-456"
        }
      )

      // Test 3: Service Sale
      console.log("💇 Testing service sale...")
      const serviceSale = inventoryService.recordServiceSale(
        "service-1",
        "Haircut & Style",
        75.00,
        "test-client-3",
        "Appointment Customer",
        "staff-2",
        "Sarah Wilson",
        "loc1",
        PaymentMethod.CASH,
        {
          type: "appointment",
          id: "APPT-TEST-789"
        }
      )

      // Test 4: Inventory Purchase
      console.log("📦 Testing inventory purchase...")
      const inventoryPurchase = inventoryService.recordInventoryPurchase(
        "test-product-3",
        "Test Shampoo Bulk",
        10,
        8.50,
        "supplier-1",
        "Beauty Supply Co",
        "loc1",
        {
          type: "purchase_order",
          id: "PO-TEST-101"
        }
      )

      console.log("✅ Transaction integration test completed!")
      console.log("📊 Test results:", {
        clientPortalSale: clientPortalSale.id,
        posSale: posSale.id,
        serviceSale: serviceSale.id,
        inventoryPurchase: inventoryPurchase.id
      })

    } catch (error) {
      console.error("❌ Transaction test failed:", error)
    } finally {
      setIsTestRunning(false)
    }
  }

  const clearTestTransactions = () => {
    // This would need to be implemented in the transaction provider
    console.log("🧹 Clear test transactions functionality would go here")
  }

  // Get transaction counts by source
  const clientPortalTransactions = getTransactionsBySource(TransactionSource.CLIENT_PORTAL)
  const posTransactions = getTransactionsBySource(TransactionSource.POS)
  const calendarTransactions = getTransactionsBySource(TransactionSource.CALENDAR)
  const manualTransactions = getTransactionsBySource(TransactionSource.MANUAL)

  // Helper function to safely calculate totals
  const safeSum = (transactions: any[]) => {
    return transactions
      .filter(t => t && typeof t.amount === 'number' && !isNaN(t.amount) && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const totalRevenue = safeSum(transactions)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Integration Test</CardTitle>
          <CardDescription>
            Test the integration between client portal purchases and main dashboard transaction tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={runTransactionTest}
              disabled={isTestRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isTestRunning ? "Running Test..." : "Run Integration Test"}
            </Button>
            <Button
              onClick={clearTestTransactions}
              variant="outline"
            >
              Clear Test Data
            </Button>
          </div>

          {isTestRunning && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">Running transaction integration test... Check console for details.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All transaction sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientPortalTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              <CurrencyDisplay amount={safeSum(clientPortalTransactions)} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">POS Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              <CurrencyDisplay amount={safeSum(posTransactions)} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totalRevenue} />
            </div>
            <p className="text-xs text-muted-foreground">
              Positive transactions only
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest 10 transactions from all sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                      {transaction.source}
                    </Badge>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.clientName || "No client"} • {new Date(transaction.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${(transaction.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <CurrencyDisplay amount={transaction.amount || 0} />
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {transaction.status?.toLowerCase() || 'unknown'}
                    </p>
                  </div>
                </div>
              ))}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found. Run the integration test to create sample transactions.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
