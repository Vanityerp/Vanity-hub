"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import type { DateRange } from "react-day-picker"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/lib/auth-provider"

interface FinancialOverviewProps {
  dateRange?: DateRange
}

export function FinancialOverview({ dateRange }: FinancialOverviewProps) {
  const { currentLocation } = useAuth()
  const [financialData, setFinancialData] = useState({
    totalRevenue: 13700,
    serviceRevenue: 9850,
    productRevenue: 3850,
    totalExpenses: 7250,
    operatingExpenses: 5100,
    cogs: 2150,
    netProfit: 6450,
    inventoryValue: 25000,
    profitMargin: 47.1
  })

  const [revenueBreakdown, setRevenueBreakdown] = useState([
    { name: "Services", value: 9850, color: "#8884d8" },
    { name: "Products", value: 3850, color: "#82ca9d" }
  ])

  const [expenseBreakdown, setExpenseBreakdown] = useState([
    { name: "Operating", value: 5100, color: "#ffc658" },
    { name: "COGS", value: 2150, color: "#ff7c7c" }
  ])

  // Mock financial data with inventory integration
  const revenueData = [
    { date: "Mar 01", services: 850, products: 350, expenses: 600, cogs: 200, profit: 400 },
    { date: "Mar 05", services: 1300, products: 500, expenses: 750, cogs: 250, profit: 800 },
    { date: "Mar 10", services: 1000, products: 400, expenses: 675, cogs: 225, profit: 500 },
    { date: "Mar 15", services: 1600, products: 600, expenses: 825, cogs: 275, profit: 1100 },
    { date: "Mar 20", services: 1350, products: 550, expenses: 712, cogs: 238, profit: 950 },
    { date: "Mar 25", services: 1750, products: 650, expenses: 900, cogs: 300, profit: 1200 },
    { date: "Mar 30", services: 2000, products: 800, expenses: 975, cogs: 325, profit: 1500 },
  ]

  useEffect(() => {
    // In a real app, fetch financial data based on dateRange and currentLocation
    // This would include calls to the financial transactions API
    if (dateRange && currentLocation) {
      // fetchFinancialData(dateRange, currentLocation)
    }
  }, [dateRange, currentLocation])

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.totalRevenue} /></div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services:</span>
                <span><CurrencyDisplay amount={financialData.serviceRevenue} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products:</span>
                <span><CurrencyDisplay amount={financialData.productRevenue} /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.totalExpenses} /></div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating:</span>
                <span><CurrencyDisplay amount={financialData.operatingExpenses} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">COGS:</span>
                <span><CurrencyDisplay amount={financialData.cogs} /></span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.netProfit} /></div>
            <p className="text-xs text-muted-foreground">+25% from last month</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin:</span>
                <span className="font-medium">{financialData.profitMargin}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><CurrencyDisplay amount={financialData.inventoryValue} /></div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turnover:</span>
                <span className="font-medium">6.2x/year</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44.2%</div>
            <p className="text-xs text-muted-foreground">Average product margin</p>
            <div className="mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">vs Services:</span>
                <span className="font-medium">48.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="margins">Profit Margins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trends</CardTitle>
              <CardDescription>Combined services and product revenue with profit analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        <CurrencyDisplay amount={Number(value)} />,
                        name === 'services' ? 'Services' :
                        name === 'products' ? 'Products' :
                        name === 'profit' ? 'Net Profit' : name
                      ]}
                    />
                    <Line type="monotone" dataKey="services" stroke="#8884d8" strokeWidth={2} name="Services" />
                    <Line type="monotone" dataKey="products" stroke="#82ca9d" strokeWidth={2} name="Products" />
                    <Line type="monotone" dataKey="profit" stroke="#ffc658" strokeWidth={3} name="Net Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown of revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {revenueBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium"><CurrencyDisplay amount={item.value} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service vs Product Revenue</CardTitle>
                <CardDescription>Daily comparison of revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                      <Bar dataKey="services" fill="#8884d8" name="Services" />
                      <Bar dataKey="products" fill="#82ca9d" name="Products" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Operating expenses vs Cost of Goods Sold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {expenseBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium"><CurrencyDisplay amount={item.value} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
                <CardDescription>Operating expenses and COGS over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => <CurrencyDisplay amount={Number(value)} />} />
                      <Bar dataKey="expenses" fill="#ffc658" name="Operating" />
                      <Bar dataKey="cogs" fill="#ff7c7c" name="COGS" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Analysis</CardTitle>
              <CardDescription>Service margins vs Product margins comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Service Margins</h4>
                  <div className="text-2xl font-bold text-blue-600">48.5%</div>
                  <p className="text-sm text-muted-foreground">Average service profit margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Hair Services:</span>
                      <span className="font-medium">52%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nail Services:</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skin Services:</span>
                      <span className="font-medium">47%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Product Margins</h4>
                  <div className="text-2xl font-bold text-green-600">44.2%</div>
                  <p className="text-sm text-muted-foreground">Average product profit margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Hair Products:</span>
                      <span className="font-medium">46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skin Products:</span>
                      <span className="font-medium">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tools:</span>
                      <span className="font-medium">38%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Combined Margin</h4>
                  <div className="text-2xl font-bold text-purple-600">47.1%</div>
                  <p className="text-sm text-muted-foreground">Overall business margin</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="font-medium">50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Industry Avg:</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>vs Last Month:</span>
                      <span className="font-medium text-green-600">+2.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

