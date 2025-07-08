"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onStockAdjusted?: () => void
}

export function StockAdjustmentDialog({ open, onOpenChange, product, onStockAdjusted }: StockAdjustmentDialogProps) {
  const { currentLocation } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableLocations, setAvailableLocations] = useState<any[]>([])

  const [formData, setFormData] = useState({
    adjustmentType: "add",
    quantity: "1",
    reason: "purchase",
    notes: "",
  })

  // Load available locations when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableLocations()
    }
  }, [open])

  useEffect(() => {
    if (open && product) {
      // Reset form when dialog opens
      setFormData({
        adjustmentType: "add",
        quantity: "1",
        reason: "purchase",
        notes: "",
      })
    }
  }, [open, product])

  const loadAvailableLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setAvailableLocations(data.locations || [])
        console.log("📍 Available locations:", data.locations)
      }
    } catch (error) {
      console.error("❌ Failed to load locations:", error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsSubmitting(true)

    try {
      // Determine the location ID to use
      let locationId = currentLocation
      if (currentLocation === "all") {
        // Use the first available location when "all" is selected
        if (availableLocations.length > 0) {
          locationId = availableLocations[0].id
          console.log("🔍 Using first available location:", locationId, availableLocations[0].name)
        } else {
          throw new Error("No locations available for stock adjustment")
        }
      }

      // Validate inputs
      const quantity = Number.parseInt(formData.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Please enter a valid quantity")
      }

      // Call the actual API to adjust stock
      const adjustmentData = {
        productId: product.id,
        locationId: locationId,
        adjustmentType: formData.adjustmentType,
        quantity: quantity,
        reason: formData.reason,
        notes: formData.notes,
      }

      console.log("🔄 Adjusting stock with data:", adjustmentData)
      console.log("🔍 Product object:", product)
      console.log("🔍 Current location:", currentLocation)
      console.log("🔍 Resolved location ID:", locationId)

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentData),
      })

      console.log("📡 Response status:", response.status)
      console.log("📡 Response ok:", response.ok)

      if (!response.ok) {
        const responseText = await response.text()
        console.error("❌ Raw response text:", responseText)

        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError)
          errorData = { error: "Invalid response format", rawResponse: responseText }
        }

        console.error("❌ API Error:", errorData)
        throw new Error(errorData.error || errorData.details || "Failed to adjust stock")
      }

      const result = await response.json()
      console.log("✅ Stock adjustment successful:", result)

      toast({
        title: "Stock adjusted successfully",
        description: `${product.name} stock has been ${formData.adjustmentType === "add" ? "increased" : "decreased"} by ${formData.quantity} units.`,
      })

      // Call the callback to refresh inventory data
      if (onStockAdjusted) {
        console.log("🔄 Calling onStockAdjusted callback to refresh data...")
        await onStockAdjusted()
        console.log("✅ Data refresh callback completed")
      }

      onOpenChange(false)
    } catch (error) {
      console.error("❌ Failed to adjust stock:", error)
      toast({
        variant: "destructive",
        title: "Error adjusting stock",
        description: error instanceof Error ? error.message : "Failed to adjust stock. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust Stock: {product.name}</DialogTitle>
            <DialogDescription>Current stock: {product.stock} units</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select
                  value={formData.adjustmentType}
                  onValueChange={(value) => handleChange("adjustmentType", value)}
                >
                  <SelectTrigger id="adjustmentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={formData.reason} onValueChange={(value) => handleChange("reason", value)}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {formData.adjustmentType === "add" ? (
                    <>
                      <SelectItem value="purchase">New Purchase</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="transfer">Transfer In</SelectItem>
                      <SelectItem value="correction">Inventory Correction</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="damage">Damaged/Expired</SelectItem>
                      <SelectItem value="transfer">Transfer Out</SelectItem>
                      <SelectItem value="correction">Inventory Correction</SelectItem>
                      <SelectItem value="professional">Professional Use</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

