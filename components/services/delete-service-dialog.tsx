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
import { useServices } from "@/lib/service-provider"
import { AlertTriangle } from "lucide-react"

interface DeleteServiceDialogProps {
  service: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteServiceDialog({ service, open, onOpenChange }: DeleteServiceDialogProps) {
  const { toast } = useToast()
  const { deleteService } = useServices()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    console.log("Attempting to delete service:", service.id, service.name)

    try {
      // Delete the service using the service provider
      await deleteService(service.id)
      console.log("Service deleted successfully")

      toast({
        title: "Service deleted",
        description: `${service.name} has been deleted successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete service:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service. Please try again.",
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
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Service
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the service "{service.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

