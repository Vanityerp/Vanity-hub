"use client"

import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-provider"
import { useCurrency } from "@/lib/currency-provider"
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const { theme } = useTheme()
  const { currentLocation } = useAuth()
  const { currency, formatCurrency } = useCurrency()

  // Generate data based on date range
  const generateChartData = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return defaultData
    }

    const { from, to } = dateRange
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

    // For different time periods, use different grouping
    if (daysDiff <= 1) {
      // Single day - show hourly data
      const hours = Array.from({ length: 12 }, (_, i) => i + 9) // 9am to 8pm
      return hours.map(hour => {
        const serviceRevenue = Math.floor(Math.random() * 250) + 150
        const productRevenue = Math.floor(Math.random() * 100) + 50
        return {
          name: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
          services: serviceRevenue,
          products: productRevenue,
          total: serviceRevenue + productRevenue
        }
      })
    } else if (daysDiff <= 31) {
      // Up to a month - show daily data
      return eachDayOfInterval({ start: from, end: to }).map(date => {
        const serviceRevenue = Math.floor(Math.random() * 800) + 600
        const productRevenue = Math.floor(Math.random() * 400) + 200
        return {
          name: format(date, "MMM d"),
          date,
          services: serviceRevenue,
          products: productRevenue,
          total: serviceRevenue + productRevenue
        }
      })
    } else if (daysDiff <= 90) {
      // Up to 3 months - show weekly data
      return eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 }).map(date => {
        const serviceRevenue = Math.floor(Math.random() * 4000) + 3000
        const productRevenue = Math.floor(Math.random() * 2000) + 1000
        return {
          name: `Week of ${format(date, "MMM d")}`,
          date,
          services: serviceRevenue,
          products: productRevenue,
          total: serviceRevenue + productRevenue
        }
      })
    } else {
      // More than 3 months - show monthly data
      return eachMonthOfInterval({ start: from, end: to }).map(date => {
        const serviceRevenue = Math.floor(Math.random() * 12000) + 10000
        const productRevenue = Math.floor(Math.random() * 6000) + 4000
        return {
          name: format(date, "MMM yyyy"),
          date,
          services: serviceRevenue,
          products: productRevenue,
          total: serviceRevenue + productRevenue
        }
      })
    }
  }

  // Default monthly data
  const defaultData = [
    { name: "Jan", services: 1750, products: 750, total: 2500 },
    { name: "Feb", services: 2100, products: 900, total: 3000 },
    { name: "Mar", services: 1960, products: 840, total: 2800 },
    { name: "Apr", services: 2240, products: 960, total: 3200 },
    { name: "May", services: 2800, products: 1200, total: 4000 },
    { name: "Jun", services: 2660, products: 1140, total: 3800 },
    { name: "Jul", services: 2940, products: 1260, total: 4200 },
    { name: "Aug", services: 3150, products: 1350, total: 4500 },
    { name: "Sep", services: 3360, products: 1440, total: 4800 },
    { name: "Oct", services: 3500, products: 1500, total: 5000 },
    { name: "Nov", services: 3290, products: 1410, total: 4700 },
    { name: "Dec", services: 3640, products: 1560, total: 5200 },
  ]

  const data = generateChartData()

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currency.symbol}${value}`}
          />
          <Tooltip
            formatter={(value, name) => {
              const formattedName = name === 'services' ? 'Services' : name === 'products' ? 'Products' : 'Total'
              return [`${currency.symbol}${value}`, formattedName]
            }}
            contentStyle={{
              backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
              borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
            }}
          />
          <Legend />
          <Bar dataKey="services" name="Services" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="products" name="Products" fill="#82ca9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

