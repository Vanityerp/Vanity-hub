"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useApiStaff } from "@/lib/api-staff-service"
import { useLocations } from "@/lib/location-provider"
import { useAuth } from "@/lib/auth-provider"
import { StaffSchedule as StaffScheduleType, TimeOffRequest } from "@/lib/schedule-storage"
import { useSchedule } from "@/lib/schedule-provider"
import { EditScheduleDialog } from "./edit-schedule-dialog"
import { TimeOffRequestDialog } from "./time-off-request-dialog"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, AlertCircle, Trash2 } from "lucide-react"
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns"

export function StaffSchedule() {
  const { toast } = useToast()
  const { locations, getLocationName, isHomeServiceEnabled } = useLocations()
  const { currentLocation, setCurrentLocation } = useAuth()
  const { schedules, timeOffRequests, refreshSchedules, deleteSchedule } = useSchedule()

  // Fetch real staff data from HR system
  const { staff: realStaff, isLoading: isStaffLoading, fetchStaff } = useApiStaff()

  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"day" | "week">("week")
  const [activeTab, setActiveTab] = useState<"schedules" | "time-off">("schedules")
  const [editingSchedule, setEditingSchedule] = useState<{
    staffId: string;
    staffName: string;
    day: string;
    schedule?: StaffScheduleType;
  } | null>(null)
  const [timeOffRequest, setTimeOffRequest] = useState<{
    staffId: string;
    staffName: string;
    request?: TimeOffRequest;
  } | null>(null)

  // Fetch staff data on component mount (only once)
  useEffect(() => {
    if (!isStaffLoading && realStaff.length === 0) {
      fetchStaff();
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Load schedule data on component mount (only once)
  useEffect(() => {
    refreshSchedules()
  }, []) // Already correct - no dependencies

  // Filter staff based on selected location from auth context
  const filteredStaff =
    currentLocation === "all"
      ? realStaff.filter((staff) => staff.status === "Active")
      : currentLocation === "home"
      ? realStaff.filter((staff) =>
          staff.status === "Active" &&
          (staff.homeService === true || (staff.locations && staff.locations.includes("home")))
        )
      : realStaff.filter((staff) =>
          staff.status === "Active" &&
          (staff.locations && staff.locations.includes(currentLocation))
        )

  // Get current week dates
  const startDate = startOfWeek(date, { weekStartsOn: 1 }) // Start from Monday
  const endDate = endOfWeek(date, { weekStartsOn: 1 }) // End on Sunday

  // Format date range for display
  const dateRangeText = `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  // Handle schedule update
  const handleScheduleUpdated = () => {
    refreshSchedules()
  }

  // Handle time off request update
  const handleTimeOffUpdated = () => {
    refreshSchedules()
  }

  // Delete schedule
  const handleDeleteSchedule = (scheduleId: string, staffName: string, day: string) => {
    deleteSchedule(scheduleId)

    toast({
      title: "Schedule deleted",
      description: `${staffName}'s schedule for ${day} has been deleted.`,
    })
  }

  // Check if staff has time off on a specific day
  const hasTimeOff = (staffId: string, day: string) => {
    // Convert day name to date
    const dayIndex = days.indexOf(day)
    if (dayIndex === -1) return false

    const dayDate = addDays(startDate, dayIndex)

    return timeOffRequests.some(request => {
      if (request.staffId !== staffId || request.status !== "approved") return false

      const requestStart = parseISO(request.startDate)
      const requestEnd = parseISO(request.endDate)

      return isWithinInterval(dayDate, { start: requestStart, end: requestEnd })
    })
  }

  // Get staff schedules for a specific day
  const getStaffSchedulesForDay = (day: string) => {
    return schedules.filter(schedule => schedule.day === day)
  }

  // Get schedule for a specific staff and day
  const getScheduleForStaffAndDay = (staffId: string, day: string) => {
    return schedules.find(schedule => schedule.staffId === staffId && schedule.day === day)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Staff Schedule</CardTitle>
          <CardDescription>{dateRangeText}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setDate(newDate.getDate() - (view === "day" ? 1 : 7))
                setDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(date)
                newDate.setDate(newDate.getDate() + (view === "day" ? 1 : 7))
                setDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setDate(new Date())}>
            Today
          </Button>
          <Select value={view} onValueChange={(value) => setView(value as "day" | "week")}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={currentLocation} onValueChange={setCurrentLocation}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
              {/* Home Service option is now included in the locations array from the provider */}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setTimeOffRequest({
              staffId: "",
              staffName: "All Staff",
              request: undefined
            })}
          >
            Request Time Off
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "schedules" | "time-off")}>
          <TabsList className="mb-4">
            <TabsTrigger value="schedules">
              <Calendar className="h-4 w-4 mr-2" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="time-off">
              <Clock className="h-4 w-4 mr-2" />
              Time Off Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules">
            <div className="rounded-md border overflow-x-auto">
              <div className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b">
                <div className="p-2 font-medium text-center border-r sticky left-0 bg-background">Staff</div>
                {days.map((day) => (
                  <div key={day} className="p-2 font-medium text-center border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {filteredStaff.map((staff) => {
                const staffSchedule = schedules.filter((s) => s.staffId === staff.id)

                return (
                  <div key={staff.id} className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] border-b last:border-b-0">
                    <div className="p-2 font-medium border-r flex items-center justify-center sticky left-0 bg-background">
                      {staff.name}
                    </div>
                    {days.map((day) => {
                      const daySchedule = staffSchedule.find((s) => s.day === day)
                      const isTimeOff = hasTimeOff(staff.id, day)
                      const isDayOff = daySchedule?.isDayOff

                      return (
                        <div key={day} className="p-2 border-r last:border-r-0 min-h-[60px] relative">
                          {isTimeOff ? (
                            <div className="bg-muted text-muted-foreground rounded p-1 text-xs text-center">
                              Time Off
                            </div>
                          ) : isDayOff ? (
                            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded p-1 text-xs flex flex-col">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Day Off</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 -mr-1 opacity-50 hover:opacity-100"
                                  onClick={() => handleDeleteSchedule(daySchedule.id, staff.name, day)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs opacity-75">
                                Staff Unavailable
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => setEditingSchedule({
                                  staffId: staff.id,
                                  staffName: staff.name,
                                  day,
                                  schedule: daySchedule
                                })}
                              >
                                Edit
                              </Button>
                            </div>
                          ) : daySchedule ? (
                            <div className="bg-primary/10 text-primary rounded p-1 text-xs flex flex-col">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{daySchedule.startTime} - {daySchedule.endTime}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 -mr-1 opacity-50 hover:opacity-100"
                                  onClick={() => handleDeleteSchedule(daySchedule.id, staff.name, day)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs opacity-75">
                                {getLocationName(daySchedule.location)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 text-xs"
                                onClick={() => setEditingSchedule({
                                  staffId: staff.id,
                                  staffName: staff.name,
                                  day,
                                  schedule: daySchedule
                                })}
                              >
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-full"
                              onClick={() => setEditingSchedule({
                                staffId: staff.id,
                                staffName: staff.name,
                                day,
                                schedule: undefined
                              })}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="time-off">
            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 p-4 font-medium border-b">
                <div>Staff</div>
                <div>Date Range</div>
                <div>Reason</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {timeOffRequests.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No time off requests found.
                </div>
              ) : (
                timeOffRequests
                  .filter(request => currentLocation === "all" ||
                    filteredStaff.some(staff => staff.id === request.staffId))
                  .map(request => {
                    const staff = realStaff.find(s => s.id === request.staffId)

                    return (
                      <div key={request.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 p-4 border-b last:border-b-0">
                        <div>{staff?.name || "Unknown Staff"}</div>
                        <div>
                          {format(parseISO(request.startDate), "MMM d, yyyy")} - {format(parseISO(request.endDate), "MMM d, yyyy")}
                        </div>
                        <div>{request.reason}</div>
                        <div>
                          <Badge
                            variant={
                              request.status === "approved" ? "success" :
                              request.status === "rejected" ? "destructive" :
                              "outline"
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimeOffRequest({
                              staffId: request.staffId,
                              staffName: staff?.name || "Unknown Staff",
                              request
                            })}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )
                  })
              )}

              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setTimeOffRequest({
                    staffId: "",
                    staffName: "All Staff",
                    request: undefined
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Time Off Request
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Schedule Dialog */}
      {editingSchedule && (
        <EditScheduleDialog
          staffId={editingSchedule.staffId}
          staffName={editingSchedule.staffName}
          day={editingSchedule.day}
          schedule={editingSchedule.schedule}
          open={!!editingSchedule}
          onOpenChange={(open) => {
            if (!open) setEditingSchedule(null)
          }}
          onScheduleUpdated={handleScheduleUpdated}
        />
      )}

      {/* Time Off Request Dialog */}
      {timeOffRequest && (
        <TimeOffRequestDialog
          staffId={timeOffRequest.staffId}
          staffName={timeOffRequest.staffName}
          request={timeOffRequest.request}
          open={!!timeOffRequest}
          onOpenChange={(open) => {
            if (!open) setTimeOffRequest(null)
          }}
          onRequestUpdated={handleTimeOffUpdated}
          isAdmin={true}
        />
      )}
    </Card>
  )
}

