"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, User, Phone, Mail } from "lucide-react"

interface DuplicateClient {
  id: string
  name: string
  phone?: string
  email?: string
}

interface DuplicateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateType: 'phone' | 'name'
  existingClient: DuplicateClient
  onConfirmCreate: () => void
  onUpdateExisting: () => void
}

export function DuplicateClientDialog({
  open,
  onOpenChange,
  duplicateType,
  existingClient,
  onConfirmCreate,
  onUpdateExisting
}: DuplicateClientDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirmCreate = async () => {
    setIsLoading(true)
    try {
      await onConfirmCreate()
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const handleUpdateExisting = async () => {
    setIsLoading(true)
    try {
      await onUpdateExisting()
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Duplicate Client Found</DialogTitle>
          </div>
          <DialogDescription>
            A client with the same {duplicateType === 'phone' ? 'phone number' : 'name'} already exists in your database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              <span className="font-medium">Existing Client</span>
              <Badge variant="outline" className="ml-auto">
                {duplicateType === 'phone' ? 'Phone Match' : 'Name Match'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{existingClient.name}</span>
              </div>
              
              {existingClient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{existingClient.phone}</span>
                </div>
              )}
              
              {existingClient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{existingClient.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>What would you like to do?</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleUpdateExisting}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Update Existing Client
          </Button>
          
          <Button
            onClick={handleConfirmCreate}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Create Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
