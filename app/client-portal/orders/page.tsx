"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useOrders } from "@/lib/order-provider"
import { Order, OrderStatus } from "@/lib/order-types"
import { getCurrentClientId, getClientInfo } from "@/lib/client-auth-utils"
import {
  Package,
  Search,
  Calendar,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from "lucide-react"
import { format } from "date-fns"

export default function OrderHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, refreshOrders } = useOrders()
  const [clientOrders, setClientOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Get client ID using consistent utility
  const getClientId = getCurrentClientId

  // Load client orders
  useEffect(() => {
    const clientId = getClientId()

    console.log('🔍 CLIENT PORTAL ORDERS: Loading orders for client:', {
      clientId,
      totalOrders: orders.length,
      allOrderClientIds: orders.map(order => ({ id: order.id, clientId: order.clientId, clientName: order.clientName }))
    })

    // Filter orders for the current client
    const userOrders = orders.filter(order => {
      const matches = order.clientId === clientId ||
        order.clientName?.toLowerCase().includes(clientId.toLowerCase())

      console.log('🔍 Order matching check:', {
        orderId: order.id,
        orderClientId: order.clientId,
        orderClientName: order.clientName,
        searchClientId: clientId,
        exactMatch: order.clientId === clientId,
        nameMatch: order.clientName?.toLowerCase().includes(clientId.toLowerCase()),
        finalMatch: matches
      })

      return matches
    })

    console.log('🔍 CLIENT PORTAL ORDERS: Filtered results:', {
      clientId,
      matchingOrders: userOrders.length,
      matchingOrderIds: userOrders.map(order => order.id)
    })

    // Sort by creation date (newest first)
    const sortedOrders = userOrders.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setClientOrders(sortedOrders)
    setLoading(false)
  }, [orders])

  // Filter orders based on search term
  const filteredOrders = clientOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
        return <Clock className="h-4 w-4" />
      case OrderStatus.PROCESSING:
        return <Package className="h-4 w-4" />
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4" />
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      refreshOrders()
      toast({
        title: "Orders refreshed",
        description: "Your order history has been updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh orders",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your order history</p>
        </div>
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

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders by ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" asChild>
              <Link href="/client-portal/track-order">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No orders found" : "No orders yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start shopping to see your orders here"
              }
            </p>
            {!searchTerm && (
              <Button asChild className="bg-pink-600 hover:bg-pink-700">
                <Link href="/client-portal/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-gray-900">
                        <CurrencyDisplay amount={order.total} />
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        {order.items.slice(0, 2).map(item => item.name).join(", ")}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/client-portal/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredOrders.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-pink-600">{filteredOrders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay
                    amount={filteredOrders.reduce((sum, order) => sum + order.total, 0)}
                  />
                </p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredOrders.filter(order => order.status === OrderStatus.DELIVERED).length}
                </p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
