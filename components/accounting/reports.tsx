"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Download, FileDown, Printer } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"

interface ReportsProps {
  dateRange?: DateRange
}

export function Reports({ dateRange }: ReportsProps) {
  const { formatCurrency } = useCurrency()
  // Mock revenue data
  const revenueData = [
    { date: "Mar 01", services: 1200, products: 300, total: 1500 },
    { date: "Mar 05", services: 1800, products: 400, total: 2200 },
    { date: "Mar 10", services: 1400, products: 350, total: 1750 },
    { date: "Mar 15", services: 2200, products: 500, total: 2700 },
    { date: "Mar 20", services: 1900, products: 450, total: 2350 },
    { date: "Mar 25", services: 2400, products: 550, total: 2950 },
    { date: "Mar 30", services: 2800, products: 600, total: 3400 },
  ]

  // Mock expense data
  const expenseData = [
    { date: "Mar 01", payroll: 800, inventory: 300, rent: 200, utilities: 100, marketing: 50, total: 1450 },
    { date: "Mar 05", payroll: 850, inventory: 0, rent: 0, utilities: 0, marketing: 0, total: 850 },
    { date: "Mar 10", payroll: 900, inventory: 350, rent: 0, utilities: 0, marketing: 0, total: 1250 },
    { date: "Mar 15", payroll: 950, inventory: 0, rent: 0, utilities: 150, marketing: 0, total: 1100 },
    { date: "Mar 20", payroll: 1000, inventory: 400, rent: 0, utilities: 0, marketing: 100, total: 1500 },
    { date: "Mar 25", payroll: 1050, inventory: 0, rent: 0, utilities: 0, marketing: 0, total: 1050 },
    { date: "Mar 30", payroll: 1100, inventory: 450, rent: 2200, utilities: 0, marketing: 0, total: 3750 },
  ]

  // Mock profit data
  const profitData = revenueData.map((item, index) => ({
    date: item.date,
    revenue: item.total,
    expenses: expenseData[index].total,
    profit: item.total - expenseData[index].total,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>View detailed financial reports for your salon</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="icon">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profit-loss">
            <TabsList className="mb-4">
              <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="tax">Tax Report</TabsTrigger>
            </TabsList>

            <TabsContent value="profit-loss">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={16850} /></div>
                      <p className="text-xs text-muted-foreground">For selected period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={10950} /></div>
                      <p className="text-xs text-muted-foreground">For selected period</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={5900} /></div>
                      <p className="text-xs text-muted-foreground">For selected period</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profit & Loss Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profitData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" strokeWidth={2} />
                          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#82ca9d" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit" name="Profit" stroke="#ffc658" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={13700} /></div>
                      <p className="text-xs text-muted-foreground">81% of total revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Product Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={3150} /></div>
                      <p className="text-xs text-muted-foreground">19% of total revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={87.50} /></div>
                      <p className="text-xs text-muted-foreground">From 192 transactions</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="services" name="Services" fill="#8884d8" />
                          <Bar dataKey="products" name="Products" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Payroll</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={6650} /></div>
                      <p className="text-xs text-muted-foreground">61% of total expenses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={1500} /></div>
                      <p className="text-xs text-muted-foreground">14% of total expenses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Rent & Utilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={2650} /></div>
                      <p className="text-xs text-muted-foreground">24% of total expenses</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expenseData}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="payroll" name="Payroll" fill="#8884d8" />
                          <Bar dataKey="inventory" name="Inventory" fill="#82ca9d" />
                          <Bar dataKey="rent" name="Rent" fill="#ffc658" />
                          <Bar dataKey="utilities" name="Utilities" fill="#ff8042" />
                          <Bar dataKey="marketing" name="Marketing" fill="#a4de6c" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tax">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Sales Tax Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={1495.44} /></div>
                      <p className="text-xs text-muted-foreground">8.875% of taxable sales</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Payroll Taxes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={997.50} /></div>
                      <p className="text-xs text-muted-foreground">15% of payroll</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Estimated Income Tax</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold"><CurrencyDisplay amount={1475.00} /></div>
                      <p className="text-xs text-muted-foreground">25% of net profit</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Tax Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tax Type</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Taxable Amount</TableHead>
                            <TableHead className="text-right">Tax Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Sales Tax</TableCell>
                            <TableCell>8.875%</TableCell>
                            <TableCell><CurrencyDisplay amount={16850.00} /></TableCell>
                            <TableCell className="text-right"><CurrencyDisplay amount={1495.44} /></TableCell>
                            <TableCell>
                              <Badge variant="outline">Due Apr 20, 2025</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Payroll Tax</TableCell>
                            <TableCell>15%</TableCell>
                            <TableCell><CurrencyDisplay amount={6650.00} /></TableCell>
                            <TableCell className="text-right"><CurrencyDisplay amount={997.50} /></TableCell>
                            <TableCell>
                              <Badge variant="outline">Due Apr 15, 2025</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Estimated Income Tax</TableCell>
                            <TableCell>25%</TableCell>
                            <TableCell><CurrencyDisplay amount={5900.00} /></TableCell>
                            <TableCell className="text-right"><CurrencyDisplay amount={1475.00} /></TableCell>
                            <TableCell>
                              <Badge variant="outline">Due Apr 15, 2025</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

