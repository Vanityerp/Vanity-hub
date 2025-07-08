"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactions } from '@/lib/transaction-provider'
import { useOrders } from '@/lib/order-provider'
import { integratedAnalyticsService } from '@/lib/integrated-analytics-service'
import { OrderStatus } from '@/lib/order-types'
import { TransactionStatus } from '@/lib/transaction-types'

/**
 * Test component to verify order-transaction-analytics synchronization
 * This component can be temporarily added to test the fix
 */
export function TestSyncFix() {
  const { transactions, updateTransaction } = useTransactions()
  const { orders, updateOrderStatus } = useOrders()
  const [analytics, setAnalytics] = useState<any>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    // Subscribe to analytics updates
    const unsubscribe = integratedAnalyticsService.subscribe(setAnalytics)
    return unsubscribe
  }, [])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testOrderStatusSync = async () => {
    addTestResult('🧪 Starting order status synchronization test...')
    
    // Find a pending order with a transaction
    const pendingOrder = orders.find(order => 
      order.status === OrderStatus.PENDING && order.transactionId
    )
    
    if (!pendingOrder) {
      addTestResult('❌ No pending order with transaction found for testing')
      return
    }

    addTestResult(`📦 Found test order: ${pendingOrder.id}`)
    addTestResult(`🔗 Linked transaction: ${pendingOrder.transactionId}`)

    // Get the current transaction status
    const currentTransaction = transactions.find(tx => tx.id === pendingOrder.transactionId)
    if (!currentTransaction) {
      addTestResult('❌ Transaction not found in provider')
      return
    }

    addTestResult(`💳 Current transaction status: ${currentTransaction.status}`)

    // Update order status to delivered
    addTestResult('🔄 Updating order status to DELIVERED...')
    const updatedOrder = updateOrderStatus(
      pendingOrder.id, 
      OrderStatus.DELIVERED, 
      undefined, 
      'Test delivery update'
    )

    if (!updatedOrder) {
      addTestResult('❌ Failed to update order status')
      return
    }

    addTestResult(`✅ Order status updated to: ${updatedOrder.status}`)

    // Wait a moment for the sync to happen
    setTimeout(() => {
      // Check if transaction status was updated
      const updatedTransaction = transactions.find(tx => tx.id === pendingOrder.transactionId)
      if (updatedTransaction) {
        addTestResult(`💳 Transaction status after update: ${updatedTransaction.status}`)
        
        if (updatedTransaction.status === TransactionStatus.COMPLETED) {
          addTestResult('✅ SUCCESS: Transaction status synchronized correctly!')
        } else {
          addTestResult('❌ FAILED: Transaction status not synchronized')
        }
      } else {
        addTestResult('❌ FAILED: Transaction not found after update')
      }

      // Check analytics update
      if (analytics) {
        addTestResult(`📊 Analytics updated: ${analytics.totalRevenue} total revenue`)
        addTestResult('✅ SUCCESS: Analytics service received updates!')
      } else {
        addTestResult('❌ FAILED: Analytics not updated')
      }
    }, 1000)
  }

  const testDirectTransactionUpdate = () => {
    addTestResult('🧪 Testing direct transaction update...')
    
    const testTransaction = transactions.find(tx => tx.status === TransactionStatus.PENDING)
    if (!testTransaction) {
      addTestResult('❌ No pending transaction found for testing')
      return
    }

    addTestResult(`💳 Updating transaction ${testTransaction.id} to COMPLETED`)
    
    const result = updateTransaction(testTransaction.id, { 
      status: TransactionStatus.COMPLETED 
    })

    if (result) {
      addTestResult('✅ SUCCESS: Direct transaction update worked!')
      
      setTimeout(() => {
        if (analytics) {
          addTestResult('✅ SUCCESS: Analytics updated after direct transaction update!')
        } else {
          addTestResult('❌ FAILED: Analytics not updated after direct transaction update')
        }
      }, 500)
    } else {
      addTestResult('❌ FAILED: Direct transaction update failed')
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Order-Transaction-Analytics Sync Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testOrderStatusSync} variant="default">
            Test Order Status Sync
          </Button>
          <Button onClick={testDirectTransactionUpdate} variant="outline">
            Test Direct Transaction Update
          </Button>
          <Button onClick={clearResults} variant="ghost">
            Clear Results
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Orders:</strong> {orders.length}
            <br />
            <strong>Pending:</strong> {orders.filter(o => o.status === OrderStatus.PENDING).length}
          </div>
          <div>
            <strong>Transactions:</strong> {transactions.length}
            <br />
            <strong>Pending:</strong> {transactions.filter(t => t.status === TransactionStatus.PENDING).length}
          </div>
          <div>
            <strong>Analytics Revenue:</strong> {analytics?.totalRevenue || 'Loading...'}
            <br />
            <strong>Completed Sales:</strong> {analytics?.completedSales || 'Loading...'}
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className={
                  result.includes('SUCCESS') ? 'text-green-600' :
                  result.includes('FAILED') ? 'text-red-600' :
                  result.includes('🧪') ? 'text-blue-600' :
                  'text-muted-foreground'
                }>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
