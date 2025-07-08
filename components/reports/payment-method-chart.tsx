"use client"

import { useAuth } from "@/lib/auth-provider"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { DateRange } from "react-day-picker"

interface PaymentMethodChartProps {
  dateRange?: DateRange
}

export function PaymentMethodChart({ dateRange }: PaymentMethodChartProps) {
  const { currentLocation } = useAuth()

  // Mock data for payment methods
  const data = [
    { name: "Credit Card", value: 3256.75 },
    { name: "Cash", value: 1618.50 },
    { name: "Mobile Payment", value: 583.25 },
  ]

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"]

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
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
