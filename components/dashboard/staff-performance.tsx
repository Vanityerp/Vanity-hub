"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useStaff } from "@/lib/use-staff-data"
import { useMemo } from "react"

interface StaffPerformanceProps {
  fullView?: boolean
}

export function StaffPerformance({ fullView = false }: StaffPerformanceProps) {
  const { staff: realStaff } = useStaff()

  // Generate performance data based on real staff
  const staffData = useMemo(() => {
    return realStaff.map((staff, index) => {
      // Use staff ID as seed for consistent performance metrics
      const seed = parseInt(staff.id.replace(/\D/g, '')) || index + 1
      return {
        id: staff.avatar || staff.name.split(' ').map(n => n[0]).join(''),
        name: staff.name,
        role: staff.role.charAt(0).toUpperCase() + staff.role.slice(1).replace('_', ' '),
        revenue: Math.floor(2000 + (seed * 456) % 3000), // 2000-5000 revenue
        appointments: Math.floor(25 + (seed * 123) % 35), // 25-60 appointments
        utilization: Math.floor(70 + (seed * 789) % 25), // 70-95% utilization
        color: staff.color || "bg-blue-100 text-blue-800",
      }
    }).sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
  }, [realStaff])

  if (fullView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Staff Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Detailed performance metrics for all staff members.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue">
            <TabsList className="mb-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="utilization">Utilization</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <div className="space-y-6">
                {staffData.map((staff) => (
                  <div key={staff.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${staff.color}`}>
                          <AvatarFallback>{staff.id.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium"><CurrencyDisplay amount={staff.revenue} /></p>
                      </div>
                    </div>
                    <Progress value={(staff.revenue / 5000) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <div className="space-y-6">
                {staffData.map((staff) => (
                  <div key={staff.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${staff.color}`}>
                          <AvatarFallback>{staff.id.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{staff.appointments} appointments</p>
                      </div>
                    </div>
                    <Progress value={(staff.appointments / 60) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="utilization">
              <div className="space-y-6">
                {staffData.map((staff) => (
                  <div key={staff.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-8 w-8 ${staff.color}`}>
                          <AvatarFallback>{staff.id.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{staff.utilization}%</p>
                      </div>
                    </div>
                    <Progress value={staff.utilization} className="h-2" />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Staff Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Top performing staff members.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {staffData.slice(0, 3).map((staff) => (
            <div key={staff.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className={`h-8 w-8 ${staff.color}`}>
                  <AvatarFallback>{staff.id.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{staff.name}</p>
                  <p className="text-xs text-muted-foreground">{staff.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium"><CurrencyDisplay amount={staff.revenue} /></p>
                <p className="text-xs text-muted-foreground">{staff.appointments} appts</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

