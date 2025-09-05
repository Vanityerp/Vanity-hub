"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { StaffAvatar } from "@/components/ui/staff-avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { Mail, Phone, Edit, Trash, Home, MapPin } from "lucide-react"
import { EditStaffDialog } from "./edit-staff-dialog"
import { DeleteStaffDialog } from "./delete-staff-dialog"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { useLocations } from "@/lib/location-provider"

import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useSchedule } from "@/lib/schedule-provider"
import { format, parseISO } from "date-fns"

interface StaffDetailsDialogProps {
  staff: {
    id: string
    name: string
    role: string
    email: string
    phone: string
    locations: string[]
    status: string
    avatar: string
    color: string
    homeService?: boolean
    specialties?: string[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffUpdated?: (updatedStaff: any) => void
  onStaffDeleted?: (staffId: string) => void
}

export function StaffDetailsDialog({
  staff: initialStaff,
  open,
  onOpenChange,
  onStaffUpdated,
  onStaffDeleted
}: StaffDetailsDialogProps) {
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  const { getLocationName, locations: availableLocations } = useLocations()

  const { getStaffSchedule, getStaffTimeOffRequests, refreshSchedules } = useSchedule()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [staffSchedules, setStaffSchedules] = useState([])
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const [staff, setStaff] = useState(initialStaff)


  // Update local staff state when prop changes
  useEffect(() => {
    setStaff(initialStaff)
  }, [initialStaff])

  // Days of the week for schedule display
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]





  // Helper function to get staff member's primary location
  const getPrimaryLocation = (staff: any) => {
    if (!staff.locations || staff.locations.length === 0) {
      return null
    }

    // If staff has "all" locations, return the first available location as primary
    if (staff.locations.includes("all")) {
      const firstLocation = availableLocations.find(loc => loc.status === "Active")
      return firstLocation ? firstLocation.id : null
    }

    // Return the first location that's not "home" as the primary location
    const primaryLocationId = staff.locations.find((loc: string) => loc !== "home")
    return primaryLocationId || staff.locations[0]
  }

  // Load staff schedules, time off requests, and services
  useEffect(() => {
    if (open && staff?.id) {
      // Try multiple approaches to find schedule data
      let schedules = getStaffSchedule(staff.id)

      // If no schedules found with database ID, try fallback approaches
      if (schedules.length === 0) {
        // Try with name-based ID for backward compatibility with demo data
        const nameBasedId = staff.name.toLowerCase().replace(/\s+/g, '-')
        schedules = getStaffSchedule(nameBasedId)

        if (schedules.length > 0) {
          console.log(`Found schedule data using name-based ID: ${nameBasedId}`)
        } else {
          console.log(`No schedule data found for ${staff.name} (tried IDs: ${staff.id}, ${nameBasedId})`)
        }
      }

      const timeOff = getStaffTimeOffRequests(staff.id)

      console.log(`Loading schedule for ${staff.name} (ID: ${staff.id})`)
      console.log("Found schedules:", schedules)

      setStaffSchedules(schedules)
      setTimeOffRequests(timeOff)


    } else if (!open) {
      // Reset state when dialog closes
      setIsEditDialogOpen(false)
      setIsDeleteDialogOpen(false)
      setStaffSchedules([])
      setTimeOffRequests([])
    }
  }, [open, staff?.id, getStaffSchedule, getStaffTimeOffRequests])

  const handleEditClick = () => {
    // Close the details dialog and trigger edit from parent
    onOpenChange(false)
    // Use a callback to trigger edit dialog from parent component
    setTimeout(() => {
      // This will be handled by the parent component
      const editEvent = new CustomEvent('staff-edit-requested', {
        detail: { staffId: staff.id }
      })
      window.dispatchEvent(editEvent)
    }, 100)
  }

  const handleDeleteClick = () => {
    // Close the details dialog and trigger delete from parent
    onOpenChange(false)
    // Use a callback to trigger delete dialog from parent component
    setTimeout(() => {
      // This will be handled by the parent component
      const deleteEvent = new CustomEvent('staff-delete-requested', {
        detail: { staff: { id: staff.id, name: staff.name } }
      })
      window.dispatchEvent(deleteEvent)
    }, 100)
  }

  const handleStaffUpdated = (updatedStaff: any) => {
    // Update local staff state with the new data
    setStaff(updatedStaff)

    if (onStaffUpdated) {
      onStaffUpdated(updatedStaff)
    }
    toast({
      title: "Staff updated",
      description: `${updatedStaff.name}'s information has been updated successfully.`,
    })
    // Close edit dialog and reset state
    setIsEditDialogOpen(false)
    // Don't close the main details dialog so user can see the updated data
  }

  const handleStaffDeleted = (staffId: string) => {
    if (onStaffDeleted) {
      onStaffDeleted(staffId)
    }
    // Close delete dialog and reset state
    setIsDeleteDialogOpen(false)
    onOpenChange(false)
  }

  // Handle schedule update
  const handleScheduleUpdated = () => {
    // Refresh schedules from the context
    refreshSchedules()

    // Update local state
    if (staff?.id) {
      const updatedSchedules = getStaffSchedule(staff.id)
      setStaffSchedules(updatedSchedules)
    }
  }

  // Check if a staff has time off on a specific day
  const hasTimeOff = (day: string) => {
    if (!timeOffRequests.length) return false

    // Get the date for the day of the week (current week)
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayIndex = days.indexOf(day) // 0 = Monday, 1 = Tuesday, etc.
    if (dayIndex === -1) return false

    // Calculate the actual date for this day of the current week
    const daysFromToday = (dayIndex + 1) - currentDayOfWeek // +1 because our array starts with Monday
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysFromToday)
    targetDate.setHours(0, 0, 0, 0) // Start of day

    // Check if any approved time off request includes this specific date
    return timeOffRequests.some((request: any) => {
      if (request.status !== "approved") return false

      try {
        const requestStart = parseISO(request.startDate)
        const requestEnd = parseISO(request.endDate)

        // Set times to start/end of day for proper comparison
        requestStart.setHours(0, 0, 0, 0)
        requestEnd.setHours(23, 59, 59, 999)

        // Check if the target date falls within the time off period
        return targetDate >= requestStart && targetDate <= requestEnd
      } catch (error) {
        console.error("Error parsing time off dates:", error)
        return false
      }
    })
  }

  // Get schedule for a specific day
  const getDaySchedule = (day: string) => {
    const schedule = staffSchedules.find((s: any) => s.day === day)

    // If no schedule found for this day, it could be a day off
    if (!schedule) {
      return null
    }

    // Check if this schedule is marked as a day off
    if (schedule.isDayOff) {
      return null
    }

    return schedule
  }

  // Check if a day is a scheduled day off (no schedule entry or marked as day off)
  const isDayOff = (day: string) => {
    const schedule = staffSchedules.find((s: any) => s.day === day)

    console.log(`Checking day off for ${day}:`, {
      schedule,
      hasSchedule: !!schedule,
      isDayOff: schedule?.isDayOff,
      staffName: staff.name
    })

    // If no schedule exists for this day, it's a day off
    if (!schedule) {
      return true
    }

    // If schedule exists but is marked as day off
    if (schedule.isDayOff) {
      return true
    }

    return false
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>View detailed information about this staff member.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4">
            <StaffAvatar
              staff={staff}
              size="xl"
            />
            <div>
              <h3 className="text-xl font-semibold">{staff.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {staff.role === "super_admin"
                    ? "Super Admin"
                    : staff.role === "org_admin"
                      ? "Organization Admin"
                      : staff.role === "location_manager"
                        ? "Location Manager"
                        : staff.role === "stylist"
                          ? "Stylist"
                          : staff.role === "colorist"
                            ? "Colorist"
                            : staff.role === "nail_technician"
                              ? "Nail Technician"
                              : staff.role === "esthetician"
                                ? "Esthetician"
                                : staff.role === "barber"
                                  ? "Barber"
                                  : "Receptionist"}
                </Badge>
                <span>•</span>
                <Badge variant={staff.status === "Active" ? "default" : "secondary"}>{staff.status}</Badge>
                {(() => {
                  const primaryLocationId = getPrimaryLocation(staff)
                  if (primaryLocationId) {
                    return (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationName(primaryLocationId)}
                        </Badge>
                      </>
                    )
                  }
                  return null
                })()}
                {staff.homeService && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      Home Service
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.phone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {staff.locations.map((loc) => (
                    <Badge key={loc} variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getLocationName(loc)}
                    </Badge>
                  ))}
                  {staff.locations.includes("all") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      All Locations
                    </Badge>
                  )}
                  {staff.homeService && !staff.locations.includes("home") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      Home Service
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Services</h4>
                {staff?.specialties && staff.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {staff.specialties.map((service, index) => (
                      <Badge key={index} variant="outline">{service}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No services assigned to this staff member.
                    {hasPermission("edit_staff") && " Click 'Edit Staff' to add services."}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">No notes available for this staff member.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b">
                  <div className="p-2 font-medium text-center border-r">Hours</div>
                  {days.map((day) => (
                    <div key={day} className="p-2 font-medium text-center border-r last:border-r-0">
                      {day.substring(0, 3)}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[100px_repeat(7,1fr)]">
                  <div className="p-2 font-medium border-r">Schedule</div>
                  {days.map((day) => {
                    const daySchedule = getDaySchedule(day)
                    const isTimeOff = hasTimeOff(day)
                    const isScheduledDayOff = isDayOff(day)

                    return (
                      <div key={day} className="p-2 border-r last:border-r-0 min-h-[40px] relative">
                        {isTimeOff ? (
                          <div className="bg-red-100 text-red-800 rounded p-1 text-xs text-center">
                            Time Off
                          </div>
                        ) : isScheduledDayOff ? (
                          <div className="bg-muted text-muted-foreground rounded p-1 text-xs text-center">
                            Day Off
                          </div>
                        ) : daySchedule ? (
                          <div className="bg-primary/10 text-primary rounded p-1 text-xs text-center">
                            <span className="font-medium">{daySchedule.startTime} - {daySchedule.endTime}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs text-center">
                            Not Scheduled
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Upcoming Time Off</h4>
                {timeOffRequests.length === 0 ? (
                  <div className="rounded-md border p-4 text-center text-muted-foreground">
                    No upcoming time off scheduled
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeOffRequests
                      .filter((request: any) => request.status === "approved")
                      .map((request: any) => (
                        <div key={request.id} className="rounded-md border p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{request.reason}</h5>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(request.startDate), "MMM d, yyyy")} - {format(parseISO(request.endDate), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge>Approved</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border p-4">
                  <h4 className="font-medium mb-1">Appointments</h4>
                  <p className="text-2xl font-bold">124</p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>

                <div className="rounded-md border p-4">
                  <h4 className="font-medium mb-1">Revenue</h4>
                  <p className="text-2xl font-bold"><CurrencyDisplay amount={9350} /></p>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>

                <div className="rounded-md border p-4">
                  <h4 className="font-medium mb-1">Client Rating</h4>
                  <p className="text-2xl font-bold">4.8/5</p>
                  <p className="text-sm text-muted-foreground">Based on 87 reviews</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Top Services</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Haircut & Style</span>
                    <span>45 appointments</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "45%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Color & Highlights</span>
                    <span>28 appointments</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "28%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Blowout</span>
                    <span>18 appointments</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "18%" }}></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Client Feedback</h4>
                <div className="space-y-2">
                  <div className="rounded-md border p-3">
                    <p className="text-sm">"Always does an amazing job with my hair. Highly recommend!"</p>
                    <p className="text-xs text-muted-foreground mt-1">- Jennifer K., Apr 1, 2025</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm">"Professional and friendly. My go-to stylist for years now."</p>
                    <p className="text-xs text-muted-foreground mt-1">- Michael B., Mar 25, 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hasPermission("edit_staff") && (
            <Button variant="default" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Staff
            </Button>
          )}
          {hasPermission("delete_staff") && (
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </>
  )
}

