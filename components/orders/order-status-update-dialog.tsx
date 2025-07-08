"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Package, Truck, CheckCircle, X, Clock } from "lucide-react"
import { Order, OrderStatus, TrackingInfo } from "@/lib/order-types"
import { cn } from "@/lib/utils"

interface OrderStatusUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusUpdate: (orderId: string, status: OrderStatus, tracking?: Partial<TrackingInfo>, notes?: string) => void
}

export function OrderStatusUpdateDialog({
  open,
  onOpenChange,
  order,
  onStatusUpdate
}: OrderStatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!order) return null

  const statusOptions = [
    { value: OrderStatus.PENDING, label: "Pending", icon: Clock, disabled: false },
    { value: OrderStatus.PROCESSING, label: "Processing", icon: Package, disabled: false },
    { value: OrderStatus.SHIPPED, label: "Shipped", icon: Truck, disabled: false },
    { value: OrderStatus.DELIVERED, label: "Delivered", icon: CheckCircle, disabled: false },
    { value: OrderStatus.CANCELLED, label: "Cancelled", icon: X, disabled: false },
  ]

  const carrierOptions = [
    "FedEx",
    "UPS", 
    "DHL",
    "USPS",
    "Canada Post",
    "Royal Mail",
    "Other"
  ]

  const handleSubmit = async () => {
    if (!selectedStatus || !order) return

    setIsSubmitting(true)

    try {
      const tracking: Partial<TrackingInfo> = {}

      if (selectedStatus === OrderStatus.SHIPPED) {
        if (trackingNumber) tracking.trackingNumber = trackingNumber
        if (carrier) tracking.carrier = carrier
        if (estimatedDelivery) tracking.estimatedDelivery = estimatedDelivery
      }

      onStatusUpdate(order.id, selectedStatus as OrderStatus, tracking, notes)
      
      // Reset form
      setSelectedStatus("")
      setTrackingNumber("")
      setCarrier("")
      setEstimatedDelivery(undefined)
      setNotes("")
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus("")
    setTrackingNumber("")
    setCarrier("")
    setEstimatedDelivery(undefined)
    setNotes("")
    onOpenChange(false)
  }

  const showTrackingFields = selectedStatus === OrderStatus.SHIPPED

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update the status for order {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Current Status</Label>
            <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Information (shown when status is "shipped") */}
          {showTrackingFields && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Information
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {carrierOptions.map((carrierOption) => (
                        <SelectItem key={carrierOption} value={carrierOption}>
                          {carrierOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estimated Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !estimatedDelivery && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {estimatedDelivery ? format(estimatedDelivery, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={estimatedDelivery}
                      onSelect={setEstimatedDelivery}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this status update..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedStatus || isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
