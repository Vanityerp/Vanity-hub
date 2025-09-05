"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useUnifiedStaff } from "@/lib/unified-staff-provider"
import { AlertTriangle } from "lucide-react"

interface DeleteStaffDialogProps {
  staff: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffDeleted?: (staffId: string) => void
}

export function DeleteStaffDialog({ staff, open, onOpenChange, onStaffDeleted }: DeleteStaffDialogProps) {
  const { toast } = useToast()
  const { deleteStaffMember } = useUnifiedStaff()
  const [isDeleting, setIsDeleting] = useState(false)

  // Don't render if no staff data
  if (!staff || !staff.id || staff.id === "") {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Use unified provider to delete staff member (this also deletes corresponding user)
      const success = deleteStaffMember(staff.id)

      if (!success) {
        throw new Error("Failed to delete staff member")
      }

      console.log(`Successfully deleted staff with ID: ${staff.id}`)

      toast({
        title: "Staff deleted",
        description: `${staff.name} has been removed from your staff directory.`,
      })

      if (onStaffDeleted) {
        onStaffDeleted(staff.id)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete staff:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete staff member. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Staff Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {staff.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Deleting this staff member will remove them from your staff directory and all associated data.
            Any appointments assigned to this staff member will need to be reassigned.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Staff Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
