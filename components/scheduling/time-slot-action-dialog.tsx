"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"
import { format } from "date-fns"

interface TimeSlotActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeSlot: {
    hour: number
    minute: number
    label: string
    day?: Date
  }
  onAction: (action: "appointment" | "group" | "blocked") => void
}

export function TimeSlotActionDialog({ open, onOpenChange, timeSlot, onAction }: TimeSlotActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {timeSlot.day
              ? `Add Appointment - ${format(timeSlot.day, "MMMM d, yyyy")} at ${timeSlot.label}`
              : `Add to ${timeSlot.label}`
            }
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-6 px-4">
          <Button
            variant="outline"
            className="flex justify-start items-center h-auto py-4 px-4"
            onClick={() => onAction("appointment")}
          >
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Add Appointment</h3>
              <p className="text-sm text-muted-foreground">Schedule a new client appointment</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center h-auto py-4 px-4"
            onClick={() => onAction("group")}
          >
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Add Group Appointment</h3>
              <p className="text-sm text-muted-foreground">Schedule multiple clients for the same service</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center h-auto py-4 px-4"
            onClick={() => onAction("blocked")}
          >
            <div className="bg-gray-100 p-2 rounded-full mr-3">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Add Blocked Time</h3>
              <p className="text-sm text-muted-foreground">Mark time as unavailable (break, meeting, etc.)</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

