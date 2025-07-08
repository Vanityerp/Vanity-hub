"use client"

import { useAuth } from "@/lib/auth-provider"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"

interface AppointmentsChartProps {
  dateRange?: DateRange
}

export function AppointmentsChart({ dateRange }: AppointmentsChartProps) {
  const { currentLocation } = useAuth()

  // Generate mock data based on date range
  const generateData = () => {
    const startDate = dateRange?.from || subDays(new Date(), 30)
    const endDate = dateRange?.to || new Date()
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const data = []
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i)
      const appointments = Math.floor(Math.random() * 15) + 5
      const completionRate = Math.floor(Math.random() * 20) + 80

      data.push({
        date: format(date, "MMM dd"),
        appointments,
        completionRate,
      })
    }

    return data
  }

  const data = generateData()

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
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
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "completionRate") return [`${value}%`, "Completion Rate"]
            return [value, "Appointments"]
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="appointments"
          name="Appointments"
          stroke="var(--chart-1)"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="completionRate"
          name="Completion Rate"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

