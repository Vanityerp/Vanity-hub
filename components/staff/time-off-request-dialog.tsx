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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { TimeOffRequest } from "@/lib/schedule-storage"
import { useSchedule } from "@/lib/schedule-provider"
import { format, parse, isValid, isBefore, addDays } from "date-fns"

interface TimeOffRequestDialogProps {
  staffId: string
  staffName: string
  request?: TimeOffRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestUpdated?: () => void
  isAdmin?: boolean
}

export function TimeOffRequestDialog({
  staffId,
  staffName,
  request,
  open,
  onOpenChange,
  onRequestUpdated,
  isAdmin = false
}: TimeOffRequestDialogProps) {
  const { toast } = useToast()
  const { addTimeOffRequest, updateTimeOffRequest } = useSchedule()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    startDate: request?.startDate || format(new Date(), "yyyy-MM-dd"),
    endDate: request?.endDate || format(addDays(new Date(), 1), "yyyy-MM-dd"),
    reason: request?.reason || "",
    status: request?.status || "pending",
    notes: request?.notes || ""
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        startDate: request?.startDate || format(new Date(), "yyyy-MM-dd"),
        endDate: request?.endDate || format(addDays(new Date(), 1), "yyyy-MM-dd"),
        reason: request?.reason || "",
        status: request?.status || "pending",
        notes: request?.notes || ""
      })
    }
  }, [open, request])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate dates
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)

      if (!isValid(startDate) || !isValid(endDate)) {
        toast({
          variant: "destructive",
          title: "Invalid dates",
          description: "Please enter valid dates.",
        })
        setIsSubmitting(false)
        return
      }

      if (isBefore(endDate, startDate)) {
        toast({
          variant: "destructive",
          title: "Invalid date range",
          description: "End date must be after start date.",
        })
        setIsSubmitting(false)
        return
      }

      if (request) {
        // Update existing request
        const updatedRequest: TimeOffRequest = {
          ...request,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          status: formData.status as "pending" | "approved" | "rejected",
          notes: formData.notes,
          updatedBy: isAdmin ? "admin" : "staff"
        }

        updateTimeOffRequest(updatedRequest)

        toast({
          title: "Request updated",
          description: `Time off request for ${staffName} has been updated.`,
        })
      } else {
        // Create new request
        const newRequest: Omit<TimeOffRequest, "id" | "createdAt" | "updatedAt"> = {
          staffId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          status: "pending",
          notes: formData.notes
        }

        addTimeOffRequest(newRequest)

        toast({
          title: "Request submitted",
          description: `Time off request for ${staffName} has been submitted.`,
        })
      }

      // Notify parent component
      if (onRequestUpdated) {
        onRequestUpdated()
      }

      // Close dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save time off request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save time off request. Please try again.",
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
            <DialogTitle>{request ? "Edit" : "Request"} Time Off</DialogTitle>
            <DialogDescription>
              {request
                ? `Update time off request for ${staffName}.`
                : `Submit a new time off request for ${staffName}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Please provide a reason for your time off request"
                required
              />
            </div>

            {isAdmin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Optional notes about this request"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : request ? "Update" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
