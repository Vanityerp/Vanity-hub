"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Package, AlertTriangle, AlertCircle, Calendar, Filter, MapPin, Trash2, Tag, RotateCcw } from "lucide-react"
import { parseISO, differenceInDays, addDays } from "date-fns"
import { formatAppDate } from "@/lib/date-utils"
import { useProducts } from "@/lib/product-provider"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useToast } from "@/components/ui/use-toast"

// Enhanced interfaces for inventory alerts
interface StockAlert {
  id: string
  name: string
  category: string
  stock: number
  minStock: number
  maxStock: number
  status: "Critical" | "Low" | "Normal"
  location?: string
  sku?: string
}

interface ExpiryAlert {
  id: string
  name: string
  category: string
  batchNumber: string
  expiryDate: string
  stock: number
  location: string
  sku?: string
  daysUntilExpiry: number
  urgency: "expired" | "critical" | "warning" | "normal"
}

interface InventoryAlertsProps {
  className?: string
}

export function InventoryAlerts({ className }: InventoryAlertsProps) {
  const { products } = useProducts()
  const { hasPermission } = useAuth()
  const { locations } = useLocations()
  const { toast } = useToast()

  // State for different alert types
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])

  // Filter states
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")
  const [timeFrameFilter, setTimeFrameFilter] = useState<string>("all")

  const [isLoading, setIsLoading] = useState(true)

  // Load inventory alerts
  useEffect(() => {
    loadInventoryAlerts()

    // Refresh alerts every 5 minutes
    const interval = setInterval(loadInventoryAlerts, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [products, locations])

  // Load expiry alerts from batch system
  const loadExpiryAlerts = async (): Promise<ExpiryAlert[]> => {
    try {
      const response = await fetch('/api/inventory/batches?expiringSoon=true')
      if (!response.ok) {
        // If the API fails (e.g., ProductBatch table doesn't exist yet), return empty array
        if (response.status === 500) {
          console.warn('Batch tracking not yet available. Please run database migration: npx prisma db push')
          return []
        }
        console.error('Failed to fetch expiring batches:', response.statusText)
        return []
      }

      const data = await response.json()
      const batches = data.batches || []

      return batches.map((batch: any) => {
        const daysUntilExpiry = batch.expiryDate
          ? differenceInDays(parseISO(batch.expiryDate), new Date())
          : 999

        let urgency: "expired" | "critical" | "warning" | "normal" = "normal"
        if (daysUntilExpiry < 0) urgency = "expired"
        else if (daysUntilExpiry <= 7) urgency = "critical"
        else if (daysUntilExpiry <= 15) urgency = "warning"

        // Find the real location name from locations provider
        const realLocation = locations.find(loc => loc.id === batch.locationId)
        const locationName = realLocation?.name || batch.location?.name || "Unknown Location"

        return {
          id: batch.id,
          name: batch.product.name,
          category: batch.product.category,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          stock: batch.quantity,
          location: locationName,
          sku: batch.product.sku || "",
          daysUntilExpiry,
          urgency
        }
      })
    } catch (error) {
      // Silently handle the error if batch tracking isn't set up yet
      console.warn('Batch tracking system not available yet. Expiry alerts will be empty until database migration is completed.')
      return []
    }
  }

  const loadInventoryAlerts = async () => {
    try {
      setIsLoading(true)
      // Generate stock alerts from products with real location data
      const stockAlertsData: StockAlert[] = []

      products.forEach(product => {
        // Check each location for this product
        if (product.locations && product.locations.length > 0) {
          product.locations.forEach(productLocation => {
            const stockLevel = productLocation.stock || 0
            const minStock = product.minStock || 5

            if (stockLevel <= minStock) {
              // Find the real location name from locations provider
              const realLocation = locations.find(loc => loc.id === productLocation.locationId)
              const locationName = realLocation?.name || productLocation.location?.name || "Unknown Location"

              stockAlertsData.push({
                id: `${product.id}-${productLocation.locationId}`,
                name: product.name,
                category: product.category,
                stock: stockLevel,
                minStock: minStock,
                maxStock: 50, // Default max stock
                status: stockLevel === 0 ? "Critical" :
                        stockLevel <= minStock / 2 ? "Critical" : "Low",
                location: locationName,
                sku: product.sku || ""
              })
            }
          })
        } else {
          // Fallback for products without location data
          const stockLevel = product.stock || 0
          const minStock = product.minStock || 5

          if (stockLevel <= minStock) {
            stockAlertsData.push({
              id: product.id,
              name: product.name,
              category: product.category,
              stock: stockLevel,
              minStock: minStock,
              maxStock: 50,
              status: stockLevel === 0 ? "Critical" :
                      stockLevel <= minStock / 2 ? "Critical" : "Low",
              location: "No Location Assigned",
              sku: product.sku || ""
            })
          }
        }
      })

      // Load real expiry alerts from batch system
      const expiryAlertsData: ExpiryAlert[] = await loadExpiryAlerts()

      setStockAlerts(stockAlertsData)
      setExpiryAlerts(expiryAlertsData)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading inventory alerts:', error)
      setIsLoading(false)
    }
  }



  // Helper functions with enhanced styling
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'expired': return 'alert-expired alert-table-row'
      case 'critical': return 'alert-critical alert-table-row'
      case 'warning': return 'alert-warning alert-table-row'
      default: return 'alert-normal alert-table-row'
    }
  }

  const getStockStatusClass = (status: string) => {
    switch (status) {
      case 'Critical': return 'inventory-progress critical'
      case 'Low': return 'inventory-progress low'
      default: return 'inventory-progress normal'
    }
  }

  const getUrgencyBadge = (urgency: string, daysUntilExpiry: number) => {
    if (urgency === 'expired') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Expired
      </Badge>
    } else if (urgency === 'critical') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Critical ({daysUntilExpiry} days)
      </Badge>
    } else if (urgency === 'warning') {
      return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Warning ({daysUntilExpiry} days)
      </Badge>
    }
    return <Badge variant="secondary">Normal</Badge>
  }

  // Filter expiry alerts
  const getFilteredExpiryAlerts = () => {
    return expiryAlerts.filter(alert => {
      if (locationFilter !== "all" && alert.location !== locationFilter) return false
      if (categoryFilter !== "all" && alert.category !== categoryFilter) return false
      if (urgencyFilter !== "all" && alert.urgency !== urgencyFilter) return false
      if (timeFrameFilter !== "all") {
        const days = Math.abs(alert.daysUntilExpiry)
        if (timeFrameFilter === "15days" && days > 15) return false
        if (timeFrameFilter === "30days" && days > 30) return false
      }
      return true
    })
  }

  // Filter stock alerts
  const getFilteredStockAlerts = () => {
    return stockAlerts.filter(alert => {
      if (locationFilter !== "all" && alert.location !== locationFilter) return false
      if (categoryFilter !== "all" && alert.category !== categoryFilter) return false
      return true
    })
  }

  const filteredExpiryAlerts = getFilteredExpiryAlerts()
  const filteredStockAlerts = getFilteredStockAlerts()

  // Get unique values for filters
  const allLocations = [...new Set([...stockAlerts.map(a => a.location), ...expiryAlerts.map(a => a.location)].filter(Boolean))]
  const allCategories = [...new Set([...stockAlerts.map(a => a.category), ...expiryAlerts.map(a => a.category)])]

  const totalAlerts = filteredStockAlerts.length + filteredExpiryAlerts.length

  // Action handlers
  const handleCreateDiscount = async (alertId: string, alertType: 'stock' | 'expiry' = 'stock') => {
    try {
      let product: any = null
      let discountReason = ""
      let discountPercentage = 20 // Default 20% discount

      if (alertType === 'expiry') {
        // Handle expiry alert discount
        const alert = expiryAlerts.find(a => a.id === alertId)
        if (!alert) {
          toast({
            title: "Error",
            description: "Expiry alert not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        product = products.find(p => p.name === alert.name)
        if (!product) {
          toast({
            title: "Error",
            description: "Product not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        // Calculate discount based on urgency
        if (alert.urgency === 'critical') {
          discountPercentage = 30 // 30% off for critical (7 days or less)
          discountReason = `Critical expiry discount - Expires in ${alert.daysUntilExpiry} days`
        } else if (alert.urgency === 'warning') {
          discountPercentage = 20 // 20% off for warning (15 days or less)
          discountReason = `Near expiry discount - Expires in ${alert.daysUntilExpiry} days`
        } else {
          discountPercentage = 15 // 15% off for normal
          discountReason = `Expiry discount - Expires in ${alert.daysUntilExpiry} days`
        }
      } else {
        // Handle stock alert discount
        const alert = stockAlerts.find(a => a.id === alertId)
        if (!alert) {
          toast({
            title: "Error",
            description: "Stock alert not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        product = products.find(p => p.name === alert.name)
        if (!product) {
          toast({
            title: "Error",
            description: "Product not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        // Calculate discount based on stock status
        if (alert.status === 'Critical') {
          discountPercentage = 25 // 25% off for critical stock
          discountReason = `Low stock clearance - Only ${alert.stock} units remaining`
        } else {
          discountPercentage = 15 // 15% off for low stock
          discountReason = `Low stock discount - ${alert.stock} units remaining`
        }
      }

      // Calculate discount price
      const discountPrice = product.price * (1 - discountPercentage / 100)

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isSale: true,
          salePrice: discountPrice
        })
      })

      if (response.ok) {
        console.log('✅ Discount created for product:', product.name)
        toast({
          title: "Discount Created",
          description: `${discountPercentage}% discount applied to ${product.name} - ${discountReason}`,
        })
        // Refresh products to show updated data
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to create discount:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to create discount. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Error creating discount:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkForDisposal = async (batchId: string, batchNumber: string) => {
    try {
      console.log('🗑️ Marking batch for disposal:', batchId, batchNumber)

      // Find the expiry alert to get batch details
      const alert = expiryAlerts.find(a => a.id === batchId)
      if (!alert) {
        toast({
          title: "Error",
          description: "Batch information not found. Please refresh and try again.",
          variant: "destructive",
        })
        return
      }

      // Find the product to get additional details
      const product = products.find(p => p.name === alert.name)
      if (!product) {
        toast({
          title: "Error",
          description: "Product information not found. Please refresh and try again.",
          variant: "destructive",
        })
        return
      }

      // Find the location ID from the alert location name
      const location = locations.find(loc => loc.name === alert.location)
      if (!location) {
        toast({
          title: "Error",
          description: "Location information not found. Please refresh and try again.",
          variant: "destructive",
        })
        return
      }

      // Call the disposal API
      const response = await fetch('/api/inventory/dispose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          locationId: location.id,
          quantity: alert.stock,
          reason: `Expired batch - Batch: ${batchNumber}, Expiry: ${alert.expiryDate}`,
          batchId: batchId,
          notes: `Automatic disposal of expired batch ${batchNumber}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to dispose batch')
      }

      const result = await response.json()

      toast({
        title: "Batch Disposed Successfully",
        description: `${result.disposal.disposedQuantity} units of ${result.disposal.productName} (Batch: ${batchNumber}) have been disposed`,
      })

      // Refresh the alerts to reflect the changes
      await loadInventoryAlerts()

    } catch (error) {
      console.error('❌ Error marking for disposal:', error)
      toast({
        title: "Disposal Failed",
        description: error instanceof Error ? error.message : "Failed to dispose batch. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReorder = async (alertId: string, alertType: 'stock' | 'expiry' = 'stock') => {
    try {
      let product: any = null
      let location: any = null
      let currentStock = 0
      let recommendedQuantity = 50 // Default reorder quantity
      let urgency = 'normal'

      if (alertType === 'stock') {
        // Handle stock alert reorder
        const alert = stockAlerts.find(a => a.id === alertId)
        if (!alert) {
          toast({
            title: "Error",
            description: "Stock alert not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        product = products.find(p => p.name === alert.name)
        if (!product) {
          toast({
            title: "Error",
            description: "Product not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        // Find the location from the alert
        location = locations.find(loc => loc.name === alert.location)
        if (!location) {
          toast({
            title: "Error",
            description: "Location not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        currentStock = alert.stock
        // Calculate recommended quantity based on min stock and current stock
        const minStock = alert.minStock || 5
        recommendedQuantity = Math.max(minStock * 3 - currentStock, minStock) // Reorder to 3x min stock
        urgency = alert.status === 'Critical' ? 'high' : 'normal'
      } else {
        // Handle expiry alert reorder (for replacement stock)
        const alert = expiryAlerts.find(a => a.id === alertId)
        if (!alert) {
          toast({
            title: "Error",
            description: "Expiry alert not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        product = products.find(p => p.name === alert.name)
        if (!product) {
          toast({
            title: "Error",
            description: "Product not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        location = locations.find(loc => loc.name === alert.location)
        if (!location) {
          toast({
            title: "Error",
            description: "Location not found. Please refresh and try again.",
            variant: "destructive",
          })
          return
        }

        currentStock = alert.stock
        recommendedQuantity = alert.stock // Replace the expiring stock
        urgency = alert.urgency === 'expired' || alert.urgency === 'critical' ? 'high' : 'normal'
      }

      console.log('🔄 Creating reorder request for:', product.name)

      // Call the reorder API
      const response = await fetch('/api/inventory/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          locationId: location.id,
          quantity: recommendedQuantity,
          urgency: urgency,
          notes: alertType === 'expiry'
            ? `Replacement order for expiring stock (${currentStock} units expiring)`
            : `Low stock reorder (current: ${currentStock} units)`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to create reorder request')
      }

      const result = await response.json()

      toast({
        title: "Reorder Request Created",
        description: `Reorder ${result.reorder.id} created for ${recommendedQuantity} units of ${product.name}`,
      })

      console.log('✅ Reorder request created:', result.reorder.id)

    } catch (error) {
      console.error('❌ Error creating reorder request:', error)
      toast({
        title: "Reorder Failed",
        description: error instanceof Error ? error.message : "Failed to create reorder request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Permission check
  if (!hasPermission("view_inventory") && !hasPermission("all")) {
    return (
      <Card className={`${className} dashboard-card`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Access denied - insufficient permissions</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={`${className} dashboard-card`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading inventory alerts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} dashboard-card`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Inventory Alerts</span>
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 flex-shrink-0">
                  {totalAlerts}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {totalAlerts === 0
                ? "All inventory levels are normal"
                : `${filteredStockAlerts.length} low stock, ${filteredExpiryAlerts.length} expiring products`
              }
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-green-600">All Inventory Normal</p>
            <p className="text-sm">No low stock or expiring products found</p>
          </div>
        ) : (
          <Tabs defaultValue="stock" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="stock" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Low Stock
                  {filteredStockAlerts.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {filteredStockAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="expiry" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiring
                  {filteredExpiryAlerts.length > 0 && (
                    <Badge variant="destructive" className="ml-1 text-xs">
                      {filteredExpiryAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="alert-filters flex flex-wrap gap-2">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="select-trigger w-[120px] sm:w-[140px]">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {allLocations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="select-trigger w-[120px] sm:w-[140px]">
                    <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={timeFrameFilter} onValueChange={setTimeFrameFilter}>
                  <SelectTrigger className="select-trigger w-[120px] sm:w-[140px]">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <SelectValue placeholder="Time frame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="15days">Next 15 days</SelectItem>
                    <SelectItem value="30days">Next 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="stock" className="space-y-4">
              {filteredStockAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium text-green-600">All Stock Levels Normal</p>
                  <p className="text-sm">No low stock items found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredStockAlerts.map((item) => (
                    <div key={item.id} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            <Badge
                              className={
                                item.status === "Critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{item.category}</span>
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                              </span>
                            )}
                            {item.sku && <span>SKU: {item.sku}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateDiscount(item.id, 'stock')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Tag className="h-4 w-4 mr-1" />
                            Discount
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReorder(item.id, 'stock')}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Stock Level: {item.stock} units</span>
                          <span>{Math.round((item.stock / item.maxStock) * 100)}%</span>
                        </div>
                        <Progress value={(item.stock / item.maxStock) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Min: {item.minStock}</span>
                          <span>Max: {item.maxStock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expiry" className="space-y-4">
              {filteredExpiryAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium text-green-600">No Expiring Products</p>
                  <p className="text-sm">All products are within safe expiry dates</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch/Lot</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpiryAlerts
                        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                        .map((alert) => (
                        <TableRow key={alert.id} className={getUrgencyColor(alert.urgency)}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{alert.name}</div>
                              <div className="text-sm text-muted-foreground">{alert.category}</div>
                              {alert.sku && <div className="text-xs text-muted-foreground">SKU: {alert.sku}</div>}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{alert.batchNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              <div>
                                <div>{formatAppDate(alert.expiryDate)}</div>
                                <div className={`text-xs ${
                                  alert.urgency === 'expired' ? 'text-red-600' :
                                  alert.urgency === 'critical' ? 'text-red-600' :
                                  alert.urgency === 'warning' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {alert.daysUntilExpiry < 0
                                    ? `${Math.abs(alert.daysUntilExpiry)} days overdue`
                                    : `${alert.daysUntilExpiry} days remaining`
                                  }
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{alert.stock} units</span>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.location}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getUrgencyBadge(alert.urgency, alert.daysUntilExpiry)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {alert.urgency === 'expired' || alert.urgency === 'critical' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkForDisposal(alert.id, alert.batchNumber)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Dispose
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCreateDiscount(alert.id, 'expiry')}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    <Tag className="w-4 h-4 mr-1" />
                                    Discount
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateDiscount(alert.id, 'expiry')}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <Tag className="w-4 h-4 mr-1" />
                                  Discount
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReorder(alert.id, 'expiry')}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reorder
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Hook to get inventory alert counts for tab display
export function useInventoryAlertCounts() {
  const [counts, setCounts] = useState({ lowStock: 0, expiring: 0 })
  const { products } = useProducts()
  const { hasPermission } = useAuth()

  useEffect(() => {
    if (!hasPermission("view_inventory") && !hasPermission("all")) {
      return
    }

    const updateCounts = async () => {
      try {
        // Count low stock items across all locations
        let lowStockCount = 0
        products.forEach(product => {
          if (product.locations && product.locations.length > 0) {
            // Check each location for this product
            product.locations.forEach(productLocation => {
              const stockLevel = productLocation.stock || 0
              const minStock = product.minStock || 5
              if (stockLevel <= minStock) {
                lowStockCount++
              }
            })
          } else {
            // Fallback for products without location data
            const stockLevel = product.stock || 0
            const minStock = product.minStock || 5
            if (stockLevel <= minStock) {
              lowStockCount++
            }
          }
        })

        // Count expiring items from batch system
        let expiringCount = 0
        try {
          const response = await fetch('/api/inventory/batches?expiringSoon=true')
          if (response.ok) {
            const data = await response.json()
            expiringCount = data.batches?.length || 0
          } else if (response.status === 500) {
            // Batch tracking not available yet, keep count at 0
            expiringCount = 0
          }
        } catch (error) {
          // Silently handle error if batch tracking isn't set up yet
          expiringCount = 0
        }

        setCounts({
          lowStock: lowStockCount,
          expiring: expiringCount
        })
      } catch (error) {
        console.error('Error updating inventory alert counts:', error)
      }
    }

    updateCounts()

    // Update counts every 5 minutes
    const interval = setInterval(updateCounts, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [products, hasPermission])

  return counts
}

