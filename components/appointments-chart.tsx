"use client"

import { useAuth } from "@/lib/auth-provider"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface AppointmentsChartProps {
  dateRange: string
}

export function AppointmentsChart({ dateRange }: AppointmentsChartProps) {
  const { currentLocation } = useAuth()

  // In a real app, this data would be fetched from an API based on the current location and date range
  const data = [
    { name: "Mon", appointments: 24 },
    { name: "Tue", appointments: 18 },
    { name: "Wed", appointments: 22 },
    { name: "Thu", appointments: 17 },
    { name: "Fri", appointments: 28 },
    { name: "Sat", appointments: 32 },
    { name: "Sun", appointments: 12 },
  ]

  return (
    <ChartContainer
      config={{
        appointments: {
          label: "Appointments",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
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
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="appointments"
          stroke="var(--color-appointments)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

