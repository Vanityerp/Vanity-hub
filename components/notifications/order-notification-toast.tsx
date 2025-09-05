"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Package, ShoppingBag, Eye, Calendar } from "lucide-react"
import { OrderNotification } from "@/lib/order-types"

interface OrderNotificationToastProps {
  notification: OrderNotification
  onViewOrder?: (orderId: string) => void
  onViewBooking?: (bookingId: string) => void
  onAcknowledge?: (notificationId: string) => void
}

export function OrderNotificationToast({
  notification,
  onViewOrder,
  onViewBooking,
  onAcknowledge
}: OrderNotificationToastProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (!notification.acknowledged) {
      const getIcon = () => {
        switch (notification.type) {
          case 'new_order':
            return <Package className="h-5 w-5" />
          case 'status_update':
            return <ShoppingBag className="h-5 w-5" />
          case 'payment_received':
            return <Package className="h-5 w-5" />
          default:
            return <Package className="h-5 w-5" />
        }
      }

      const getTitle = () => {
        switch (notification.type) {
          case 'new_order':
            return "New Order Received!"
          case 'status_update':
            return "Order Status Updated"
          case 'payment_received':
            return "Payment Received"
          default:
            return "Order Notification"
        }
      }

      const getDescription = () => {
        let description = notification.message
        if (notification.amount) {
          description += ` - ${notification.amount}`
        }
        return description
      }

      const handleViewOrder = () => {
        if (onViewOrder) {
          onViewOrder(notification.orderId)
        }
        if (onAcknowledge) {
          onAcknowledge(notification.id)
        }
      }

      const handleAcknowledge = () => {
        if (onAcknowledge) {
          onAcknowledge(notification.id)
        }
      }

      toast({
        title: getTitle(),
        description: (
          <div className="space-y-3">
            <p>{getDescription()}</p>
            {notification.amount && (
              <div className="font-semibold">
                <CurrencyDisplay amount={notification.amount} />
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleViewOrder}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View Order
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAcknowledge}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ),
        duration: 10000, // 10 seconds
      })
    }
  }, [notification, onViewOrder, onAcknowledge, toast])

  return null // This component only triggers toasts
}

// Hook for managing order notifications
export function useOrderNotifications() {
  const { toast } = useToast()

  const showNewOrderNotification = (
    clientName: string,
    orderId: string,
    amount: number,
    itemCount: number,
    onViewOrder?: (orderId: string) => void
  ) => {
    toast({
      title: "🎉 New Order Received!",
      description: (
        <div className="space-y-3">
          <p>
            <strong>{clientName}</strong> placed a new order
          </p>
          <p className="text-sm text-muted-foreground">
            {itemCount} item{itemCount > 1 ? 's' : ''} • Order #{orderId}
          </p>
          <div className="font-semibold text-lg">
            <CurrencyDisplay amount={amount} />
          </div>
          {onViewOrder && (
            <Button 
              size="sm" 
              onClick={() => onViewOrder(orderId)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View Order
            </Button>
          )}
        </div>
      ),
      duration: 15000, // 15 seconds for new orders
    })
  }

  const showNewBookingNotification = (
    clientName: string,
    serviceName: string,
    bookingDate: string,
    amount: number,
    onViewBooking?: (bookingId: string) => void
  ) => {
    toast({
      title: "📅 New Booking Received!",
      description: (
        <div className="space-y-3">
          <p>
            <strong>{clientName}</strong> booked an appointment
          </p>
          <p className="text-sm text-muted-foreground">
            {serviceName} • {bookingDate}
          </p>
          <div className="font-semibold">
            <CurrencyDisplay amount={amount} />
          </div>
          {onViewBooking && (
            <Button 
              size="sm" 
              onClick={() => onViewBooking('booking-id')}
              className="flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              View Booking
            </Button>
          )}
        </div>
      ),
      duration: 15000, // 15 seconds for new bookings
    })
  }

  const showOrderStatusUpdateNotification = (
    orderId: string,
    newStatus: string,
    onViewOrder?: (orderId: string) => void
  ) => {
    toast({
      title: "📦 Order Status Updated",
      description: (
        <div className="space-y-3">
          <p>Order #{orderId}</p>
          <p className="text-sm">
            Status updated to: <strong className="capitalize">{newStatus}</strong>
          </p>
          {onViewOrder && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onViewOrder(orderId)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View Order
            </Button>
          )}
        </div>
      ),
      duration: 8000, // 8 seconds for status updates
    })
  }

  return {
    showNewOrderNotification,
    showNewBookingNotification,
    showOrderStatusUpdateNotification
  }
}
