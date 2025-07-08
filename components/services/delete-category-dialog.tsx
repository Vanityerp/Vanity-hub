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
import { AlertTriangle } from "lucide-react"

interface DeleteCategoryDialogProps {
  category: {
    id: string
    name: string
    serviceCount: number
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: DeleteCategoryDialogProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (category.serviceCount > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete category",
        description: "This category contains services. Please remove or reassign the services first.",
      })
      return
    }

    setIsDeleting(true)

    try {
      // In a real app, this would delete the category via API
      console.log(`Deleting category with ID: ${category.id}`)

      toast({
        title: "Category deleted",
        description: `${category.name} has been deleted successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category. Please try again.",
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
            Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {category.serviceCount > 0 && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            This category contains {category.serviceCount} services. You must remove or reassign these services before
            deleting the category.
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || category.serviceCount > 0}
          >
            {isDeleting ? "Deleting..." : "Delete Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

