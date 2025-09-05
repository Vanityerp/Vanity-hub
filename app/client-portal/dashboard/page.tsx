"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useClients } from "@/lib/client-provider"
import { useServices } from "@/lib/service-provider"
import { useProducts } from "@/lib/product-provider"
import { useCurrency } from "@/lib/currency-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { PersonalizedRecommendations } from "@/components/client-portal/personalized-recommendations"
import { FeaturedContentCarousel } from "@/components/client-portal/featured-content-carousel"
import { EnhancedStylistCard } from "@/components/client-portal/enhanced-stylist-card"
import { EnhancedProductCard } from "@/components/client-portal/enhanced-product-card"
import { GiftCardBalance } from "@/components/client-portal/gift-card-balance"
import { MembershipStatus } from "@/components/client-portal/membership-status"
import { GiftCardPurchaseDialog } from "@/components/client-portal/gift-card-purchase-dialog"
import { MembershipPlanSelectionDialog } from "@/components/client-portal/membership-plan-selection-dialog"
import { useGlobalCurrencyChange } from "@/components/global-currency-enforcer"
import { useOrders } from "@/lib/order-provider"
import { OrderStatus } from "@/lib/order-types"
import { getCurrentClientId } from "@/lib/client-auth-utils"
import { useCarouselData, CarouselItem, carouselStorage } from "@/lib/carousel-storage"
import { DynamicQuickActions } from "@/components/client-portal/dynamic-quick-actions"
import {
  Calendar,
  Clock,
  ShoppingBag,
  User,
  CreditCard,
  Heart,
  Star,
  Gift,
  Bell,
  Scissors,
  ChevronRight,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Eye
} from "lucide-react"
import { format } from "date-fns"
// DEPRECATED: Mock data removed - now using real API data
import { EnhancedImage } from "@/components/ui/enhanced-image"

export default function ClientDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clients, getClient } = useClients()
  const { services, categories, getCategoryName } = useServices()
  const { products, getRetailProducts } = useProducts()
  const { currencyCode, formatCurrency } = useCurrency()
  const { orders } = useOrders()
  const { carouselItems } = useCarouselData()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [showGiftCardDialog, setShowGiftCardDialog] = useState(false)
  const [showMembershipDialog, setShowMembershipDialog] = useState(false)
  const [selectedTierForDialog, setSelectedTierForDialog] = useState<string | undefined>(undefined)

  // Real-time data integration - with fallback to prevent circular dependencies
  const [dataLoading, setDataLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  // Get real product data from the product provider
  const realTimeProducts = useMemo(() => {
    const retailProducts = getRetailProducts()

    // Transform products to match the expected format and add enhanced properties
    return retailProducts.slice(0, 3).map((product, index) => {
      // Calculate total stock from all locations
      const totalStock = product.locations && product.locations.length > 0
        ? product.locations.reduce((total, location) => total + (location.stock || 0), 0)
        : (product.stock || 0)

      // Use the same image handling as the shop page
      const productImage = product.images && product.images.length > 0
        ? product.images[0]
        : product.image || "/product-placeholder.jpg"

      return {
        id: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        image: productImage,
        images: product.images || (product.image ? [product.image] : []),
        category: product.category,
        isRecommended: product.isFeatured || product.isBestSeller,
        displayPrice: product.salePrice || product.price,
        description: product.description || `Professional ${product.category.toLowerCase()} product`,
        originalPrice: product.salePrice ? product.price : undefined,
        isNew: product.isNew || index === 0, // Mark first product as new if not set
        isBestSeller: product.isBestSeller || index === 1, // Mark second as best seller if not set
        isSale: !!(product.salePrice || product.isSale),
        isFeatured: product.isFeatured || index < 2, // Mark first 2 as featured if not set
        stock: totalStock,
        type: product.type,
        brand: product.brand,
        sku: product.sku
      }
    })
  }, [getRetailProducts])
  const realTimeServices = services.slice(0, 6).map((service, index) => ({
    ...service,
    image: (service as any).imageUrl || [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop&crop=center&auto=format&q=80"
    ][index % 6],
    displayPrice: service.price,
    formattedDuration: service.duration ? `${service.duration} min` : undefined,
    isFeatured: (service as any).isFeatured || index < 2, // Mark first 2 as featured
    isPopular: (service as any).isPopular || index === 0, // Mark first as popular
    showPrices: (service as any).showPrices ?? true
  }))
  const realTimeStaff = []

  const refreshData = useCallback(() => {
    setDataLoading(true)
    // Simulate refresh
    setTimeout(() => {
      setDataLoading(false)
      setLastUpdated(Date.now())
    }, 1000)
  }, [])

  // Listen for currency changes to ensure consistent currency display
  useGlobalCurrencyChange((newCurrencyCode) => {
    console.log(`Currency changed in client dashboard: ${newCurrencyCode}`)
    // Force a re-render when currency changes
    setForceUpdate(prev => prev + 1)
  })

  // Check if client is authenticated
  useEffect(() => {
    const token = localStorage.getItem("client_auth_token")
    const clientEmail = localStorage.getItem("client_email")
    const clientId = localStorage.getItem("client_id")

    if (!token || !clientEmail) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access your dashboard",
        variant: "destructive",
      })
      router.push("/client-portal")
      return
    }

    // Find client by email or ID
    let foundClient
    if (clientId) {
      foundClient = getClient(clientId)
    } else {
      foundClient = clients.find(c => c.email === clientEmail)
    }

    if (foundClient) {
      setClient(foundClient)
    } else {
      // If client not found, create a mock client for demo purposes
      setClient({
        id: "client123",
        name: "Jane Smith",
        email: clientEmail,
        phone: "(555) 123-4567",
        preferredLocation: "loc1",
        avatar: "JS",
        loyaltyPoints: 450,
        memberSince: "January 2025"
      })
    }

    setLoading(false)
  }, [clients, getClient, router, toast])

  // Get upcoming appointments for this client
  // TODO: Replace with real API call to fetch client appointments
  const upcomingAppointments: any[] = []

  // Get past appointments for this client
  // TODO: Replace with real API call to fetch client appointment history
  const pastAppointments = useMemo(() => [], [client?.id])

  // Get recent orders for this client
  const recentOrders = useMemo(() => {
    const clientId = getCurrentClientId()
    return orders
      .filter(order =>
        order.clientId === clientId ||
        order.clientName?.toLowerCase().includes(clientId.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [orders])

  // Memoize client preferences to prevent unnecessary re-renders
  const clientPreferences = useMemo(() => ({
    preferredServices: ["Haircut & Style", "Color & Highlights"],
    preferredProducts: ["Hydrating Shampoo", "Styling Mousse"],
    preferredStylists: ["Emma Johnson"]
  }), [])

  // Get status badge variant for orders
  const getOrderStatusBadgeVariant = (status: OrderStatus) => {
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

  // Get status icon for orders
  const getOrderStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-3 w-3" />
      case OrderStatus.PROCESSING:
        return <Package className="h-3 w-3" />
      case OrderStatus.SHIPPED:
        return <Truck className="h-3 w-3" />
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  // Recommended services based on past appointments
  // TODO: Replace with real API call to fetch recommended services
  const recommendedServices = useMemo(() => [], [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-pink-100 text-pink-800">
              <AvatarFallback>{client?.avatar || client?.name?.split(" ").map((n: string) => n[0]).join("") || "C"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {client?.name?.split(" ")[0] || "Client"}!</h1>
              <p className="text-gray-600">Member since {client?.memberSince || "January 2025"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={dataLoading}
              className="relative"
            >
              {dataLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                carouselStorage.resetQuickActionsToDefaults()
                toast({
                  title: "Quick Actions Reset",
                  description: "Quick actions have been reset to defaults with Calendar icon.",
                })
              }}
              className="text-xs"
            >
              Fix Icons
            </Button>
            <Button variant="outline" asChild>
              <Link href="/client-portal/profile">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
            <Button className="bg-pink-600 hover:bg-pink-700" asChild>
              <Link href="/client-portal/appointments/book">
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured Content Carousel */}
        <div className="mb-8 mt-4">
          <FeaturedContentCarousel
            items={carouselItems.filter((item: CarouselItem) => item.isActive)}
            autoPlay={true}
            autoPlayInterval={6000}
            showDots={true}
            className="relative z-0"
          />
        </div>

        {/* Quick Actions */}
        <DynamicQuickActions />



        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/client-portal/appointments" className="text-pink-600">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="font-medium mb-2">No upcoming appointments</h3>
                    <p className="text-gray-500 mb-4">Schedule your next visit with us</p>
                    <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md transition-all hover:shadow-lg" asChild>
                      <Link href="/client-portal/appointments/book">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Now
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mr-4">
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{appointment.service}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {format(new Date(appointment.date), "MMMM d, yyyy")}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {format(new Date(appointment.date), "h:mm a")}
                            </div>
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1" />
                              {appointment.staffName}
                            </div>
                          </div>
                        </div>
                        <Badge className={
                          appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
                          appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/client-portal/appointments/book">
                        <Plus className="mr-2 h-4 w-4" />
                        Book Another Appointment
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personalized Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recommended For You</CardTitle>
                <CardDescription>Personalized recommendations based on your preferences and history</CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalizedRecommendations
                  clientId={client?.id || "client123"}
                  clientPreferences={clientPreferences}
                  pastAppointments={pastAppointments}
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-start p-3 rounded-lg border">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-3">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{appointment.service}</h4>
                          <span className="text-sm text-gray-500">
                            {format(new Date(appointment.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">with {appointment.staffName}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <Badge variant="outline" className="bg-gray-50">
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-pink-600 h-8">
                            Book Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Loyalty Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Loyalty Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-white/80 text-sm">Vanity Hub</p>
                      <h3 className="font-bold text-lg">Rewards Card</h3>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-white text-white" />
                      <span className="font-bold ml-1">{client?.loyaltyPoints || 450} pts</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mb-1">Member Name</p>
                  <p className="font-medium">{client?.name || "Jane Smith"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to next reward</span>
                    <span>{client?.loyaltyPoints || 450}/500 points</span>
                  </div>
                  <Progress value={((client?.loyaltyPoints || 450) / 500) * 100} className="h-2" />
                  <p className="text-xs text-gray-500">
                    Earn 50 more points for a <CurrencyDisplay amount={25} /> reward
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Available Rewards</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded-lg border">
                      <div>
                        <p className="font-medium"><CurrencyDisplay amount={10} /> off your next service</p>
                        <p className="text-sm text-gray-500">Valid until Dec 31, 2025</p>
                      </div>
                      <Button size="sm" variant="outline">Redeem</Button>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg border">
                      <div>
                        <p className="font-medium">Free product sample</p>
                        <p className="text-sm text-gray-500">Valid until Nov 15, 2025</p>
                      </div>
                      <Button size="sm" variant="outline">Redeem</Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client-portal/loyalty">
                    View Loyalty Program
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Purchase Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Purchase gift cards or join our membership program</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setShowGiftCardDialog(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Purchase Gift Card
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTierForDialog(undefined)
                    setShowMembershipDialog(true)
                  }}
                  variant="outline"
                  className="w-full border-purple-200 hover:bg-purple-50"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Join Membership Program
                </Button>
              </CardContent>
            </Card>

            {/* Featured Services */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Featured Services</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/client-portal/services" className="text-pink-600">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realTimeServices.slice(0, 3).map((service) => (
                    <Link
                      key={service.id}
                      href={`/client-portal/appointments/book?serviceId=${service.id}`}
                      className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-transparent hover:border-pink-100"
                    >
                      <div className="relative">
                        <EnhancedImage
                          src={service.image}
                          alt={service.name}
                          className="w-16 h-16 rounded-lg flex-shrink-0"
                          aspectRatio="square"
                          showZoom={false}
                          fallbackSrc="/service-placeholder.jpg"
                        />
                        {service.isFeatured && (
                          <Badge className="absolute -top-1 -right-1 bg-pink-500 text-xs px-1">Featured</Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-pink-600 transition-colors">{service.name}</h4>
                            <p className="text-sm text-gray-500">{getCategoryName(service.category)}</p>
                            {service.isPopular && (
                              <Badge className="bg-amber-100 text-amber-800 text-xs mt-1">Popular</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            {(service.showPrices ?? true) && (
                              <p className="font-medium"><CurrencyDisplay amount={service.displayPrice || service.price} /></p>
                            )}
                            {service.formattedDuration && (
                              <p className="text-xs text-gray-400">{service.formattedDuration}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client-portal/services">
                      <Scissors className="mr-2 h-4 w-4" />
                      Explore All Services
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Products */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Featured Products</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/client-portal/shop" className="text-pink-600">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realTimeProducts.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/client-portal/shop/${product.id}`}
                      className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-transparent hover:border-pink-100"
                    >
                      <div className="relative">
                        <EnhancedImage
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg flex-shrink-0"
                          aspectRatio="square"
                          showZoom={false}
                          fallbackSrc="/product-placeholder.jpg"
                        />
                        <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                          {product.isNew && (
                            <Badge className="bg-pink-600 text-xs px-1">New</Badge>
                          )}
                          {product.isBestSeller && (
                            <Badge className="bg-amber-500 text-xs px-1">Best</Badge>
                          )}
                          {product.isSale && (
                            <Badge className="bg-red-500 text-xs px-1">Sale</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium group-hover:text-pink-600 transition-colors">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.description || product.category}</p>
                            <div className="flex gap-1 mt-1">
                              {product.isRecommended && (
                                <Badge className="bg-pink-100 text-pink-800 text-xs">Recommended</Badge>
                              )}
                              {product.isFeatured && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {product.isSale && product.originalPrice && product.originalPrice !== product.displayPrice && (
                              <p className="text-xs text-gray-400 line-through">
                                <CurrencyDisplay amount={product.originalPrice} />
                              </p>
                            )}
                            <p className="font-medium">
                              <CurrencyDisplay amount={product.displayPrice || product.price} />
                            </p>
                            {product.stock !== undefined && (
                              <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client-portal/shop">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Shop All Products
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Special Offers */}
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-100">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <Badge className="bg-pink-100 text-pink-800 mb-2">Limited Time</Badge>
                  <h3 className="text-xl font-bold mb-2">Summer Special Offer</h3>
                  <p className="text-gray-600 mb-4">
                    Get 20% off any color service when you book this month!
                  </p>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="gift-cards">
        <GiftCardBalance />
      </TabsContent>

      <TabsContent value="membership">
        <MembershipStatus clientId={client?.id} />
      </TabsContent>
    </Tabs>

    {/* Purchase Dialogs */}
    <GiftCardPurchaseDialog
      open={showGiftCardDialog}
      onOpenChange={setShowGiftCardDialog}
      onSuccess={() => {
        toast({
          title: "Gift Card Purchased!",
          description: "Your gift card has been successfully purchased."
        })
      }}
    />

    <MembershipPlanSelectionDialog
      open={showMembershipDialog}
      onOpenChange={(open) => {
        setShowMembershipDialog(open)
        if (!open) {
          setSelectedTierForDialog(undefined)
        }
      }}
      preSelectedTierId={selectedTierForDialog}
      onSuccess={() => {
        toast({
          title: "Membership Activated!",
          description: "Welcome to our membership program!"
        })
        setSelectedTierForDialog(undefined)
      }}
    />
  </div>
  )
}
