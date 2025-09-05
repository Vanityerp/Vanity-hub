"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { format } from "date-fns"
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  X,
  Edit,
  Printer,
  Download,
  ExternalLink
} from "lucide-react"

import { Order, OrderStatus } from "@/lib/order-types"
import { useToast } from "@/components/ui/use-toast"
import { OrderStatusUpdateDialog } from "./order-status-update-dialog"
import { DialogProps } from "@radix-ui/react-dialog"
import { printOrderReceipt, exportOrderToPdf } from '@/lib/print-utils'

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void

  onStatusUpdate?: (orderId: string, status: OrderStatus, tracking?: any, notes?: string) => void
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onStatusUpdate,

}: OrderDetailsDialogProps) {
  const { toast } = useToast()

  const [currentOrder, setCurrentOrder] = useState<Order | null>(order)

  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false)

  // Update current order when order prop changes
  React.useEffect(() => {
    setCurrentOrder(order)
  }, [order])

  const handleStatusUpdate = (status: OrderStatus, tracking?: any, notes?: string) => {
    if (onStatusUpdate && currentOrder) {
      console.log('🔄 OrderDetailsDialog: Updating status to:', status)

      onStatusUpdate(currentOrder.id, status, tracking, notes)

      // Update local state immediately for instant UI feedback
      const now = new Date()
      const updatedOrder = {
        ...currentOrder,
        status,
        updatedAt: now,
        notes: notes || currentOrder.notes,
        tracking: tracking ? { ...currentOrder.tracking, ...tracking } : currentOrder.tracking
      }

      // Set status-specific timestamps
      switch (status) {
        case OrderStatus.PROCESSING:
          updatedOrder.processedAt = now
          break
        case OrderStatus.SHIPPED:
          updatedOrder.shippedAt = now
          if (tracking?.estimatedDelivery) {
            updatedOrder.tracking = {
              ...updatedOrder.tracking,
              estimatedDelivery: tracking.estimatedDelivery,
              shippedDate: now
            }
          }
          break
        case OrderStatus.DELIVERED:
          updatedOrder.deliveredAt = now
          if (updatedOrder.tracking) {
            updatedOrder.tracking.deliveredDate = now
          }
          break
        case OrderStatus.CANCELLED:
          updatedOrder.cancelledAt = now
          updatedOrder.cancellationReason = notes
          break
      }

      setCurrentOrder(updatedOrder)

      toast({
        title: "Order Updated",
        description: `Order status updated to ${status}`,
      })
    }
    setIsStatusUpdateOpen(false)
  }

  if (!currentOrder) return null

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case OrderStatus.PROCESSING:
        return <Package className="h-4 w-4" />
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4" />
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />
      case OrderStatus.CANCELLED:
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return "secondary"
      case OrderStatus.PROCESSING:
        return "default"
      case OrderStatus.SHIPPED:
        return "outline"
      case OrderStatus.DELIVERED:
        return "default"
      case OrderStatus.CANCELLED:
        return "destructive"
      default:
        return "secondary"
    }
  }





  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>

        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
            Complete information for order {currentOrder.id}
          </DialogDescription>
          <div className="flex flex-wrap gap-2">

            <Button variant="outline" size="sm" className="flex-1" onClick={() => currentOrder && printOrderReceipt(currentOrder)}>
              <Printer className="h-4 w-4 mr-2" />
              Print Order
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => currentOrder && exportOrderToPdf(currentOrder)}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="default" size="sm" className="flex-1" onClick={() => setIsStatusUpdateOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Update Status
            </Button>
            {currentOrder.tracking?.trackingUrl && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(currentOrder.tracking?.trackingUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            )}
          </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{currentOrder.id}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(currentOrder.createdAt), 'PPP p')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={currentOrder.total} />
                </div>
                <Badge variant={getStatusVariant(currentOrder.status)} className="flex items-center gap-1">
                  {getStatusIcon(currentOrder.status)}
                  {currentOrder.status}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{currentOrder.clientName || 'Unknown Customer'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{currentOrder.shippingAddress.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{currentOrder.shippingAddress.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <p className="font-medium capitalize">{currentOrder.paymentMethod}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </h4>
              <div className="text-sm">
                <p className="font-medium">
                  {currentOrder.shippingAddress.firstName} {currentOrder.shippingAddress.lastName}
                </p>
                <p>{currentOrder.shippingAddress.address}</p>
                <p>
                  {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}
                </p>
                <p>{currentOrder.shippingAddress.country}</p>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="font-semibold">Order Items</h4>
              <div className="space-y-2">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × <CurrencyDisplay amount={item.unitPrice} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        <CurrencyDisplay amount={item.totalPrice} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <h4 className="font-semibold">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <CurrencyDisplay amount={currentOrder.subtotal} />
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <CurrencyDisplay amount={currentOrder.tax} />
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <CurrencyDisplay amount={currentOrder.shipping} />
                </div>
                {currentOrder.appliedPromo && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({currentOrder.appliedPromo.code}):</span>
                    <span>-<CurrencyDisplay amount={currentOrder.appliedPromo.discount} /></span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <CurrencyDisplay amount={currentOrder.total} />
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {currentOrder.tracking && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tracking Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {currentOrder.tracking.trackingNumber && (
                      <div>
                        <span className="text-muted-foreground">Tracking Number:</span>
                        <p className="font-medium">{currentOrder.tracking.trackingNumber}</p>
                      </div>
                    )}
                    {currentOrder.tracking.carrier && (
                      <div>
                        <span className="text-muted-foreground">Carrier:</span>
                        <p className="font-medium">{currentOrder.tracking.carrier}</p>
                      </div>
                    )}
                    {currentOrder.tracking.estimatedDelivery && (
                      <div>
                        <span className="text-muted-foreground">Estimated Delivery:</span>
                        <p className="font-medium">
                          {format(new Date(currentOrder.tracking.estimatedDelivery), 'PPP')}
                        </p>
                      </div>
                    )}
                    {currentOrder.tracking.shippedDate && (
                      <div>
                        <span className="text-muted-foreground">Shipped Date:</span>
                        <p className="font-medium">
                          {format(new Date(currentOrder.tracking.shippedDate), 'PPP')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                  {/* Order Status Update Dialog */}
        {currentOrder && (
          <OrderStatusUpdateDialog
            order={currentOrder}
            open={isStatusUpdateOpen}
            onOpenChange={setIsStatusUpdateOpen}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </>
            )}

            {/* Notes */}
            {currentOrder.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">Notes</h4>
                  <p className="text-sm text-muted-foreground">{currentOrder.notes}</p>
                </div>
              </>
            )}

            <Separator />


          </div>
        </DialogContent>
      </Dialog>


    </>
  )
}
