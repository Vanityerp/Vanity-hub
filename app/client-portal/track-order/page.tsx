"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useOrders } from "@/lib/order-provider"
import { SettingsStorage, type GeneralSettings } from "@/lib/settings-storage"
import {
  Package,
  Search,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  Mail
} from "lucide-react"

export default function TrackOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { getOrder } = useOrders()
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<GeneralSettings | null>(null)

  // Load business settings
  useEffect(() => {
    const settings = SettingsStorage.getGeneralSettings()
    setBusinessSettings(settings)
  }, [])

  // Handle order tracking
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderId.trim()) {
      toast({
        title: "Order ID required",
        description: "Please enter your order ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Find the order
      const order = getOrder(orderId.trim())
      
      if (!order) {
        toast({
          title: "Order not found",
          description: "No order found with this ID. Please check and try again.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // If email is provided, verify it matches
      if (email.trim()) {
        const orderEmail = order.shippingAddress?.email?.toLowerCase()
        const inputEmail = email.trim().toLowerCase()
        
        if (orderEmail && orderEmail !== inputEmail) {
          toast({
            title: "Email mismatch",
            description: "The email address doesn't match this order.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // Redirect to order details
      router.push(`/client-portal/orders/${order.id}`)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while tracking your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Quick access for logged-in users
  const handleViewMyOrders = () => {
    router.push("/client-portal/orders")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your order details below to track your shipment
          </p>
        </div>

        {/* Track Order Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID *</Label>
                <Input
                  id="orderId"
                  type="text"
                  placeholder="ORDER-1234567890-abc123"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  You can find your order ID in your confirmation email
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  For additional verification (recommended)
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-pink-600 hover:bg-pink-700"
                disabled={loading}
              >
                {loading ? (
                  "Tracking..."
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access for Logged-in Users */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2">Already have an account?</h3>
              <p className="text-gray-600 mb-4">
                View all your orders and track them easily from your dashboard
              </p>
              <Button 
                onClick={handleViewMyOrders}
                variant="outline"
                className="w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Can't find your order ID?</h4>
              <p className="text-sm text-gray-600">
                Your order ID was sent to your email address when you placed the order. 
                Check your inbox and spam folder for the confirmation email.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Order not found?</h4>
              <p className="text-sm text-gray-600">
                Make sure you've entered the correct order ID. Order IDs are case-sensitive 
                and should be copied exactly as shown in your confirmation email.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Still having trouble?</h4>
              <p className="text-sm text-gray-600 mb-3">
                Contact our customer support team for assistance with your order.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${businessSettings?.email || 'support@vanityhub.com'}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/client-portal/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order ID Format Example */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2 text-sm">Order ID Format Example:</h4>
          <code className="text-sm bg-white px-2 py-1 rounded border">
            ORDER-1748706968326-2gobcc5ld
          </code>
        </div>
      </div>
    </div>
  )
}
