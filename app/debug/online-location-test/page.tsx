"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { useOrders } from "@/lib/order-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { OrderStatus } from "@/lib/order-types"
import { useToast } from "@/hooks/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export default function OnlineLocationTestPage() {
  const { transactions, addTransaction } = useTransactions()
  const { orders, updateOrderStatus } = useOrders()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  // Create test online transaction
  const createTestOnlineTransaction = () => {
    setIsCreating(true)
    try {
      const orderId = `test-order-${Date.now()}`
      const clientId = "test-client-1"
      const clientName = "Test Customer"

      // Create order transaction
      const orderTransaction = {
        date: new Date(),
        clientId,
        clientName,
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: `Test Client Portal Order - 2 items`,
        amount: 89.99,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.PENDING,
        location: "online", // This should show up in Online location card
        source: TransactionSource.CLIENT_PORTAL,
        reference: {
          type: "client_portal_order",
          id: orderId
        },
        metadata: {
          orderData: {
            id: orderId,
            items: [
              { id: "test-1", name: "Test Product 1", price: 39.99, quantity: 1 },
              { id: "test-2", name: "Test Product 2", price: 49.99, quantity: 1 }
            ],
            subtotal: 89.98,
            tax: 7.20,
            shipping: 0,
            total: 89.99
          },
          itemCount: 2,
          isOnlineTransaction: true
        }
      }

      const createdTransaction = addTransaction(orderTransaction)

      toast({
        title: "Test Transaction Created",
        description: `Online transaction ${createdTransaction.id} created with amount ${createdTransaction.amount}`,
      })

      console.log('🧪 TEST: Online transaction created:', {
        transactionId: createdTransaction.id,
        amount: createdTransaction.amount,
        location: createdTransaction.location,
        source: createdTransaction.source,
        status: createdTransaction.status
      })

    } catch (error) {
      console.error('❌ TEST: Failed to create transaction:', error)
      toast({
        title: "Error",
        description: "Failed to create test transaction",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Cancel a random online transaction to test cancelled transaction filtering
  const cancelRandomOnlineTransaction = () => {
    const onlineTransactions = transactions.filter(t => 
      t.location === "online" && 
      t.source === TransactionSource.CLIENT_PORTAL &&
      t.status !== TransactionStatus.CANCELLED
    )

    if (onlineTransactions.length === 0) {
      toast({
        title: "No Online Transactions",
        description: "Create some online transactions first",
        variant: "destructive",
      })
      return
    }

    const randomTransaction = onlineTransactions[Math.floor(Math.random() * onlineTransactions.length)]
    
    // Find corresponding order and cancel it
    const correspondingOrder = orders.find(o => o.transactionId === randomTransaction.id)
    if (correspondingOrder) {
      updateOrderStatus(correspondingOrder.id, OrderStatus.CANCELLED, undefined, "Test cancellation")
      
      toast({
        title: "Order Cancelled",
        description: `Order ${correspondingOrder.id} has been cancelled. Revenue should be excluded from totals.`,
      })

      console.log('🧪 TEST: Order cancelled:', {
        orderId: correspondingOrder.id,
        transactionId: randomTransaction.id,
        amount: randomTransaction.amount
      })
    } else {
      toast({
        title: "No Corresponding Order",
        description: "Could not find order for transaction",
        variant: "destructive",
      })
    }
  }

  // Get online transaction stats
  const onlineTransactions = transactions.filter(t => t.location === "online")
  const activeOnlineTransactions = onlineTransactions.filter(t => t.status !== TransactionStatus.CANCELLED)
  const cancelledOnlineTransactions = onlineTransactions.filter(t => t.status === TransactionStatus.CANCELLED)
  const totalOnlineRevenue = activeOnlineTransactions.reduce((sum, t) => sum + t.amount, 0)
  const cancelledRevenue = cancelledOnlineTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Online Location Test</h1>
          <p className="text-muted-foreground">Test the Online location card and cancelled transaction filtering</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createTestOnlineTransaction}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Test Online Transaction"}
            </Button>
            
            <Button 
              onClick={cancelRandomOnlineTransaction}
              variant="destructive"
              className="w-full"
            >
              Cancel Random Online Order
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>• Create test transactions to see them in the Online location card</p>
              <p>• Cancel orders to test that cancelled revenue is excluded</p>
              <p>• Check the Location Performance tab in the dashboard</p>
            </div>
          </CardContent>
        </Card>

        {/* Online Transaction Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Online Transaction Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Online Transactions</p>
                <p className="text-2xl font-bold">{onlineTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Transactions</p>
                <p className="text-2xl font-bold text-green-600">{activeOnlineTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled Transactions</p>
                <p className="text-2xl font-bold text-red-600">{cancelledOnlineTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay amount={totalOnlineRevenue} />
                </p>
              </div>
            </div>
            
            {cancelledRevenue > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  Cancelled Revenue (excluded): <CurrencyDisplay amount={cancelledRevenue} />
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Online Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Online Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {onlineTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.clientName} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${transaction.status === TransactionStatus.CANCELLED ? 'text-red-600 line-through' : ''}`}>
                    <CurrencyDisplay amount={transaction.amount} />
                  </p>
                  <p className={`text-sm ${
                    transaction.status === TransactionStatus.CANCELLED ? 'text-red-600' :
                    transaction.status === TransactionStatus.COMPLETED ? 'text-green-600' :
                    'text-yellow-600'
                  }`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
            {onlineTransactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No online transactions yet. Create some test transactions to see them here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
