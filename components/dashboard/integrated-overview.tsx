"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useAuth } from "@/lib/auth-provider"
import { integratedAnalyticsService, type IntegratedAnalytics } from "@/lib/integrated-analytics-service"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart
} from "lucide-react"

interface IntegratedOverviewProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

function IntegratedOverview({ dateRange }: IntegratedOverviewProps) {
  const { currentLocation } = useAuth()
  const [analytics, setAnalytics] = useState<IntegratedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = () => {
      try {
        const data = integratedAnalyticsService.getAnalytics(
          dateRange?.from,
          dateRange?.to,
          currentLocation?.id?.toString()
        )
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to load integrated analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()

    // Subscribe to analytics updates
    const unsubscribe = integratedAnalyticsService.subscribe(setAnalytics)
    return unsubscribe
  }, [dateRange, currentLocation])

  if (loading || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold
    return isGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
  }

  const getStatusIcon = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold
    return isGood ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={analytics.totalRevenue} />
            </div>
            <div className="flex items-center space-x-2 text-xs mt-2">
              <div className="flex items-center">
                {React.createElement(getStatusIcon(analytics.revenueGrowth, 0), {
                  className: `h-3 w-3 ${getStatusColor(analytics.revenueGrowth, 0)}`
                })}
                <span className={getStatusColor(analytics.revenueGrowth, 0)}>
                  {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
                </span>
              </div>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services:</span>
                <span><CurrencyDisplay amount={analytics.serviceRevenue} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products:</span>
                <span><CurrencyDisplay amount={analytics.productRevenue} /></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={analytics.netProfit} />
            </div>
            <div className="flex items-center space-x-2 text-xs mt-2">
              <span className={getStatusColor(analytics.netMargin, 20)}>
                {analytics.netMargin.toFixed(1)}% margin
              </span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Profit:</span>
                <span><CurrencyDisplay amount={analytics.grossProfit} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Margin:</span>
                <span>{analytics.grossMargin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold dashboard-amount">
              <CurrencyDisplay amount={analytics.inventoryValue} />
            </div>
            <div className="flex items-center space-x-2 text-xs mt-2">
              <span className={`${getStatusColor(analytics.inventoryTurnover, 5)} truncate`}>
                {analytics.inventoryTurnover.toFixed(1)}x turnover
              </span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground truncate">Low Stock:</span>
                <span className={`${analytics.lowStockItems > 0 ? "text-yellow-600 dark:text-yellow-400" : ""} flex-shrink-0`}>
                  {analytics.lowStockItems} items
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground truncate">Out of Stock:</span>
                <span className={`${analytics.outOfStockItems > 0 ? "text-red-600 dark:text-red-400" : ""} flex-shrink-0`}>
                  {analytics.outOfStockItems} items
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={analytics.averageTransactionValue} />
            </div>
            <div className="flex items-center space-x-2 text-xs mt-2">
              <span className={getStatusColor(analytics.profitPerTransaction, 20)}>
                <CurrencyDisplay amount={analytics.profitPerTransaction} /> profit
              </span>
            </div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Client:</span>
                <span><CurrencyDisplay amount={analytics.revenuePerClient} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Flow:</span>
                <span className={getStatusColor(analytics.cashFlow, 0)}>
                  <CurrencyDisplay amount={analytics.cashFlow} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performing products by revenue with trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSellingProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="relative p-4 border rounded-lg hover:shadow-md transition-shadow">
                  {/* Rank and Product Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                        index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.category}</div>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      product.trend > 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                      product.trend < 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                      'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {product.trend > 0 ? '↗' : product.trend < 0 ? '↘' : '→'}
                      {Math.abs(product.trend).toFixed(1)}%
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-semibold text-sm">
                        <CurrencyDisplay amount={product.revenue} />
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Units Sold</div>
                      <div className="font-semibold text-sm">{product.quantitySold}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Price</div>
                      <div className="font-semibold text-sm">
                        <CurrencyDisplay amount={product.averagePrice} />
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Margin</div>
                      <div className={`font-semibold text-sm ${
                        product.margin > 50 ? 'text-green-600 dark:text-green-400' :
                        product.margin > 30 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {product.margin.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Revenue */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Revenue Performance</span>
                      <span>{((product.revenue / analytics.topSellingProducts[0].revenue) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-400' :
                          'bg-blue-400'
                        }`}
                        style={{
                          width: `${(product.revenue / analytics.topSellingProducts[0].revenue) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary Stats */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">
                      <CurrencyDisplay amount={analytics.topSellingProducts.reduce((sum, p) => sum + p.revenue, 0)} />
                    </div>
                    <div className="text-xs text-muted-foreground">Total Revenue</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {analytics.topSellingProducts.reduce((sum, p) => sum + p.quantitySold, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Units Sold</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {(analytics.topSellingProducts.reduce((sum, p) => sum + p.margin, 0) / analytics.topSellingProducts.length).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Margin</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Services
            </CardTitle>
            <CardDescription>Most popular services by bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topServices.slice(0, 5).map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium text-sm">{service.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.bookings} bookings • <CurrencyDisplay amount={service.averagePrice} /> avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      <CurrencyDisplay amount={service.revenue} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total revenue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recommendations */}
      {(analytics.lowStockItems > 0 || analytics.outOfStockItems > 0 || analytics.netMargin < 20) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alerts & Recommendations
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.lowStockItems > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="font-medium text-sm text-yellow-800 dark:text-yellow-200">Low Stock Alert</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-300">
                      {analytics.lowStockItems} products are running low on inventory
                    </div>
                  </div>
                </div>
              )}

              {analytics.outOfStockItems > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="font-medium text-sm text-red-800 dark:text-red-200">Out of Stock</div>
                    <div className="text-xs text-red-600 dark:text-red-300">
                      {analytics.outOfStockItems} products are completely out of stock
                    </div>
                  </div>
                </div>
              )}

              {analytics.netMargin < 20 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-sm text-blue-800 dark:text-blue-200">Profit Margin Opportunity</div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                      Current margin is {analytics.netMargin.toFixed(1)}%. Consider optimizing pricing or reducing costs.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default IntegratedOverview
