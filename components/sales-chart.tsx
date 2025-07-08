"use client"

import { useAuth } from "@/lib/auth-provider"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface SalesChartProps {
  dateRange: string
}

export function SalesChart({ dateRange }: SalesChartProps) {
  const { currentLocation } = useAuth()

  // In a real app, this data would be fetched from an API based on the current location and date range
  const data = [
    { name: "Mon", services: 1200, products: 400, total: 1600 },
    { name: "Tue", services: 1100, products: 300, total: 1400 },
    { name: "Wed", services: 1300, products: 500, total: 1800 },
    { name: "Thu", services: 900, products: 400, total: 1300 },
    { name: "Fri", services: 1500, products: 600, total: 2100 },
    { name: "Sat", services: 1800, products: 700, total: 2500 },
    { name: "Sun", services: 800, products: 300, total: 1100 },
  ]

  return (
    <ChartContainer
      config={{
        services: {
          label: "Services",
          color: "hsl(var(--chart-1))",
        },
        products: {
          label: "Products",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
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
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="services" fill="var(--color-services)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="products" fill="var(--color-products)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

