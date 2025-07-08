"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useAuth } from "@/lib/auth-provider"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react"

interface ProductSalesChartProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function ProductSalesChart({ dateRange }: ProductSalesChartProps) {
  const { currentLocation } = useAuth()
  const [productSalesData, setProductSalesData] = useState([
    { name: "Hydrating Shampoo", quantity: 45, revenue: 1125, profit: 562.5, margin: 50 },
    { name: "Styling Gel", quantity: 38, revenue: 722, profit: 325, margin: 45 },
    { name: "Hair Treatment", quantity: 32, revenue: 1056, profit: 422, margin: 40 },
    { name: "Conditioner", quantity: 28, revenue: 644, profit: 290, margin: 45 },
    { name: "Heat Protectant", quantity: 25, revenue: 500, profit: 200, margin: 40 },
    { name: "Hair Brush", quantity: 18, revenue: 522, profit: 183, margin: 35 },
    { name: "Hair Spray", quantity: 15, revenue: 255, profit: 89, margin: 35 },
    { name: "Hair Oil", quantity: 12, revenue: 360, profit: 144, margin: 40 }
  ])

  const [categoryData, setCategoryData] = useState([
    { name: "Hair Care", value: 3850, color: "#8884d8" },
    { name: "Styling", value: 1200, color: "#82ca9d" },
    { name: "Tools", value: 800, color: "#ffc658" },
    { name: "Treatments", value: 650, color: "#ff7c7c" }
  ])

  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalProductRevenue: 6500,
    totalProductProfit: 1993.5,
    averageMargin: 42.1,
    topSellingProduct: "Hydrating Shampoo",
    fastestGrowing: "Hair Treatment",
    inventoryTurnover: 6.2,
    lowStockItems: 8
  })

  const [trendData, setTrendData] = useState([
    { month: "Jan", revenue: 5200, profit: 2080, margin: 40 },
    { month: "Feb", revenue: 5800, profit: 2436, margin: 42 },
    { month: "Mar", revenue: 6100, profit: 2562, margin: 42 },
    { month: "Apr", revenue: 6500, profit: 2730, margin: 42 },
    { month: "May", revenue: 6800, profit: 2856, margin: 42 },
    { month: "Jun", revenue: 7200, profit: 3024, margin: 42 }
  ])

  useEffect(() => {
    // In a real app, fetch product sales data based on dateRange and currentLocation
    if (dateRange && currentLocation) {
      // fetchProductSalesData(dateRange, currentLocation)
    }
  }, [dateRange, currentLocation])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={inventoryMetrics.totalProductRevenue} />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={inventoryMetrics.totalProductProfit} />
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {inventoryMetrics.averageMargin}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.inventoryTurnover}x</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Above industry average</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryMetrics.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-600">Requires attention</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList>
          <TabsTrigger value="performance">Product Performance</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="margins">Profit Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Product performance by quantity sold and revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productSalesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                      formatter={(value, name) => {
                        if (name === 'revenue' || name === 'profit') {
                          return [<CurrencyDisplay amount={Number(value)} />, name]
                        }
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Product category performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        <CurrencyDisplay amount={item.value} />
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Detailed metrics by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => {
                    const percentage = (category.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: category.color 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span><CurrencyDisplay amount={category.value} /></span>
                          <span>Avg margin: {40 + index * 2}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Sales Trends</CardTitle>
              <CardDescription>Monthly revenue and profit trends for product sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue' || name === 'profit') {
                          return [<CurrencyDisplay amount={Number(value)} />, name]
                        }
                        return [`${value}%`, name]
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={3} name="Profit" />
                    <Line type="monotone" dataKey="margin" stroke="#ffc658" strokeWidth={2} name="Margin %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Profit Margins</CardTitle>
              <CardDescription>Profit margin analysis by product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productSalesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'profit') {
                          return [<CurrencyDisplay amount={Number(value)} />, 'Profit']
                        }
                        return [`${value}%`, 'Margin']
                      }}
                    />
                    <Legend />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                    <Bar dataKey="margin" fill="#ffc658" name="Margin %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
