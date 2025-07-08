"use client"

import { useAuth } from "@/lib/auth-provider"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { DateRange } from "react-day-picker"

interface ServicePopularityChartProps {
  dateRange?: DateRange
  type: "count" | "revenue"
}

export function ServicePopularityChart({ dateRange, type }: ServicePopularityChartProps) {
  const { currentLocation } = useAuth()

  // Mock data - would be replaced with actual API calls
  const data =
    type === "count"
      ? [
          { name: "Haircut & Style", value: 85 },
          { name: "Color & Highlights", value: 65 },
          { name: "Men's Haircut", value: 45 },
          { name: "Manicure & Pedicure", value: 35 },
          { name: "Facial Treatment", value: 25 },
          { name: "Other Services", value: 20 },
        ]
      : [
          { name: "Color & Highlights", value: 9750 },
          { name: "Haircut & Style", value: 6375 },
          { name: "Manicure & Pedicure", value: 3325 },
          { name: "Facial Treatment", value: 2125 },
          { name: "Men's Haircut", value: 2475 },
          { name: "Other Services", value: 1500 },
        ]

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "#8884d8"]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) =>
            type === "revenue" ? [`$${value.toFixed(2)}`, "Revenue"] : [value, "Appointments"]
          }
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

