"use client"

import { useAuth } from "@/lib/auth-provider"
import { useStaff } from "@/lib/staff-provider"

export function DebugStaff() {
  const { currentLocation } = useAuth()
  const { staff, getStaffByLocation } = useStaff()

  // Get staff for the current location using the provider
  const availableStaff = getStaffByLocation(currentLocation)

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Debug Staff Information</h2>
      <p className="mb-2">Current Location: {currentLocation}</p>
      <p className="mb-2">Available Staff Count: {availableStaff.length}</p>
      <div className="mb-4">
        <h3 className="font-medium mb-1">Staff with homeService=true:</h3>
        <ul className="list-disc pl-5">
          {staff.filter(s => s.homeService === true).map(staff => (
            <li key={staff.id}>{staff.name} (Locations: {staff.locations.join(", ")})</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-medium mb-1">Available Staff for Current Location:</h3>
        <ul className="list-disc pl-5">
          {availableStaff.map(staff => (
            <li key={staff.id}>{staff.name} (Locations: {staff.locations.join(", ")}, Home Service: {staff.homeService ? "Yes" : "No"})</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
