"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTransactions } from "@/lib/transaction-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { TransactionSource, TransactionType, TransactionStatus } from "@/lib/transaction-types"
import {
  ShoppingCart,
  Calendar,
  Store,
  Globe,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { format } from "date-fns"

export function TransactionOverview() {
  const { transactions, getTransactionsBySource, getTransactionsByDateRange } = useTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState("today")

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (selectedPeriod) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case "week":
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { start: weekStart, end: now }
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start: monthStart, end: now }
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }
  }

  const { start, end } = getDateRange()
  const periodTransactions = getTransactionsByDateRange(start, end)

  // Helper function to safely calculate totals
  const safeSum = (transactions: any[]) => {
    return transactions
      .filter(t => t && typeof t.amount === 'number' && !isNaN(t.amount))
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Calculate metrics
  const metrics = {
    total: safeSum(periodTransactions),
    count: periodTransactions.length,
    clientPortal: getTransactionsBySource(TransactionSource.CLIENT_PORTAL).filter(t =>
      new Date(t.date) >= start && new Date(t.date) <= end
    ),
    pos: getTransactionsBySource(TransactionSource.POS).filter(t =>
      new Date(t.date) >= start && new Date(t.date) <= end
    ),
    calendar: getTransactionsBySource(TransactionSource.CALENDAR).filter(t =>
      new Date(t.date) >= start && new Date(t.date) <= end
    )
  }

  const getSourceIcon = (source: TransactionSource) => {
    switch (source) {
      case TransactionSource.CLIENT_PORTAL:
        return <Globe className="h-4 w-4" />
      case TransactionSource.POS:
        return <Store className="h-4 w-4" />
      case TransactionSource.CALENDAR:
        return <Calendar className="h-4 w-4" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case TransactionStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case TransactionStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.PRODUCT_SALE:
        return "bg-green-100 text-green-800"
      case TransactionType.SERVICE_SALE:
        return "bg-blue-100 text-blue-800"
      case TransactionType.INVENTORY_PURCHASE:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transaction Overview</h2>
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={metrics.total} />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Portal</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={safeSum(metrics.clientPortal)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.clientPortal.length} online orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-Store (POS)</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={safeSum(metrics.pos)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pos.length} POS transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={safeSum(metrics.calendar)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.calendar.length} service sales
            </p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Remove duplicate transactions by appointment ID before displaying */}
              {periodTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                // Filter out duplicates by appointment reference
                .filter((transaction, index, self) => {
                  // If this transaction has an appointment reference
                  if (transaction.reference?.type === 'appointment' && transaction.reference?.id) {
                    // Check if this is the first occurrence of this appointment ID
                    return self.findIndex(t => 
                      t.reference?.type === 'appointment' && 
                      t.reference?.id === transaction.reference?.id
                    ) === index;
                  }
                  // Keep transactions without appointment references
                  return true;
                })
                .slice(0, 10)
                .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), "MMM dd, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSourceIcon(transaction.source)}
                      <span className="text-sm">
                        {transaction.source.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(transaction.type)}>
                      {transaction.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    {transaction.clientName || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <span className="text-sm capitalize">
                        {transaction.status.toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay amount={transaction.amount || 0} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {periodTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for the selected period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
