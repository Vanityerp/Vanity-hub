"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useStaff } from "@/lib/use-staff-data"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffDirectory } from "@/components/staff/staff-directory"
import { StaffSchedule } from "@/components/staff/staff-schedule"
import { StaffPerformance } from "@/components/staff/staff-performance"
import { NewStaffDialog } from "@/components/new-staff-dialog"
import { AccessDenied } from "@/components/access-denied"
import { Plus, Search, UserCog } from "lucide-react"
import { StaffStorage } from "@/lib/staff-storage"

export default function StaffPage() {
  const { user, hasPermission } = useAuth()
  const { staff: realStaff } = useStaff()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleStaffUpdated = (updatedStaff: any) => {
    // Real staff data will be automatically refreshed by the useStaff hook
    console.log("Staff updated:", updatedStaff)
  }

  const handleStaffDeleted = (staffId: string) => {
    // Real staff data will be automatically refreshed by the useStaff hook
    console.log("Staff deleted:", staffId)
  }

  const handleStaffAdded = () => {
    // Real staff data will be automatically refreshed by the useStaff hook
    console.log("New staff added")
  }

  // Check if user has permission to view staff page
  if (!hasPermission("view_staff")) {
    return (
      <AccessDenied
        description="You don't have permission to view the staff management page."
        backButtonHref="/dashboard"
      />
    )
  }

  const router = useRouter()

  const navigateToHRManagement = () => {
    router.push("/dashboard/hr")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Manage your salon staff, schedules, and performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[200px] md:w-[300px]"
            />
          </div>
          <Button variant="outline" onClick={navigateToHRManagement}>
            <UserCog className="mr-2 h-4 w-4" />
            HR Management
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" forceMount className={`data-[state=inactive]:hidden`}>
          <StaffDirectory
            search={search}
            onStaffUpdated={handleStaffUpdated}
            onStaffDeleted={handleStaffDeleted}
          />
        </TabsContent>

        <TabsContent value="schedule" forceMount className={`data-[state=inactive]:hidden`}>
          <StaffSchedule />
        </TabsContent>

        <TabsContent value="performance" forceMount className={`data-[state=inactive]:hidden`}>
          <StaffPerformance />
        </TabsContent>
      </Tabs>

      <NewStaffDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onStaffAdded={handleStaffAdded}
      />
    </div>
  )
}

