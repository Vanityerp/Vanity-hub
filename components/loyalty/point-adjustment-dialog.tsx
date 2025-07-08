"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PointHistoryItem } from "@/lib/types/loyalty"
import { Plus, Minus, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PointAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  currentPoints: number
  onAdjustment: (adjustment: PointHistoryItem) => void
}

export function PointAdjustmentDialog({ 
  open, 
  onOpenChange, 
  clientId,
  clientName,
  currentPoints,
  onAdjustment 
}: PointAdjustmentDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    type: "add" as "add" | "subtract",
    points: "",
    reason: "",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.points || !formData.reason.trim() || !formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    const pointsValue = parseInt(formData.points)
    if (pointsValue <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Points",
        description: "Points must be a positive number.",
      })
      return
    }

    // Check if subtraction would result in negative points
    if (formData.type === "subtract" && pointsValue > currentPoints) {
      toast({
        variant: "destructive",
        title: "Insufficient Points",
        description: `Cannot subtract ${pointsValue} points. Client only has ${currentPoints} points.`,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const adjustmentPoints = formData.type === "add" ? pointsValue : -pointsValue
      
      const adjustment: PointHistoryItem = {
        id: `adj${Date.now()}`,
        date: new Date().toISOString(),
        description: formData.description.trim(),
        points: adjustmentPoints,
        type: "adjustment",
        reason: formData.reason.trim(),
        relatedId: clientId
      }

      onAdjustment(adjustment)

      toast({
        title: "Points adjusted",
        description: `${formData.type === "add" ? "Added" : "Subtracted"} ${pointsValue} points ${formData.type === "add" ? "to" : "from"} ${clientName}'s account.`,
      })

      // Reset form
      setFormData({
        type: "add",
        points: "",
        reason: "",
        description: ""
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error adjusting points:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to adjust points. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const pointsValue = parseInt(formData.points) || 0
  const newBalance = formData.type === "add" 
    ? currentPoints + pointsValue 
    : currentPoints - pointsValue

  const reasonOptions = [
    { value: "customer_service", label: "Customer Service Adjustment" },
    { value: "promotion", label: "Promotional Bonus" },
    { value: "error_correction", label: "Error Correction" },
    { value: "goodwill", label: "Goodwill Gesture" },
    { value: "system_migration", label: "System Migration" },
    { value: "expired_points", label: "Expired Points Removal" },
    { value: "fraud_prevention", label: "Fraud Prevention" },
    { value: "other", label: "Other" }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust Points</DialogTitle>
            <DialogDescription>
              Manually adjust points for {clientName}. Current balance: {currentPoints} points.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4 text-green-600" />
                      Add Points
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center">
                      <Minus className="mr-2 h-4 w-4 text-red-600" />
                      Subtract Points
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Points Amount */}
            <div className="space-y-2">
              <Label htmlFor="points">Points Amount *</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => handleInputChange("points", e.target.value)}
                placeholder="100"
                min="1"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={formData.reason} onValueChange={(value) => handleInputChange("reason", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Detailed explanation for this adjustment..."
                rows={3}
                required
              />
            </div>

            {/* Preview */}
            {formData.points && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>Current Balance:</span>
                    <span className="font-medium">{currentPoints} points</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Adjustment:</span>
                    <span className={`font-medium ${formData.type === "add" ? "text-green-600" : "text-red-600"}`}>
                      {formData.type === "add" ? "+" : "-"}{pointsValue} points
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>New Balance:</span>
                      <span className={newBalance < 0 ? "text-red-600" : "text-green-600"}>
                        {newBalance} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for negative balance */}
            {formData.type === "subtract" && pointsValue > currentPoints && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This adjustment would result in a negative balance. Please reduce the amount or add points instead.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (formData.type === "subtract" && pointsValue > currentPoints)}
              className={formData.type === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isSubmitting ? "Processing..." : `${formData.type === "add" ? "Add" : "Subtract"} Points`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
