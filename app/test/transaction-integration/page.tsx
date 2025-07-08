"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, ShoppingCart, Calendar, CreditCard } from "lucide-react"

export default function TransactionIntegrationTestPage() {
  const { transactions, addTransaction, getTransactionsBySource } = useTransactions()
  const { toast } = useToast()
  const [isTestRunning, setIsTestRunning] = useState(false)

  // Test appointment transaction
  const testAppointmentTransaction = () => {
    setIsTestRunning(true)
    
    const transaction = {
      date: new Date(),
      clientId: "client-123",
      clientName: "John Doe",
      staffId: "staff-456",
      staffName: "Sarah Johnson",
      type: TransactionType.SERVICE_SALE,
      category: "Appointment Service",
      description: "Completed appointment - Haircut + Beard Trim",
      amount: 85.00,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: "loc1",
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: "appointment-789"
      },
      items: [
        {
          id: "service-haircut",
          name: "Haircut",
          quantity: 1,
          unitPrice: 60.00,
          totalPrice: 60.00,
          category: "Service"
        },
        {
          id: "service-beard-trim",
          name: "Beard Trim",
          quantity: 1,
          unitPrice: 25.00,
          totalPrice: 25.00,
          category: "Service"
        }
      ],
      metadata: {
        appointmentId: "appointment-789",
        bookingReference: "VH-123456",
        appointmentDate: new Date().toISOString(),
        duration: 60,
        completedAt: new Date().toISOString()
      }
    }

    addTransaction(transaction)
    
    toast({
      title: "Appointment Transaction Created",
      description: "Test appointment transaction has been recorded successfully.",
    })
    
    setIsTestRunning(false)
  }

  // Test POS transaction
  const testPOSTransaction = () => {
    setIsTestRunning(true)
    
    const transaction = {
      date: new Date(),
      clientId: "client-456",
      clientName: "Jane Smith",
      staffId: "staff-789",
      staffName: "Mike Wilson",
      type: TransactionType.PRODUCT_SALE,
      category: "POS Sale",
      description: "POS Sale - 3 items (1 service, 2 products)",
      amount: 127.50,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: "loc1",
      source: TransactionSource.POS,
      reference: {
        type: "pos_sale",
        id: "pos-987654"
      },
      items: [
        {
          id: "service-styling",
          name: "Hair Styling",
          quantity: 1,
          unitPrice: 45.00,
          totalPrice: 45.00,
          category: "Service"
        },
        {
          id: "product-shampoo",
          name: "Professional Shampoo",
          quantity: 2,
          unitPrice: 24.99,
          totalPrice: 49.98,
          category: "Product"
        },
        {
          id: "product-conditioner",
          name: "Professional Conditioner",
          quantity: 1,
          unitPrice: 32.52,
          totalPrice: 32.52,
          category: "Product"
        }
      ],
      metadata: {
        subtotal: 127.50,
        taxRate: 0.0825,
        taxAmount: 10.52,
        total: 138.02,
        itemCount: 4,
        serviceCount: 1,
        productCount: 3,
        processedAt: new Date().toISOString()
      }
    }

    addTransaction(transaction)
    
    toast({
      title: "POS Transaction Created",
      description: "Test POS transaction has been recorded successfully.",
    })
    
    setIsTestRunning(false)
  }

  // Test client portal transaction
  const testClientPortalTransaction = () => {
    setIsTestRunning(true)
    
    const transaction = {
      date: new Date(),
      clientId: "client-789",
      clientName: "Bob Johnson",
      type: TransactionType.PRODUCT_SALE,
      category: "Online Product Sale",
      description: "Client Portal Order - 2 items",
      amount: 67.98,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: "loc1",
      source: TransactionSource.CLIENT_PORTAL,
      reference: {
        type: "client_portal_order",
        id: "order-456789"
      },
      items: [
        {
          id: "product-gel",
          name: "Styling Gel",
          quantity: 2,
          unitPrice: 18.99,
          totalPrice: 37.98,
          category: "Product"
        },
        {
          id: "product-spray",
          name: "Hair Spray",
          quantity: 1,
          unitPrice: 30.00,
          totalPrice: 30.00,
          category: "Product"
        }
      ],
      metadata: {
        orderData: {
          shippingAddress: "123 Main St, City, State 12345"
        },
        itemCount: 3,
        appliedPromo: null
      }
    }

    addTransaction(transaction)
    
    toast({
      title: "Client Portal Transaction Created",
      description: "Test client portal transaction has been recorded successfully.",
    })
    
    setIsTestRunning(false)
  }

  // Get transaction counts by source
  const appointmentTransactions = getTransactionsBySource(TransactionSource.CALENDAR)
  const posTransactions = getTransactionsBySource(TransactionSource.POS)
  const clientPortalTransactions = getTransactionsBySource(TransactionSource.CLIENT_PORTAL)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Transaction Integration Test</h1>
        <p className="text-gray-600 mt-2">
          Test the comprehensive transaction recording functionality across all sales channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Appointment Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Appointment Transactions
            </CardTitle>
            <CardDescription>
              Transactions from completed appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {appointmentTransactions.length}
            </div>
            <Button 
              onClick={testAppointmentTransaction} 
              disabled={isTestRunning}
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Test Appointment Transaction
            </Button>
          </CardContent>
        </Card>

        {/* POS Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              POS Transactions
            </CardTitle>
            <CardDescription>
              Transactions from point-of-sale system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {posTransactions.length}
            </div>
            <Button 
              onClick={testPOSTransaction} 
              disabled={isTestRunning}
              className="w-full"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Test POS Transaction
            </Button>
          </CardContent>
        </Card>

        {/* Client Portal Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Client Portal Transactions
            </CardTitle>
            <CardDescription>
              Transactions from online client portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {clientPortalTransactions.length}
            </div>
            <Button 
              onClick={testClientPortalTransaction} 
              disabled={isTestRunning}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Test Client Portal Transaction
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            All transactions recorded in the system (showing last 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions recorded yet. Use the test buttons above to create sample transactions.
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(-10).reverse().map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{transaction.description}</h3>
                      <p className="text-sm text-gray-600">
                        {transaction.clientName} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        <CurrencyDisplay amount={transaction.amount} />
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {transaction.source.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{transaction.paymentMethod.replace('_', ' ')}</span>
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
