"use client"
import { useAuth } from "@/lib/auth-provider"
import { StaffAvailability } from "@/components/scheduling/staff-availability"

export default function AvailabilityPage() {
  const { currentLocation } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Staff Availability</h2>
        <p className="text-muted-foreground">
          {currentLocation === "all"
            ? "Check availability across all locations"
            : `Check availability at ${currentLocation === "loc1" ? "Downtown" : currentLocation === "loc2" ? "Westside" : "Northside"} location`}
        </p>
      </div>

      <StaffAvailability />
    </div>
  )
}

