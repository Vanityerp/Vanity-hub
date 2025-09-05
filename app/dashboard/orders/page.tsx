"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useToast } from "@/hooks/use-toast"
import { useOrders } from "@/lib/order-provider"
import { Order, OrderStatus } from "@/lib/order-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { OrderDetailsDialog } from "@/components/orders/order-details-dialog"
import { OrderStatusUpdateDialog } from "@/components/orders/order-status-update-dialog"

import { printOrderReceipt, exportOrderToPdf } from "@/lib/print-utils"
import {
  Package,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  ShoppingBag
} from "lucide-react"
import { format } from "date-fns"

export default function OrdersPage() {
  const { orders, updateOrderStatus, refreshOrders } = useOrders()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false)

 // New state for print language
  const [refreshing, setRefreshing] = useState(false)

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Group orders by status for tabs
  const ordersByStatus = {
    all: filteredOrders,
    pending: filteredOrders.filter(order => order.status === OrderStatus.PENDING),
    processing: filteredOrders.filter(order => order.status === OrderStatus.PROCESSING),
    shipped: filteredOrders.filter(order => order.status === OrderStatus.SHIPPED),
    delivered: filteredOrders.filter(order => order.status === OrderStatus.DELIVERED),
    cancelled: filteredOrders.filter(order => order.status === OrderStatus.CANCELLED)
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

  // Get status icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-3 w-3" />
      case OrderStatus.PROCESSING:
        return <Package className="h-3 w-3" />
      case OrderStatus.SHIPPED:
        return <Truck className="h-3 w-3" />
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-3 w-3" />
      case OrderStatus.CANCELLED:
        return <XCircle className="h-3 w-3" />
      default:
        return <AlertTriangle className="h-3 w-3" />
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      refreshOrders()
      toast({
        title: "Orders Refreshed",
        description: "Order data has been updated",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh orders. Please try again.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Handle view order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
  }

  // Handle update status
  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order)
    setIsStatusUpdateDialogOpen(true)
  }

  // Handle status update
  const handleOrderStatusUpdate = (orderId: string, status: OrderStatus, tracking?: any, notes?: string) => {
    const updatedOrder = updateOrderStatus(orderId, status, tracking, notes)
    if (updatedOrder) {
      setSelectedOrder(updatedOrder) // Update selectedOrder with the latest data
      toast({
        title: "Order Updated",
        description: `Order status updated to ${status}`,
      })
      setIsStatusUpdateDialogOpen(false)
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
      })
    }
  }





  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Manage and process client portal orders</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold">{orders.length}</h3>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold text-yellow-600">
                  {ordersByStatus.pending.length}
                </h3>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {ordersByStatus.processing.length}
                </h3>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {ordersByStatus.delivered.length}
                </h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders by ID, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === OrderStatus.PENDING ? "default" : "outline"}
                onClick={() => setStatusFilter(OrderStatus.PENDING)}
              >
                Pending
              </Button>
              <Button 
                variant={statusFilter === OrderStatus.PROCESSING ? "default" : "outline"}
                onClick={() => setStatusFilter(OrderStatus.PROCESSING)}
              >
                Processing
              </Button>
              <Button 
                variant={statusFilter === OrderStatus.SHIPPED ? "default" : "outline"}
                onClick={() => setStatusFilter(OrderStatus.SHIPPED)}
              >
                Shipped
              </Button>
              <Button 
                variant={statusFilter === OrderStatus.DELIVERED ? "default" : "outline"}
                onClick={() => setStatusFilter(OrderStatus.DELIVERED)}
              >
                Delivered
              </Button>
              <Button 
                variant={statusFilter === OrderStatus.CANCELLED ? "default" : "outline"}
                onClick={() => setStatusFilter(OrderStatus.CANCELLED)}
              >
                Cancelled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({ordersByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({ordersByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({ordersByStatus.processing.length})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({ordersByStatus.shipped.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({ordersByStatus.delivered.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({ordersByStatus.cancelled.length})</TabsTrigger>
        </TabsList>

        {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {statusOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search terms" : `No ${status} orders at the moment`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {statusOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Customer:</span> {order.clientName}
                            </div>
                            <div>
                              <span className="font-medium">Items:</span> {order.items.length}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>

                        {/* Order Total */}
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            <CurrencyDisplay amount={order.total} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(order)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      {selectedOrder && (
        <>
          <OrderDetailsDialog
            order={selectedOrder}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}

          />
          <OrderStatusUpdateDialog
            order={selectedOrder}
            open={isStatusUpdateDialogOpen}
            onOpenChange={setIsStatusUpdateDialogOpen}
            onStatusUpdate={handleOrderStatusUpdate}
          />
        </>
      )}
    </div>
  )
}
