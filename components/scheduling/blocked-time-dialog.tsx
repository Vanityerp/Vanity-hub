"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { set, isBefore, addMinutes } from "date-fns"
import { formatAppDate, formatAppDateTime, formatAppTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useApiStaff } from "@/lib/api-staff-service"
import { getFirstName } from "@/lib/female-avatars"

interface BlockedTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  initialTime?: string
  initialStaffId?: string
  onBlockCreated?: (block: any) => void
}

export function BlockedTimeDialog({
  open,
  onOpenChange,
  initialDate = new Date(),
  initialTime,
  initialStaffId,
  onBlockCreated,
}: BlockedTimeDialogProps) {
  const { toast } = useToast()

  // Use REAL staff data from HR management system - NO mock data
  const { staff: realStaff, isLoading: isStaffLoading, fetchStaff } = useApiStaff()

  const [formData, setFormData] = useState({
    title: "",
    date: initialDate,
    startTime: initialTime || "10:00",
    duration: "60",
    staffId: initialStaffId || "",
    location: "loc1",
    notes: "",
    blockType: "break",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load staff data when component mounts
  useEffect(() => {
    if (open && realStaff.length === 0) {
      console.log("BlockedTimeDialog: Loading staff data...")
      fetchStaff()
    }
  }, [open, realStaff.length, fetchStaff])

  // Debug log to verify we're using REAL staff data from HR system
  useEffect(() => {
    console.log("BlockedTimeDialog - Using REAL staff from HR system");
    console.log("BlockedTimeDialog - Total Real Staff Count:", realStaff.length);
    console.log("BlockedTimeDialog - Real Staff Names:", realStaff.map(s => s.name));

    // Verify we have real staff data (should be exactly 7 real staff members)
    if (realStaff.length === 0) {
      console.warn("⚠️ BlockedTimeDialog - No staff data found! Check HR staff management system.");
    } else if (realStaff.length !== 7) {
      console.warn(`⚠️ BlockedTimeDialog - Expected 7 real staff members, found ${realStaff.length}. Check HR system.`);
    } else {
      console.log("✅ BlockedTimeDialog - Using correct number of real staff members (7)");
    }
  }, [realStaff])
  const [endTime, setEndTime] = useState("")

  // Reset form when dialog opens with new initial date
  useEffect(() => {
    if (open) {
      setFormData({
        ...formData,
        title: "",
        date: initialDate,
        startTime: initialTime || "10:00",
        staffId: initialStaffId || "",
        duration: "60",
        blockType: "break",
      })
    }
  }, [open, initialDate, initialTime, initialStaffId])

  // Calculate end time whenever start time or duration changes
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const [hours, minutes] = formData.startTime.split(":").map(Number)
      const startDateTime = set(new Date(), { hours, minutes })
      const endDateTime = addMinutes(startDateTime, parseInt(formData.duration))
      setEndTime(formatAppTime(endDateTime))
    }
  }, [formData.startTime, formData.duration])

  const handleSubmit = async () => {
    console.log("BlockedTimeDialog handleSubmit called", formData);

    // Validate form
    if (!formData.title || !formData.staffId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields.",
      })
      return
    }

    // Create block date by combining date and time
    const [hours, minutes] = formData.startTime.split(":").map(Number)
    const blockDate = set(formData.date, { hours, minutes })

    // Validate that block time is in the future
    const now = new Date()
    if (isBefore(blockDate, now)) {
      toast({
        variant: "destructive",
        title: "Invalid time",
        description: "Blocked time cannot be scheduled in the past. Please select a future time.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const selectedStaff = realStaff.find((s) => s.id === formData.staffId)

      if (!selectedStaff) {
        throw new Error("Staff not found")
      }

      // Create a new blocked time object
      const newBlockedTime = {
        id: `block-${Date.now()}`,
        title: formData.title,
        staffId: formData.staffId,
        staffName: selectedStaff.name,
        date: blockDate.toISOString(),
        duration: parseInt(formData.duration),
        location: formData.location,
        notes: formData.notes,
        blockType: formData.blockType,
        status: "blocked",
        type: "blocked",
        clientName: `${formData.blockType.charAt(0).toUpperCase() + formData.blockType.slice(1)}: ${formData.title}`
      }

      // Call the callback with the new blocked time
      if (onBlockCreated) {
        console.log("Calling onBlockCreated with:", newBlockedTime);
        onBlockCreated(newBlockedTime)
      } else {
        console.error("onBlockCreated callback is not defined");
      }

      toast({
        title: "Time blocked",
        description: `${formData.title} has been scheduled for ${formatAppDate(blockDate)} at ${formatAppTime(blockDate)}.`,
      })

      // Reset form and close dialog
      setFormData({
        title: "",
        date: initialDate,
        startTime: initialTime || "10:00",
        duration: "60",
        staffId: initialStaffId || "",
        location: "loc1",
        notes: "",
        blockType: "break",
      });
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create blocked time:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block the time. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Block Time</DialogTitle>
          <DialogDescription>Mark time as unavailable for appointments.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Break, Meeting, Training, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blockType">Type</Label>
              <Select
                value={formData.blockType}
                onValueChange={(value) => setFormData({ ...formData, blockType: value })}
              >
                <SelectTrigger id="blockType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select
                value={formData.staffId}
                onValueChange={(value) => setFormData({ ...formData, staffId: value })}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {realStaff
                    .filter((staff) => staff.status === "Active")
                    .map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {getFirstName(staff.name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? formatAppDate(formData.date) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
              >
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 * 4 }, (_, i) => {
                    const hour = Math.floor(i / 4) + 9; // Start from 9 AM
                    const minute = (i % 4) * 15;
                    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
                    const period = hour >= 12 ? "PM" : "AM";
                    const timeValue = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                    const timeLabel = `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
                    return { value: timeValue, label: timeLabel };
                  }).map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours (Full day)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                {endTime}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({ ...formData, location: value })}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loc1">Downtown Salon</SelectItem>
                <SelectItem value="loc2">Westside Salon</SelectItem>
                <SelectItem value="loc3">Northside Salon</SelectItem>
                <SelectItem value="loc4">Home Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this blocked time"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Block Time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
