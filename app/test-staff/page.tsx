"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStaff } from "@/lib/staff-provider"
import { resetStaffData } from "@/lib/reset-data"

export default function TestStaffPage() {
  const { staff, refreshStaff } = useStaff()
  const [isResetting, setIsResetting] = useState(false)

  const handleResetStaff = async () => {
    setIsResetting(true)
    try {
      // Clear localStorage
      localStorage.removeItem('vanity_staff')
      console.log('✅ Cleared staff data from localStorage')
      
      // Call API to reset staff data
      const response = await fetch('/api/add-real-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      console.log('API Response:', result)
      
      // Refresh staff data
      refreshStaff()
      
      // Force page reload to ensure fresh data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Error resetting staff:', error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Staff Data Test Page</h1>
        <p className="text-gray-600">Verify that exactly 7 real staff members are loaded</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Count Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Staff Members:</span>
                <span className={`font-bold ${staff.length === 7 ? 'text-green-600' : 'text-red-600'}`}>
                  {staff.length} {staff.length === 7 ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Expected: 7 real staff members from HR system
              </div>
              <Button 
                onClick={handleResetStaff} 
                disabled={isResetting}
                variant={staff.length === 7 ? "outline" : "default"}
              >
                {isResetting ? "Resetting..." : "Reset to 7 Real Staff Members"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staff.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.role} • Employee #{member.employeeNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.locations.join(', ')}
                  </div>
                </div>
              ))}
              
              {staff.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No staff members found. Click "Reset to 7 Real Staff Members" to load the correct data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Staff Members (7)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>1. Mekdes Abebe (9100) - Stylist - D-Ring Road</div>
              <div>2. Woyni Tade (9101) - Stylist - Medinat Khalifa</div>
              <div>3. Maria Santos (9102) - Nail Technician - Muaither</div>
              <div>4. Fatima Al-Zahra (9103) - Esthetician - Medinat Khalifa</div>
              <div>5. Jane Mussa (9104) - Colorist - Muaither</div>
              <div>6. Aisha Mohammed (9105) - Receptionist - D-Ring Road</div>
              <div>7. Aster Bekele (9106) - Stylist - D-Ring Road</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
