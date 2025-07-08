"use client"

import { useAuth } from "@/lib/auth-provider"
import type { DateRange } from "react-day-picker"
import { Progress } from "@/components/ui/progress"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useStaff } from "@/lib/use-staff-data"
import { useMemo } from "react"

interface StaffPerformanceTableProps {
  dateRange?: DateRange
  limit?: number
}

export function StaffPerformanceTable({ dateRange, limit }: StaffPerformanceTableProps) {
  const { currentLocation } = useAuth()
  const { staff: realStaff } = useStaff()

  // Generate performance data based on real staff
  const staffData = useMemo(() => {
    return realStaff.map((staff, index) => {
      // Use staff ID as seed for consistent performance metrics
      const seed = parseInt(staff.id.replace(/\D/g, '')) || index + 1
      return {
        id: staff.id,
        name: staff.name,
        appointments: Math.floor(25 + (seed * 123) % 25), // 25-50 appointments
        revenue: Math.floor(2000 + (seed * 456) % 3000), // 2000-5000 revenue
        avgRating: Math.round((4.5 + (seed * 0.1) % 0.5) * 10) / 10, // 4.5-5.0 rating
        rebookRate: Math.floor(70 + (seed * 789) % 20), // 70-90% rebook rate
      }
    })
  }, [realStaff])

  // Limit the data if requested
  const displayData = limit ? staffData.slice(0, limit) : staffData

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Staff Member</th>
            <th className="p-3 text-right font-medium">Appointments</th>
            <th className="p-3 text-right font-medium">Revenue</th>
            <th className="p-3 text-center font-medium">Rating</th>
            <th className="p-3 text-center font-medium">Rebook Rate</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((staff) => (
            <tr key={staff.id} className="border-b">
              <td className="p-3 font-medium">{staff.name}</td>
              <td className="p-3 text-right">{staff.appointments}</td>
              <td className="p-3 text-right"><CurrencyDisplay amount={staff.revenue} /></td>
              <td className="p-3 text-center">
                <div className="flex items-center justify-center">
                  <span className="mr-2">{staff.avgRating}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(staff.avgRating) ? "text-primary fill-primary" : "text-muted"}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div className="flex flex-col items-center gap-1">
                  <Progress value={staff.rebookRate} className="h-2 w-full" />
                  <span className="text-xs">{staff.rebookRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

