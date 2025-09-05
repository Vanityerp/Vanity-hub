"use client"

import React, { useEffect, useState } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOrders } from "@/lib/order-provider"
import { getCurrentClientId } from "@/lib/client-auth-utils"
import { SettingsStorage, type GeneralSettings } from "@/lib/settings-storage"
import {
  CheckCircle,
  Package,
  Mail,
  Calendar,
  ArrowRight,
  Download,
  Star,
  Eye,
  Truck
} from "lucide-react"

export default function OrderSuccessPage() {
  const { orders } = useOrders()
  const [latestOrder, setLatestOrder] = useState<any>(null)
  const [businessSettings, setBusinessSettings] = useState<GeneralSettings | null>(null)
  const [orderNumber] = useState(() =>
    `VH${Date.now().toString().slice(-6)}`
  )
  const [estimatedDelivery] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 5) // 5 days from now
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })

  // Load business settings
  useEffect(() => {
    const settings = SettingsStorage.getGeneralSettings()
    setBusinessSettings(settings)
  }, [])

  // Get the latest order for the current client
  useEffect(() => {
    const clientId = getCurrentClientId()

    // Find the most recent order for this client
    const clientOrders = orders
      .filter(order =>
        order.clientId === clientId ||
        order.clientName?.toLowerCase().includes(clientId.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (clientOrders.length > 0) {
      setLatestOrder(clientOrders[0])
    }
  }, [orders])

  // Add loyalty points for authenticated users
  useEffect(() => {
    const addLoyaltyPoints = async () => {
      try {
        const clientId = localStorage.getItem("client_id")
        const token = localStorage.getItem("client_auth_token")

        if (clientId && token) {
          // Calculate points (example: 50 points for completing an order)
          const pointsEarned = 50

          const response = await fetch('/api/client-portal/loyalty', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId,
              points: pointsEarned,
              description: `Order Completion: ${latestOrder?.id || orderNumber}`
            }),
          })

          if (response.ok) {
            console.log(`Added ${pointsEarned} loyalty points for order completion`)
          }
        }
      } catch (error) {
        console.error("Error adding loyalty points:", error)
      }
    }

    if (latestOrder) {
      addLoyaltyPoints()
    }
  }, [latestOrder, orderNumber])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order completed</h1>
          <p className="text-gray-600">
            Come back again.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Order Number</h3>
                <p className="text-gray-600">{latestOrder?.id || orderNumber}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order Date</h3>
                <p className="text-gray-600">
                  {latestOrder
                    ? new Date(latestOrder.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()
                  }
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Estimated Delivery</h3>
                <p className="text-gray-600">{estimatedDelivery}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Shipping Method</h3>
                <p className="text-gray-600">Standard Shipping (Free)</p>
              </div>
            </div>

            {/* Track Order Button */}
            {latestOrder && (
              <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-pink-900">Track Your Order</h3>
                    <p className="text-sm text-pink-700">
                      Get real-time updates on your order status and delivery progress
                    </p>
                  </div>
                  <Button asChild className="bg-pink-600 hover:bg-pink-700">
                    <Link href={`/client-portal/orders/${latestOrder.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Track Order
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Confirmation Email</h3>
                  <p className="text-sm text-gray-600">
                    You'll receive an order confirmation email with tracking information within the next few minutes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Order Processing</h3>
                  <p className="text-sm text-gray-600">
                    Your order will be processed and shipped within 1-2 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Delivery</h3>
                  <p className="text-sm text-gray-600">
                    Your order should arrive by {estimatedDelivery}.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points Notification */}
        <Card className="mb-6 bg-pink-50 border-pink-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-pink-900">Loyalty Points Earned!</h3>
                <p className="text-sm text-pink-700">
                  You've earned 50 loyalty points for completing this order.
                  Use them for discounts on future purchases!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/client-portal/orders">
              <Package className="h-4 w-4 mr-2" />
              View All Orders
            </Link>
          </Button>

          {latestOrder && (
            <Button variant="outline" asChild>
              <Link href={`/client-portal/orders/${latestOrder.id}`}>
                <Truck className="h-4 w-4 mr-2" />
                Track This Order
              </Link>
            </Button>
          )}

          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/client-portal/shop">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your order, please don't hesitate to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${businessSettings?.email || 'support@vanityhub.com'}`}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/client-portal/track-order">
                <Package className="mr-2 h-4 w-4" />
                Track Any Order
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          </div>
        </div>

        {/* Return Policy */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Return Policy</h4>
          <p className="text-sm text-gray-600">
            Not satisfied with your purchase? You have 30 days from delivery to return any item
            for a full refund. Items must be unused and in original packaging.
          </p>
        </div>
      </div>
    </div>
  )
}
