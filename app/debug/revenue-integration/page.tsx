"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { integratedAnalyticsService } from "@/lib/integrated-analytics-service"
import { ShoppingCart, Calendar, CreditCard, RefreshCw, DollarSign } from "lucide-react"

export default function RevenueIntegrationDebugPage() {
  const { transactions, addTransaction, filterTransactions } = useTransactions()
  const { toast } = useToast()
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Create a test client portal transaction (simulating real checkout)
  const createTestClientPortalTransaction = () => {
    setIsTestRunning(true)

    const transaction = {
      date: new Date(),
      clientId: "test-client-123",
      clientName: "Test Client",
      type: TransactionType.PRODUCT_SALE,
      category: "Online Product Sale",
      description: "Client Portal Test Order - Hair Serum",
      amount: 89.99,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.PENDING, // Start as PENDING like real client portal orders
      location: "online", // Use "online" location like real client portal
      source: TransactionSource.CLIENT_PORTAL,
      reference: {
        type: "client_portal_order",
        id: `test-order-${Date.now()}`
      },
      items: [
        {
          id: "product-serum",
          name: "Hair Serum",
          quantity: 1,
          unitPrice: 89.99,
          totalPrice: 89.99,
          cost: 35.00
        }
      ],
      metadata: {
        isOnlineTransaction: true,
        testTransaction: true,
        orderData: {
          id: `test-order-${Date.now()}`,
          clientId: "test-client-123",
          items: [
            {
              product: {
                id: "product-serum",
                name: "Hair Serum",
                price: 89.99
              },
              quantity: 1
            }
          ],
          subtotal: 89.99,
          total: 89.99,
          paymentMethod: "card",
          status: "pending"
        },
        itemCount: 1,
        totalCost: 35.00,
        totalProfit: 54.99
      }
    }

    console.log('🧪 Creating test client portal transaction (simulating real checkout):', transaction)
    const result = addTransaction(transaction)
    console.log('✅ Transaction created:', result)

    toast({
      title: "Test Client Portal Transaction Created",
      description: `Client portal transaction of $${transaction.amount} created successfully (PENDING status)`,
    })

    setIsTestRunning(false)
    refreshAnalytics()
  }

  // Create multiple test transactions to simulate a busy day
  const createMultipleTestTransactions = () => {
    setIsTestRunning(true)

    const transactions = [
      {
        date: new Date(),
        clientId: "client-001",
        clientName: "Sarah Johnson",
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: "Client Portal Order - Shampoo & Conditioner Set",
        amount: 45.99,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.COMPLETED,
        location: "online",
        source: TransactionSource.CLIENT_PORTAL,
        reference: { type: "client_portal_order", id: `order-${Date.now()}-1` },
        metadata: { isOnlineTransaction: true, testTransaction: true }
      },
      {
        date: new Date(),
        clientId: "client-002",
        clientName: "Mike Chen",
        type: TransactionType.SERVICE_SALE,
        category: "Appointment Service",
        description: "Haircut & Style",
        amount: 75.00,
        paymentMethod: PaymentMethod.CASH,
        status: TransactionStatus.COMPLETED,
        location: "loc1",
        source: TransactionSource.CALENDAR,
        reference: { type: "appointment", id: `apt-${Date.now()}-1` },
        metadata: { testTransaction: true }
      },
      {
        date: new Date(),
        clientId: "client-003",
        clientName: "Emma Davis",
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: "Client Portal Order - Hair Mask",
        amount: 32.50,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.PENDING,
        location: "online",
        source: TransactionSource.CLIENT_PORTAL,
        reference: { type: "client_portal_order", id: `order-${Date.now()}-2` },
        metadata: { isOnlineTransaction: true, testTransaction: true }
      }
    ]

    transactions.forEach((transaction, index) => {
      setTimeout(() => {
        console.log(`🧪 Creating test transaction ${index + 1}:`, transaction)
        const result = addTransaction(transaction)
        console.log(`✅ Transaction ${index + 1} created:`, result)

        if (index === transactions.length - 1) {
          setIsTestRunning(false)
          refreshAnalytics()
          toast({
            title: "Multiple Test Transactions Created",
            description: `Created ${transactions.length} test transactions (mix of client portal and appointments)`,
          })
        }
      }, index * 500) // Stagger creation by 500ms
    })
  }

  // Create a test appointment transaction
  const createTestAppointmentTransaction = () => {
    setIsTestRunning(true)

    const transaction = {
      date: new Date(),
      clientId: "test-client-456",
      clientName: "Test Appointment Client",
      staffId: "staff-1",
      staffName: "Emma Johnson",
      type: TransactionType.SERVICE_SALE,
      category: "Appointment Service",
      description: "Test Appointment - Haircut & Style",
      amount: 75.00,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: "loc1",
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: `test-appointment-${Date.now()}`
      },
      metadata: {
        testTransaction: true
      }
    }

    console.log('🧪 Creating test appointment transaction:', transaction)
    const result = addTransaction(transaction)
    console.log('✅ Transaction created:', result)

    toast({
      title: "Test Transaction Created",
      description: `Appointment transaction of ${transaction.amount} created successfully`,
    })

    setIsTestRunning(false)
    refreshAnalytics()
  }

  // Refresh analytics data
  const refreshAnalytics = () => {
    try {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      const analytics = integratedAnalyticsService.getAnalytics(startOfToday, endOfToday)

      // Also get filtered transactions for today
      const todayTransactions = filterTransactions({
        startDate: startOfToday,
        endDate: endOfToday
      })

      setAnalyticsData({
        ...analytics,
        todayTransactions: todayTransactions.length,
        clientPortalTransactions: todayTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length,
        appointmentTransactions: todayTransactions.filter(t => t.source === TransactionSource.CALENDAR).length
      })

      console.log('📊 Analytics refreshed:', {
        totalRevenue: analytics.totalRevenue,
        serviceRevenue: analytics.serviceRevenue,
        productRevenue: analytics.productRevenue,
        todayTransactions: todayTransactions.length,
        clientPortalCount: todayTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length
      })
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    }
  }

  // Refresh analytics on component mount and when transactions change
  useEffect(() => {
    refreshAnalytics()
  }, [transactions])

  const clientPortalTransactions = transactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL)
  const appointmentTransactions = transactions.filter(t => t.source === TransactionSource.CALENDAR)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Revenue Integration Debug</h1>
        <p className="text-gray-600 mt-2">
          Test and debug the integration between client portal transactions and admin dashboard revenue tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Transaction Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Transaction Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <Badge variant="outline">{transactions.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Client Portal:</span>
                <Badge variant="outline">{clientPortalTransactions.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Appointments:</span>
                <Badge variant="outline">{appointmentTransactions.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-medium">
                  <CurrencyDisplay amount={analyticsData?.totalRevenue || 0} />
                </span>
              </div>
              <div className="flex justify-between">
                <span>Products:</span>
                <span className="font-medium">
                  <CurrencyDisplay amount={analyticsData?.productRevenue || 0} />
                </span>
              </div>
              <div className="flex justify-between">
                <span>Services:</span>
                <span className="font-medium">
                  <CurrencyDisplay amount={analyticsData?.serviceRevenue || 0} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-500" />
              Test Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={createTestClientPortalTransaction}
              disabled={isTestRunning}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add Client Portal Sale
            </Button>
            <Button
              onClick={createTestAppointmentTransaction}
              disabled={isTestRunning}
              className="w-full"
              size="sm"
              variant="outline"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Add Appointment Sale
            </Button>
            <Button
              onClick={createMultipleTestTransactions}
              disabled={isTestRunning}
              className="w-full"
              size="sm"
              variant="secondary"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Create Multiple Sales
            </Button>
            <Button
              onClick={refreshAnalytics}
              className="w-full"
              size="sm"
              variant="secondary"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              Analytics Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Today's Txns:</span>
                <Badge variant="outline">{analyticsData?.todayTransactions || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Client Portal:</span>
                <Badge variant="outline">{analyticsData?.clientPortalTransactions || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Appointments:</span>
                <Badge variant="outline">{analyticsData?.appointmentTransactions || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest transactions from all sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions found. Create some test transactions to see them here.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transactions.slice(-10).reverse().map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{transaction.id}</h3>
                      <p className="text-xs text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.clientName} • {new Date(transaction.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        <CurrencyDisplay amount={transaction.amount} />
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {transaction.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{transaction.type}</span>
                    <span>{transaction.paymentMethod}</span>
                    <span>{transaction.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
