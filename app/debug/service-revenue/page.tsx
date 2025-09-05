"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { integratedAnalyticsService } from "@/lib/integrated-analytics-service"
import { useToast } from "@/hooks/use-toast"

export default function ServiceRevenueDebugPage() {
  const { transactions, addTransaction } = useTransactions()
  const { toast } = useToast()
  const [isTestRunning, setIsTestRunning] = useState(false)

  // Create a test service transaction
  const createTestServiceTransaction = () => {
    setIsTestRunning(true)

    const serviceTransaction = {
      date: new Date(),
      clientId: "test-service-client-123",
      clientName: "Test Service Client",
      staffId: "staff-1",
      staffName: "Emma Johnson",
      type: TransactionType.SERVICE_SALE,
      category: "Appointment Service",
      description: "DEBUG: Test Service Transaction - Haircut & Style",
      amount: 75.00,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: "loc1",
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: `debug-service-appointment-${Date.now()}`
      },
      items: [
        {
          id: "service-1",
          name: "Haircut & Style",
          quantity: 1,
          unitPrice: 75.00,
          totalPrice: 75.00,
          category: "Service"
        }
      ],
      metadata: {
        testTransaction: true,
        isServiceTransaction: true,
        debugSource: "service-revenue-debug-page"
      }
    }

    console.log('🔧 DEBUG: Creating test service transaction:', serviceTransaction)

    try {
      const result = addTransaction(serviceTransaction)
      console.log('🔧 DEBUG: Service transaction created:', result)

      // Verify the transaction was added
      setTimeout(() => {
        const allTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]')
        const serviceTransactions = allTransactions.filter(tx => 
          tx.type === 'service_sale' && 
          tx.source === 'calendar'
        )
        console.log('🔧 DEBUG: Service transactions in storage:', serviceTransactions.length)
        console.log('🔧 DEBUG: All service transactions:', serviceTransactions)

        // Get analytics to see if service revenue is calculated
        const analytics = integratedAnalyticsService.getAnalytics()
        console.log('🔧 DEBUG: Analytics after service transaction:', {
          totalRevenue: analytics.totalRevenue,
          serviceRevenue: analytics.serviceRevenue,
          productRevenue: analytics.productRevenue
        })

        toast({
          title: "Service Transaction Created",
          description: `Test service transaction of QAR 75.00 created successfully. Service revenue: QAR ${analytics.serviceRevenue}`,
        })

        setIsTestRunning(false)
      }, 500)

    } catch (error) {
      console.error('🔧 DEBUG: Error creating service transaction:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create test service transaction",
      })
      setIsTestRunning(false)
    }
  }

  // Analyze current service revenue
  const analyzeServiceRevenue = () => {
    console.log('🔧 DEBUG: Analyzing current service revenue...')

    const allTransactions = transactions
    const serviceTransactions = allTransactions.filter(tx =>
      tx.type === TransactionType.SERVICE_SALE &&
      tx.status !== TransactionStatus.CANCELLED
    )
    const calendarServiceTransactions = serviceTransactions.filter(tx =>
      tx.source === TransactionSource.CALENDAR
    )

    const serviceRevenue = serviceTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const calendarServiceRevenue = calendarServiceTransactions.reduce((sum, tx) => sum + tx.amount, 0)

    console.log('🔧 DEBUG: Service revenue analysis:', {
      totalTransactions: allTransactions.length,
      serviceTransactions: serviceTransactions.length,
      calendarServiceTransactions: calendarServiceTransactions.length,
      serviceRevenue,
      calendarServiceRevenue,
      serviceTransactionDetails: serviceTransactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        source: tx.source,
        description: tx.description,
        reference: tx.reference
      }))
    })

    // Get analytics
    const analytics = integratedAnalyticsService.getAnalytics()
    console.log('🔧 DEBUG: Analytics service revenue:', {
      totalRevenue: analytics.totalRevenue,
      serviceRevenue: analytics.serviceRevenue,
      productRevenue: analytics.productRevenue
    })

    // Test transaction overview component calculations
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const todayTransactions = allTransactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= todayStart && txDate <= todayEnd
    })

    const todayServiceTransactions = todayTransactions.filter(tx =>
      tx.type === TransactionType.SERVICE_SALE && tx.status !== TransactionStatus.CANCELLED
    )

    const todayServiceRevenue = todayServiceTransactions.reduce((sum, tx) => sum + tx.amount, 0)

    console.log('🔧 DEBUG: Transaction Overview Analysis:', {
      todayTransactions: todayTransactions.length,
      todayServiceTransactions: todayServiceTransactions.length,
      todayServiceRevenue,
      calendarTransactionsToday: todayTransactions.filter(tx => tx.source === TransactionSource.CALENDAR).length
    })

    // Test sales analytics calculations
    const productSales = allTransactions.filter(tx =>
      tx.type === TransactionType.PRODUCT_SALE && tx.status !== TransactionStatus.CANCELLED
    )
    const productRevenue = productSales.reduce((sum, tx) => sum + tx.amount, 0)

    console.log('🔧 DEBUG: Sales Analytics Analysis:', {
      serviceTransactionsForChart: serviceTransactions.length,
      productTransactionsForChart: productSales.length,
      serviceRevenueForChart: serviceRevenue,
      productRevenueForChart: productRevenue,
      typeBreakdown: [
        { name: "Service Sales", value: serviceRevenue, count: serviceTransactions.length },
        { name: "Product Sales", value: productRevenue, count: productSales.length }
      ]
    })

    toast({
      title: "Service Revenue Analysis Complete",
      description: `Found ${serviceTransactions.length} service transactions totaling QAR ${serviceRevenue.toFixed(2)}. Analytics shows QAR ${analytics.serviceRevenue.toFixed(2)}. Check console for detailed breakdown.`,
    })
  }

  // Create a test completed appointment to verify transaction creation
  const createTestCompletedAppointment = () => {
    setIsTestRunning(true)

    const testAppointment = {
      id: `debug-completed-apt-${Date.now()}`,
      clientId: "test-client-completed",
      clientName: "Test Completed Client",
      staffId: "staff-1",
      staffName: "Emma Johnson",
      service: "Haircut & Style",
      serviceId: "1",
      date: new Date().toISOString(),
      duration: 60,
      status: "completed",
      location: "loc1",
      price: 75,
      bookingReference: `VH-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          updatedBy: "Staff"
        },
        {
          status: "completed",
          timestamp: new Date().toISOString(),
          updatedBy: "Staff"
        }
      ]
    }

    console.log('🔧 DEBUG: Creating test completed appointment:', testAppointment)

    // Save to localStorage
    const existingAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]')
    existingAppointments.push(testAppointment)
    localStorage.setItem('vanity_appointments', JSON.stringify(existingAppointments))

    toast({
      title: "Test Appointment Created",
      description: "Created a completed appointment. Check if service transaction is automatically created.",
    })

    setIsTestRunning(false)
  }

  // Test all transaction display components
  const testAllComponents = () => {
    console.log('🔧 DEBUG: Testing all transaction display components...')

    // Create multiple test transactions to verify display
    const testTransactions = [
      {
        date: new Date(),
        clientId: "test-service-client-1",
        clientName: "Service Test Client 1",
        staffId: "staff-1",
        staffName: "Emma Johnson",
        type: TransactionType.SERVICE_SALE,
        category: "Appointment Service",
        description: "TEST: Haircut & Style Service",
        amount: 85.00,
        paymentMethod: PaymentMethod.CASH,
        status: TransactionStatus.COMPLETED,
        location: "loc1",
        source: TransactionSource.CALENDAR,
        reference: { type: "appointment", id: `test-apt-${Date.now()}-1` },
        metadata: { testTransaction: true, componentTest: true }
      },
      {
        date: new Date(),
        clientId: "test-service-client-2",
        clientName: "Service Test Client 2",
        staffId: "staff-2",
        staffName: "Michael Chen",
        type: TransactionType.SERVICE_SALE,
        category: "Appointment Service",
        description: "TEST: Color & Highlights Service",
        amount: 150.00,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.COMPLETED,
        location: "loc1",
        source: TransactionSource.CALENDAR,
        reference: { type: "appointment", id: `test-apt-${Date.now()}-2` },
        metadata: { testTransaction: true, componentTest: true }
      },
      {
        date: new Date(),
        clientId: "test-product-client-1",
        clientName: "Product Test Client 1",
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: "TEST: Hair Serum Product",
        amount: 45.99,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.COMPLETED,
        location: "online",
        source: TransactionSource.CLIENT_PORTAL,
        reference: { type: "client_portal_order", id: `test-order-${Date.now()}` },
        metadata: { testTransaction: true, componentTest: true }
      }
    ]

    console.log('🔧 DEBUG: Creating test transactions for component testing:', testTransactions)

    // Add all test transactions
    testTransactions.forEach((transaction, index) => {
      setTimeout(() => {
        addTransaction(transaction)
        console.log(`🔧 DEBUG: Added test transaction ${index + 1}:`, transaction)
      }, index * 100)
    })

    // Verify after all transactions are added
    setTimeout(() => {
      const analytics = integratedAnalyticsService.getAnalytics()
      console.log('🔧 DEBUG: Analytics after component test transactions:', {
        totalRevenue: analytics.totalRevenue,
        serviceRevenue: analytics.serviceRevenue,
        productRevenue: analytics.productRevenue
      })

      toast({
        title: "Component Test Transactions Created",
        description: `Created ${testTransactions.length} test transactions. Check dashboard, accounting, and analytics pages to verify service revenue display.`,
      })
    }, 500)
  }

  // Clear all test transactions
  const clearTestTransactions = () => {
    const allTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]')
    const nonTestTransactions = allTransactions.filter(tx => !tx.metadata?.testTransaction)

    localStorage.setItem('vanity_transactions', JSON.stringify(nonTestTransactions))

    // Also clear test appointments
    const allAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]')
    const nonTestAppointments = allAppointments.filter(apt => !apt.id.includes('debug-completed-apt'))
    localStorage.setItem('vanity_appointments', JSON.stringify(nonTestAppointments))

    // Force refresh of transaction provider
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Service Revenue Debug</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Test Service Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a test service transaction to verify service revenue tracking.
            </p>
            <Button
              onClick={createTestServiceTransaction}
              disabled={isTestRunning}
              className="w-full"
            >
              {isTestRunning ? "Creating..." : "Create Test Service Transaction"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyze Service Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze current service transactions and revenue calculations.
            </p>
            <Button
              onClick={analyzeServiceRevenue}
              variant="outline"
              className="w-full"
            >
              Analyze Service Revenue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Completed Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a completed appointment to test automatic transaction creation.
            </p>
            <Button
              onClick={createTestCompletedAppointment}
              disabled={isTestRunning}
              variant="secondary"
              className="w-full"
            >
              {isTestRunning ? "Creating..." : "Create Completed Appointment"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test All Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create multiple test transactions to verify all display components.
            </p>
            <Button
              onClick={testAllComponents}
              disabled={isTestRunning}
              variant="secondary"
              className="w-full"
            >
              Test All Components
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clear Test Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remove all test transactions and appointments from the system.
            </p>
            <Button
              onClick={clearTestTransactions}
              variant="destructive"
              className="w-full"
            >
              Clear Test Data
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Service Transactions</p>
              <p className="text-2xl font-bold">
                {transactions.filter(tx => tx.type === TransactionType.SERVICE_SALE).length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Calendar Transactions</p>
              <p className="text-2xl font-bold">
                {transactions.filter(tx => tx.source === TransactionSource.CALENDAR).length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Service Revenue</p>
              <p className="text-2xl font-bold">
                QAR {transactions
                  .filter(tx => tx.type === TransactionType.SERVICE_SALE && tx.status !== TransactionStatus.CANCELLED)
                  .reduce((sum, tx) => sum + tx.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create Test Service Transaction" to add a test service transaction directly</li>
            <li>Click "Create Completed Appointment" to test the appointment completion flow</li>
            <li>Click "Test All Components" to create multiple test transactions for comprehensive testing</li>
            <li>Click "Analyze Service Revenue" to see detailed analysis in the console</li>
            <li>Go to the dashboard to verify that service revenue appears in the stats cards</li>
            <li>Check the accounting page to verify service transactions appear in the transaction list</li>
            <li>Check the transaction overview and sales analytics components</li>
            <li>Check the browser console for detailed logging</li>
            <li>Use "Clear Test Data" to remove test transactions and appointments when done</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
