"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTransactions } from "@/lib/transaction-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { TransactionSource, TransactionType } from "@/lib/transaction-types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1']

export function SalesAnalytics() {
  const { transactions, getTransactionsByDateRange } = useTransactions()
  const [selectedPeriod, setSelectedPeriod] = useState("7days")

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date()
    const days = selectedPeriod === "7days" ? 7 : selectedPeriod === "30days" ? 30 : 90
    const start = startOfDay(subDays(now, days))
    const end = endOfDay(now)
    return { start, end }
  }

  const { start, end } = getDateRange()
  const periodTransactions = getTransactionsByDateRange(start, end)

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    // Helper function to safely calculate totals
    const safeSum = (transactions: any[]) => {
      return transactions
        .filter(t => t && typeof t.amount === 'number' && !isNaN(t.amount))
        .reduce((sum, t) => sum + t.amount, 0)
    }

    // Daily sales data
    const dailySales = []
    const days = selectedPeriod === "7days" ? 7 : selectedPeriod === "30days" ? 30 : 90

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayTransactions = periodTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= dayStart && transactionDate <= dayEnd
      })

      const clientPortalSales = safeSum(dayTransactions
        .filter(t => t.source === TransactionSource.CLIENT_PORTAL))

      const posSales = safeSum(dayTransactions
        .filter(t => t.source === TransactionSource.POS))

      const serviceSales = safeSum(dayTransactions
        .filter(t => t.source === TransactionSource.CALENDAR))

      dailySales.push({
        date: format(date, "MMM dd"),
        fullDate: date,
        clientPortal: clientPortalSales,
        pos: posSales,
        services: serviceSales,
        total: clientPortalSales + posSales + serviceSales
      })
    }

    // Source breakdown
    const sourceBreakdown = [
      {
        name: "Client Portal",
        value: safeSum(periodTransactions
          .filter(t => t.source === TransactionSource.CLIENT_PORTAL)),
        count: periodTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length
      },
      {
        name: "POS (In-Store)",
        value: safeSum(periodTransactions
          .filter(t => t.source === TransactionSource.POS)),
        count: periodTransactions.filter(t => t.source === TransactionSource.POS).length
      },
      {
        name: "Services",
        value: safeSum(periodTransactions
          .filter(t => t.source === TransactionSource.CALENDAR)),
        count: periodTransactions.filter(t => t.source === TransactionSource.CALENDAR).length
      }
    ].filter(item => item.value > 0)

    // Product vs Service sales
    const typeBreakdown = [
      {
        name: "Product Sales",
        value: safeSum(periodTransactions
          .filter(t => t.type === TransactionType.PRODUCT_SALE)),
        count: periodTransactions.filter(t => t.type === TransactionType.PRODUCT_SALE).length
      },
      {
        name: "Service Sales",
        value: safeSum(periodTransactions
          .filter(t => t.type === TransactionType.SERVICE_SALE)),
        count: periodTransactions.filter(t => t.type === TransactionType.SERVICE_SALE).length
      }
    ].filter(item => item.value > 0)

    const totalRevenue = safeSum(periodTransactions)

    return {
      dailySales,
      sourceBreakdown,
      typeBreakdown,
      totalRevenue,
      totalTransactions: periodTransactions.length,
      averageOrderValue: periodTransactions.length > 0
        ? totalRevenue / periodTransactions.length
        : 0
    }
  }, [periodTransactions, selectedPeriod])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: <CurrencyDisplay amount={entry.value || 0} />
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Analytics</h2>
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <TabsList>
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={analyticsData.totalRevenue} />
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={analyticsData.averageOrderValue} />
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Client Portal Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={
                analyticsData.sourceBreakdown.find(s => s.name === "Client Portal")?.value || 0
              } />
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.sourceBreakdown.find(s => s.name === "Client Portal")?.count || 0} online orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
            <CardDescription>Revenue by source over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="clientPortal" stackId="a" fill="#8884d8" name="Client Portal" />
                <Bar dataKey="pos" stackId="a" fill="#82ca9d" name="POS" />
                <Bar dataKey="services" stackId="a" fill="#ffc658" name="Services" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Source</CardTitle>
            <CardDescription>Revenue breakdown by sales channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => <CurrencyDisplay amount={value} />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product vs Service Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Product vs Service Sales</CardTitle>
            <CardDescription>Revenue breakdown by transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.typeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.typeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => <CurrencyDisplay amount={value} />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Total daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Total Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
