"use client"

import { useAuth } from "@/lib/auth-provider"
import { useCurrency } from "@/lib/currency-provider"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"

interface SalesChartProps {
  dateRange?: DateRange
  groupBy?: "day" | "week" | "month"
}

export function SalesChart({ dateRange, groupBy = "day" }: SalesChartProps) {
  const { currentLocation } = useAuth()
  const { currency } = useCurrency()

  // Generate mock data based on date range
  const generateData = () => {
    const startDate = dateRange?.from || subDays(new Date(), 30)
    const endDate = dateRange?.to || new Date()
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const data = []
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i)
      const services = Math.floor(Math.random() * 1000) + 500
      const products = Math.floor(Math.random() * 500) + 200

      data.push({
        date: format(date, "MMM dd"),
        services,
        products,
        total: services + products,
      })
    }

    return data
  }

  const data = generateData()

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [`${currency.symbol}${value.toFixed(2)}`, undefined]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar dataKey="services" name="Services" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="products" name="Products" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

