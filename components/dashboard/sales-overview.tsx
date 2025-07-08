"use client"

import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function SalesOverview() {
  const { currentLocation } = useAuth()

  // Mock data - would be replaced with actual API calls
  const data = [
    { day: "Mon", services: 750, products: 250, total: 1000 },
    { day: "Tue", services: 650, products: 200, total: 850 },
    { day: "Wed", services: 850, products: 300, total: 1150 },
    { day: "Thu", services: 700, products: 250, total: 950 },
    { day: "Fri", services: 950, products: 350, total: 1300 },
    { day: "Sat", services: 1200, products: 450, total: 1650 },
    { day: "Sun", services: 550, products: 150, total: 700 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>
          {currentLocation === "all"
            ? "Sales data across all locations"
            : `Sales data for ${currentLocation === "loc1" ? "Downtown" : currentLocation === "loc2" ? "Westside" : "Northside"} location`}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value}`, undefined]}
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Legend />
            <Bar dataKey="services" name="Services" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="products" name="Products" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

