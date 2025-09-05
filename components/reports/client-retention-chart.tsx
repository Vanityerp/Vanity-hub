"use client"

import { useAuth } from "@/lib/auth-provider"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"

interface ClientRetentionChartProps {
  dateRange?: DateRange
}

export function ClientRetentionChart({ dateRange }: ClientRetentionChartProps) {
  const { currentLocation } = useAuth()

  // Generate mock data based on date range
  const generateData = () => {
    const startDate = dateRange?.from || subDays(new Date(), 30)
    const endDate = dateRange?.to || new Date()
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Group by week if more than 14 days
    const groupByWeek = days > 14
    const groupSize = groupByWeek ? 7 : 1
    const groups = Math.ceil(days / groupSize)

    const data = []
    for (let i = 0; i < groups; i++) {
      const date = addDays(startDate, i * groupSize)
      const newClients = Math.floor(Math.random() * 5) + 1
      const returningClients = Math.floor(Math.random() * 10) + 5

      data.push({
        date: format(date, groupByWeek ? "'Week of' MMM dd" : "MMM dd"),
        new: newClients,
        returning: returningClients,
        total: newClients + returningClients,
      })
    }

    return data
  }

  const data = generateData()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="new"
          name="New Clients"
          stackId="1"
          stroke="var(--chart-4)"
          fill="var(--chart-4)"
        />
        <Area
          type="monotone"
          dataKey="returning"
          name="Returning Clients"
          stackId="1"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

