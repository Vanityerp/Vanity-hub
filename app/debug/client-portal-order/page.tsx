"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { useOrders } from "@/lib/order-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { useToast } from "@/components/ui/use-toast"

export default function ClientPortalOrderDebugPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Safely get hooks with error handling
  let addTransaction, transactions, createOrderFromTransaction, getAllOrders, getNotifications, toast

  try {
    const transactionHooks = useTransactions()
    addTransaction = transactionHooks.addTransaction
    transactions = transactionHooks.transactions

    const orderHooks = useOrders()
    createOrderFromTransaction = orderHooks.createOrderFromTransaction
    getAllOrders = orderHooks.getAllOrders
    getNotifications = orderHooks.getNotifications

    const toastHooks = useToast()
    toast = toastHooks.toast
  } catch (err) {
    console.error('Error loading hooks:', err)
    setError(err instanceof Error ? err.message : 'Failed to load hooks')
  }

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Debug Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading debug page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const createTestOrder = async () => {
    if (!addTransaction || !createOrderFromTransaction || !toast) {
      console.error('Required hooks not available')
      return
    }

    setIsCreating(true)
    try {
      const orderId = `order-${Date.now()}`
      const clientId = "client-1"
      const clientName = "Test Customer"

      // Create order data
      const orderData = {
        id: orderId,
        clientId,
        items: [
          {
            id: "product-1",
            name: "Test Product",
            price: 24.99,
            quantity: 1
          }
        ],
        subtotal: 24.99,
        tax: 2.00,
        shipping: 5.00,
        total: 31.99,
        paymentMethod: "card",
        shippingAddress: {
          firstName: "Test",
          lastName: "Customer",
          email: "test@example.com",
          phone: "555-0123",
          address: "123 Test St",
          city: "Test City",
          state: "TS",
          zipCode: "12345",
          country: "US"
        },
        createdAt: new Date().toISOString()
      }

      console.log('🧪 DEBUG: Creating test order transaction:', {
        orderId,
        clientName,
        total: orderData.total
      })

      // Create main order transaction
      const orderTransaction = {
        date: new Date(),
        clientId,
        clientName,
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: `Client Portal Order - 1 item`,
        amount: orderData.total,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.COMPLETED,
        location: "online", // Use online location for client portal transactions
        source: TransactionSource.CLIENT_PORTAL,
        reference: {
          type: "client_portal_order",
          id: orderId
        },
        metadata: {
          orderData,
          itemCount: 1,
          shippingAddress: orderData.shippingAddress
        }
      }

      // Add the main transaction
      const createdTransaction = addTransaction(orderTransaction)

      console.log('✅ DEBUG: Transaction created:', {
        transactionId: createdTransaction.id,
        amount: createdTransaction.amount,
        source: createdTransaction.source,
        status: createdTransaction.status
      })

      // Create order from transaction
      const createdOrder = createOrderFromTransaction(createdTransaction)

      console.log('📦 DEBUG: Order created from transaction:', {
        orderId: createdOrder?.id,
        transactionId: createdTransaction.id,
        orderStatus: createdOrder?.status
      })

      toast({
        title: "Test Order Created",
        description: `Order ${orderId} created successfully with transaction ${createdTransaction.id}`,
      })

    } catch (error) {
      console.error('❌ DEBUG: Failed to create test order:', error)
      if (toast) {
        toast({
          variant: "destructive",
          title: "Test Failed",
          description: error instanceof Error ? error.message : "Failed to create test order",
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const allOrders = getAllOrders ? getAllOrders() : []
  const allNotifications = getNotifications ? getNotifications() : []
  const clientPortalTransactions = transactions ? transactions.filter(tx => tx.source === TransactionSource.CLIENT_PORTAL) : []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Client Portal Order Debug</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Order Creation */}
        <Card>
          <CardHeader>
            <CardTitle>Test Order Creation</CardTitle>
            <CardDescription>
              Create a test client portal order to verify the transaction integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={createTestOrder}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Test Order"}
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Current Statistics</CardTitle>
            <CardDescription>
              Current state of transactions, orders, and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Transactions:</span>
              <span className="font-semibold">{transactions ? transactions.length : 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span>Client Portal Transactions:</span>
              <span className="font-semibold">{clientPortalTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Orders:</span>
              <span className="font-semibold">{allOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Notifications:</span>
              <span className="font-semibold">{allNotifications.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Client Portal Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Client Portal Transactions</CardTitle>
          <CardDescription>
            Latest transactions from the client portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientPortalTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No client portal transactions found.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {clientPortalTransactions.slice(-5).reverse().map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{transaction.id}</h3>
                      <p className="text-xs text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.clientName} • ${transaction.amount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {typeof transaction.date === 'string'
                          ? transaction.date
                          : transaction.date.toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Latest orders created from transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No orders found.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {allOrders.slice(-5).reverse().map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{order.id}</h3>
                      <p className="text-xs text-gray-600">{order.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {order.items.length} item(s) • ${order.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium">{order.status}</p>
                    </div>
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
