"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useAuth } from "@/lib/auth-provider"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShoppingCart,
  RotateCcw,
  DollarSign
} from "lucide-react"

interface InventoryAnalyticsProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function InventoryAnalytics({ dateRange }: InventoryAnalyticsProps) {
  const { currentLocation } = useAuth()
  
  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalValue: 25000,
    totalItems: 156,
    lowStockItems: 8,
    outOfStockItems: 3,
    averageTurnover: 6.2,
    fastestMoving: "Hydrating Shampoo",
    slowestMoving: "Hair Serum",
    reorderValue: 3200
  })

  const [lowStockItems, setLowStockItems] = useState([
    { name: "Hair Color - Brown", current: 3, minimum: 5, recommended: 15, value: 180 },
    { name: "Bleach Powder", current: 7, minimum: 10, recommended: 25, value: 350 },
    { name: "Nail Polish - Red", current: 4, minimum: 8, recommended: 20, value: 120 },
    { name: "Facial Cleanser", current: 2, minimum: 5, recommended: 12, value: 240 },
    { name: "Styling Gel", current: 6, minimum: 10, recommended: 30, value: 180 },
    { name: "Heat Protectant", current: 8, minimum: 12, recommended: 25, value: 200 },
    { name: "Hair Brush Set", current: 3, minimum: 5, recommended: 15, value: 450 },
    { name: "Treatment Mask", current: 5, minimum: 8, recommended: 20, value: 320 }
  ])

  const [turnoverData, setTurnoverData] = useState([
    { name: "Hydrating Shampoo", turnover: 12.5, daysToSellOut: 29, category: "Hair Care" },
    { name: "Styling Gel", turnover: 8.2, daysToSellOut: 44, category: "Styling" },
    { name: "Conditioner", turnover: 7.8, daysToSellOut: 47, category: "Hair Care" },
    { name: "Hair Treatment", turnover: 6.5, daysToSellOut: 56, category: "Treatments" },
    { name: "Heat Protectant", turnover: 5.9, daysToSellOut: 62, category: "Styling" },
    { name: "Hair Brush", turnover: 4.2, daysToSellOut: 87, category: "Tools" },
    { name: "Hair Oil", turnover: 3.8, daysToSellOut: 96, category: "Treatments" },
    { name: "Hair Serum", turnover: 2.1, daysToSellOut: 174, category: "Treatments" }
  ])

  const [stockMovementData, setStockMovementData] = useState([
    { month: "Jan", inbound: 2400, outbound: 2100, net: 300 },
    { month: "Feb", inbound: 1800, outbound: 2300, net: -500 },
    { month: "Mar", inbound: 3200, outbound: 2800, net: 400 },
    { month: "Apr", inbound: 2100, outbound: 2600, net: -500 },
    { month: "May", inbound: 2800, outbound: 2900, net: -100 },
    { month: "Jun", inbound: 3500, outbound: 3200, net: 300 }
  ])

  useEffect(() => {
    // In a real app, fetch inventory analytics based on dateRange and currentLocation
    if (dateRange && currentLocation) {
      // fetchInventoryAnalytics(dateRange, currentLocation)
    }
  }, [dateRange, currentLocation])

  const getTurnoverStatus = (turnover: number) => {
    if (turnover >= 8) return { label: "Excellent", color: "bg-green-100 text-green-800" }
    if (turnover >= 5) return { label: "Good", color: "bg-blue-100 text-blue-800" }
    if (turnover >= 3) return { label: "Average", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Poor", color: "bg-red-100 text-red-800" }
  }

  const getStockStatus = (current: number, minimum: number) => {
    if (current === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (current < minimum) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { label: "In Stock", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={inventoryMetrics.totalValue} />
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryMetrics.totalItems} total items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Turnover</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.averageTurnover}x</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Above target (5x)</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryMetrics.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryMetrics.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={inventoryMetrics.reorderValue} />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended purchases
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => {
                const status = getStockStatus(item.current, item.minimum)
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current: {item.current} | Min: {item.minimum} | Recommended: {item.recommended}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        <CurrencyDisplay amount={item.value} />
                      </div>
                      <Button size="sm" variant="outline" className="mt-1">
                        Reorder
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Turnover */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Turnover Rates</CardTitle>
            <CardDescription>Product movement analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {turnoverData.slice(0, 6).map((item, index) => {
                const status = getTurnoverStatus(item.turnover)
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.category} • {item.daysToSellOut} days to sell out
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{item.turnover}x</div>
                      <div className="text-xs text-muted-foreground">per year</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Trends</CardTitle>
          <CardDescription>Inbound vs outbound inventory movement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockMovementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} units`, 
                    name === 'inbound' ? 'Inbound' : name === 'outbound' ? 'Outbound' : 'Net Change'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="inbound" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Inbound"
                />
                <Area 
                  type="monotone" 
                  dataKey="outbound" 
                  stackId="2" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Outbound"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#ffc658" 
                  strokeWidth={3}
                  name="Net Change"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Turnover Analysis Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Product Turnover Analysis</CardTitle>
          <CardDescription>Turnover rates and days to sell out by product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnoverData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'turnover' ? `${value}x per year` : `${value} days`,
                    name === 'turnover' ? 'Turnover Rate' : 'Days to Sell Out'
                  ]}
                />
                <Bar yAxisId="left" dataKey="turnover" fill="#8884d8" name="Turnover Rate" />
                <Bar yAxisId="right" dataKey="daysToSellOut" fill="#82ca9d" name="Days to Sell Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
