"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionSource, TransactionType, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { getAllAppointments, addAppointment } from "@/lib/appointment-service"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export default function InPersonSalesDebugPage() {
  const { transactions, addTransaction } = useTransactions()
  const [appointments, setAppointments] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allAppointments = getAllAppointments()
    setAppointments(allAppointments)
    
    // Calculate in-person sales breakdown
    const inPersonTransactions = transactions.filter(t => 
      t.source === TransactionSource.POS || t.source === TransactionSource.CALENDAR
    )
    
    const inPersonServiceTransactions = inPersonTransactions.filter(t => t.type === TransactionType.SERVICE_SALE)
    const inPersonProductTransactions = inPersonTransactions.filter(t => t.type === TransactionType.PRODUCT_SALE)
    
    const inPersonServices = inPersonServiceTransactions.reduce((sum, t) => sum + t.amount, 0)
    const inPersonProducts = inPersonProductTransactions.reduce((sum, t) => sum + t.amount, 0)
    const inPersonTotal = inPersonServices + inPersonProducts
    
    setDebugInfo({
      totalTransactions: transactions.length,
      inPersonTransactions: inPersonTransactions.length,
      serviceTransactions: inPersonServiceTransactions.length,
      productTransactions: inPersonProductTransactions.length,
      inPersonServices,
      inPersonProducts,
      inPersonTotal,
      completedAppointments: allAppointments.filter(a => a.status === 'completed').length,
      appointmentsWithProducts: allAppointments.filter(a => a.products && a.products.length > 0).length
    })
  }

  const createTestAppointmentWithProducts = () => {
    const testAppointment = {
      id: `test-products-${Date.now()}`,
      clientId: "test-client",
      clientName: "Test Client",
      staffId: "1",
      staffName: "Emma Johnson",
      service: "Haircut & Style",
      serviceId: "1",
      date: new Date().toISOString(),
      duration: 60,
      status: "completed",
      location: "loc1",
      price: 75,
      bookingReference: `TEST-${Date.now()}`,
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
      ],
      additionalServices: [
        { name: "Hair Wash", price: 15 }
      ],
      products: [
        { name: "Hair Shampoo", price: 25, quantity: 1 },
        { name: "Hair Conditioner", price: 20, quantity: 1 }
      ]
    }

    // Add appointment
    addAppointment(testAppointment)

    // Create transactions manually
    const serviceTransaction = {
      date: new Date(),
      clientId: testAppointment.clientId,
      clientName: testAppointment.clientName,
      staffId: testAppointment.staffId,
      staffName: testAppointment.staffName,
      type: TransactionType.SERVICE_SALE,
      category: "Appointment Service",
      description: `Completed appointment - ${testAppointment.service} + Hair Wash`,
      amount: 90, // 75 + 15
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: testAppointment.location,
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: testAppointment.id
      },
      metadata: {
        appointmentId: testAppointment.id,
        transactionType: 'service_portion'
      }
    }

    const productTransaction = {
      date: new Date(),
      clientId: testAppointment.clientId,
      clientName: testAppointment.clientName,
      staffId: testAppointment.staffId,
      staffName: testAppointment.staffName,
      type: TransactionType.PRODUCT_SALE,
      category: "Appointment Product Sale",
      description: `Products from appointment - Hair Shampoo, Hair Conditioner`,
      amount: 45, // 25 + 20
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: testAppointment.location,
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: testAppointment.id
      },
      metadata: {
        appointmentId: testAppointment.id,
        transactionType: 'product_portion'
      }
    }

    addTransaction(serviceTransaction)
    addTransaction(productTransaction)

    // Reload data
    setTimeout(() => {
      loadData()
    }, 500)
  }

  const clearTestData = () => {
    // Clear localStorage
    localStorage.removeItem('vanity_appointments')
    localStorage.removeItem('vanity_transactions')
    
    // Reload page
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">In-Person Sales Debug</h1>
        <div className="space-x-2">
          <Button onClick={createTestAppointmentWithProducts}>
            Create Test Appointment with Products
          </Button>
          <Button variant="outline" onClick={loadData}>
            Refresh Data
          </Button>
          <Button variant="destructive" onClick={clearTestData}>
            Clear Test Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>In-Person Sales Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={debugInfo.inPersonTotal || 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={debugInfo.inPersonServices || 0} />
            </div>
            <p className="text-sm text-muted-foreground">
              {debugInfo.serviceTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={debugInfo.inPersonProducts || 0} />
            </div>
            <p className="text-sm text-muted-foreground">
              {debugInfo.productTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div>Total Transactions: {debugInfo.totalTransactions || 0}</div>
              <div>In-Person Transactions: {debugInfo.inPersonTransactions || 0}</div>
              <div>Completed Appointments: {debugInfo.completedAppointments || 0}</div>
              <div>Appointments with Products: {debugInfo.appointmentsWithProducts || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {appointments.slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="border rounded p-2">
                  <div className="font-medium">{appointment.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.service} - {appointment.status}
                  </div>
                  <div className="text-sm">
                    Price: <CurrencyDisplay amount={appointment.price || 0} />
                  </div>
                  {appointment.products && appointment.products.length > 0 && (
                    <div className="text-sm text-blue-600">
                      Products: {appointment.products.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions
                .filter(t => t.source === TransactionSource.CALENDAR)
                .slice(0, 10)
                .map((transaction) => (
                <div key={transaction.id} className="border rounded p-2">
                  <div className="font-medium">{transaction.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.type} - {transaction.source}
                  </div>
                  <div className="text-sm">
                    Amount: <CurrencyDisplay amount={transaction.amount} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
