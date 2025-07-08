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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { StaffSchedule } from "@/lib/schedule-storage"
import { useSchedule } from "@/lib/schedule-provider"
import { useLocations } from "@/lib/location-provider"
import { format, parse, isValid } from "date-fns"

interface EditScheduleDialogProps {
  staffId: string
  staffName: string
  day: string
  schedule?: StaffSchedule
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleUpdated?: () => void
}

export function EditScheduleDialog({
  staffId,
  staffName,
  day,
  schedule,
  open,
  onOpenChange,
  onScheduleUpdated
}: EditScheduleDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { locations, getLocationName, isHomeServiceEnabled } = useLocations()
  const { addSchedule, updateSchedule, schedules } = useSchedule()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    startTime: schedule?.startTime || "09:00",
    endTime: schedule?.endTime || "17:00",
    location: schedule?.location || "loc1",
    isRecurring: schedule?.isRecurring !== false,
    isDayOff: schedule?.isDayOff || false,
    effectiveDate: schedule?.effectiveDate || format(new Date(), "yyyy-MM-dd"),
    expiryDate: schedule?.expiryDate || ""
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        startTime: schedule?.startTime || "09:00",
        endTime: schedule?.endTime || "17:00",
        location: schedule?.location || "loc1",
        isRecurring: schedule?.isRecurring !== false,
        isDayOff: schedule?.isDayOff || false,
        effectiveDate: schedule?.effectiveDate || new Date().toISOString().split('T')[0],
        expiryDate: schedule?.expiryDate || ""
      })
    }
  }, [open, schedule])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Validate time format (HH:MM)
  const isValidTimeFormat = (time: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  // Validate that end time is after start time
  const isEndTimeAfterStartTime = (startTime: string, endTime: string) => {
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return false
    }

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    if (endHour > startHour) {
      return true
    } else if (endHour === startHour) {
      return endMinute > startMinute
    }

    return false
  }

  // Check for schedule conflicts
  const hasScheduleConflict = () => {
    const staffSchedules = schedules.filter(s =>
      s.staffId === staffId &&
      s.day === day &&
      (schedule ? s.id !== schedule.id : true)
    )

    if (staffSchedules.length === 0) return false

    const newStartTime = formData.startTime
    const newEndTime = formData.endTime

    return staffSchedules.some(s => {
      // Check if the new schedule overlaps with existing schedule
      return !(
        newEndTime <= s.startTime ||
        newStartTime >= s.endTime
      )
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Skip time validation if this is a day off
      if (!formData.isDayOff) {
        // Validate times
        if (!isValidTimeFormat(formData.startTime) || !isValidTimeFormat(formData.endTime)) {
          toast({
            variant: "destructive",
            title: "Invalid time format",
            description: "Please use the format HH:MM (e.g., 09:00).",
          })
          setIsSubmitting(false)
          return
        }

        // Validate end time is after start time
        if (!isEndTimeAfterStartTime(formData.startTime, formData.endTime)) {
          toast({
            variant: "destructive",
            title: "Invalid time range",
            description: "End time must be after start time.",
          })
          setIsSubmitting(false)
          return
        }

        // Check for schedule conflicts
        if (hasScheduleConflict()) {
          toast({
            variant: "destructive",
            title: "Schedule conflict",
            description: "This staff member already has a schedule for this day that overlaps with the selected times.",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Create or update schedule
      if (schedule) {
        // Update existing schedule
        const updatedSchedule: StaffSchedule = {
          ...schedule,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          isRecurring: formData.isRecurring,
          isDayOff: formData.isDayOff,
          effectiveDate: formData.effectiveDate,
          expiryDate: formData.expiryDate || undefined
        }

        // Use the context to update the schedule
        updateSchedule(updatedSchedule)

        toast({
          title: "Schedule updated",
          description: `${staffName}'s schedule for ${day} has been updated.`,
        })
      } else {
        // Create new schedule
        const newSchedule: Omit<StaffSchedule, "id"> = {
          staffId,
          day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          isRecurring: formData.isRecurring,
          isDayOff: formData.isDayOff,
          effectiveDate: formData.effectiveDate,
          expiryDate: formData.expiryDate || undefined
        }

        // Use the context to add the schedule
        addSchedule(newSchedule)

        toast({
          title: "Schedule created",
          description: `${staffName}'s schedule for ${day} has been created.`,
        })
      }

      // Notify parent component
      if (onScheduleUpdated) {
        onScheduleUpdated()
      }

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save schedule:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save schedule. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{schedule ? "Edit" : "Add"} Schedule</DialogTitle>
            <DialogDescription>
              {schedule
                ? `Update ${staffName}'s schedule for ${day}.`
                : `Add a new schedule for ${staffName} on ${day}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  placeholder="09:00"
                  required
                  disabled={formData.isDayOff}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  placeholder="17:00"
                  required
                  disabled={formData.isDayOff}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleChange("location", value)}
                disabled={formData.isDayOff}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter(location => user?.role === "ADMIN" || location.id !== "home") // Hide home service for staff users
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleChange("isRecurring", checked)}
              />
              <Label htmlFor="isRecurring">Recurring schedule</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDayOff"
                checked={formData.isDayOff}
                onCheckedChange={(checked) => handleChange("isDayOff", checked)}
              />
              <Label htmlFor="isDayOff">Day Off (staff unavailable all day)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => handleChange("effectiveDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : schedule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
