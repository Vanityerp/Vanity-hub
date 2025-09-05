"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useOrders } from "@/lib/order-provider"
import { Order, OrderStatus } from "@/lib/order-types"
import { getCurrentClientId } from "@/lib/client-auth-utils"
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"

interface OrderTrackingPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  // Unwrap the params Promise using React.use()
  const { orderId } = use(params)

  const router = useRouter()
  const { toast } = useToast()
  const { orders, getOrder, refreshOrders } = useOrders()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load order details
  useEffect(() => {
    const foundOrder = getOrder(orderId)

    if (foundOrder) {
      // Verify this order belongs to the current client
      const clientId = getCurrentClientId()

      if (foundOrder.clientId === clientId ||
          foundOrder.clientName?.toLowerCase().includes(clientId.toLowerCase())) {
        setOrder(foundOrder)
      } else {
        toast({
          title: "Order not found",
          description: "This order doesn't belong to your account",
          variant: "destructive",
        })
        router.push("/client-portal/orders")
        return
      }
    } else {
      toast({
        title: "Order not found",
        description: "The requested order could not be found",
        variant: "destructive",
      })
      router.push("/client-portal/orders")
      return
    }

    setLoading(false)
  }, [orderId, orders, getOrder, router, toast])

  // Get status timeline
  const getStatusTimeline = (order: Order) => {
    const timeline = [
      {
        status: OrderStatus.PENDING,
        label: "Order Placed",
        date: order.createdAt,
        completed: true,
        icon: <Package className="h-4 w-4" />
      },
      {
        status: OrderStatus.PROCESSING,
        label: "Processing",
        date: order.processedAt,
        completed: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status),
        icon: <Clock className="h-4 w-4" />
      },
      {
        status: OrderStatus.SHIPPED,
        label: "Shipped",
        date: order.shippedAt,
        completed: [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status),
        icon: <Truck className="h-4 w-4" />
      },
      {
        status: OrderStatus.DELIVERED,
        label: "Delivered",
        date: order.deliveredAt,
        completed: order.status === OrderStatus.DELIVERED,
        icon: <CheckCircle className="h-4 w-4" />
      }
    ]

    // Handle cancelled orders
    if (order.status === OrderStatus.CANCELLED) {
      return [
        timeline[0], // Order placed
        {
          status: OrderStatus.CANCELLED,
          label: "Cancelled",
          date: order.cancelledAt,
          completed: true,
          icon: <XCircle className="h-4 w-4" />,
          isError: true
        }
      ]
    }

    return timeline
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: OrderStatus) => {
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

  // Copy order ID to clipboard
  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    toast({
      title: "Copied!",
      description: "Order ID copied to clipboard",
    })
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      refreshOrders()
      // Reload the order after refresh
      setTimeout(() => {
        const updatedOrder = getOrder(orderId)
        if (updatedOrder) {
          setOrder(updatedOrder)
        }
        setRefreshing(false)
      }, 500)

      toast({
        title: "Order refreshed",
        description: "Order details have been updated",
      })
    } catch (error) {
      setRefreshing(false)
      toast({
        title: "Error",
        description: "Failed to refresh order",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The requested order could not be found.</p>
          <Button asChild>
            <Link href="/client-portal/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const timeline = getStatusTimeline(order)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/client-portal/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{order.id}</h1>
              <Button variant="ghost" size="sm" onClick={copyOrderId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-600 mt-1">
              Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={getStatusBadgeVariant(order.status)}
            className="text-sm px-3 py-1"
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((step, index) => (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2
                      ${step.completed
                        ? step.isError
                          ? 'bg-red-100 border-red-500 text-red-600'
                          : 'bg-green-100 border-green-500 text-green-600'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                    `}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </h3>
                        {step.date && (
                          <span className="text-sm text-gray-500">
                            {format(new Date(step.date), "MMM dd, h:mm a")}
                          </span>
                        )}
                      </div>
                      {step.status === order.status && order.tracking?.estimatedDelivery && (
                        <p className="text-sm text-gray-600 mt-1">
                          Estimated delivery: {format(new Date(order.tracking.estimatedDelivery), "MMM dd, yyyy")}
                        </p>
                      )}
                      {step.status === OrderStatus.CANCELLED && order.cancellationReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {order.cancellationReason}
                        </p>
                      )}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className={`
                        w-px h-8 ml-4
                        ${step.completed ? 'bg-green-200' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × <CurrencyDisplay amount={item.unitPrice} />
                        </p>
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          <CurrencyDisplay amount={item.totalPrice} />
                        </p>
                      </div>
                    </div>
                    {index < order.items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <CurrencyDisplay amount={order.subtotal} />
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <CurrencyDisplay amount={order.shipping} />
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <CurrencyDisplay amount={order.tax} />
              </div>
              {order.appliedPromo && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.appliedPromo.code})</span>
                  <span>
                    -{order.appliedPromo.type === 'percentage'
                      ? `${order.appliedPromo.discount}%`
                      : <CurrencyDisplay amount={order.appliedPromo.discount} />
                    }
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <CurrencyDisplay amount={order.total} />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div className="text-sm">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{order.shippingAddress.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{order.shippingAddress.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Information */}
          {order.tracking && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.tracking.trackingNumber && (
                  <div>
                    <p className="text-sm font-medium">Tracking Number</p>
                    <p className="text-sm text-gray-600">{order.tracking.trackingNumber}</p>
                  </div>
                )}
                {order.tracking.carrier && (
                  <div>
                    <p className="text-sm font-medium">Carrier</p>
                    <p className="text-sm text-gray-600">{order.tracking.carrier}</p>
                  </div>
                )}
                {order.tracking.estimatedDelivery && (
                  <div>
                    <p className="text-sm font-medium">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.tracking.estimatedDelivery), "MMMM dd, yyyy")}
                    </p>
                  </div>
                )}
                {order.tracking.trackingUrl && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Track with Carrier
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
