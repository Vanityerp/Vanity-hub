"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useProducts } from "@/lib/product-provider"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { Product } from "@/lib/products-data"
import { ArrowRight, Package, MapPin } from "lucide-react"

interface ProductTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

export function ProductTransferDialog({ open, onOpenChange, product }: ProductTransferDialogProps) {
  const { toast } = useToast()
  const { createTransfer } = useProducts()
  const { currentUser, currentLocation } = useAuth()
  const { locations, getLocationById } = useLocations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to get preferred location ID (prefer new clean IDs)
  const getPreferredLocationId = () => {
    if (currentLocation && currentLocation !== "all") {
      return currentLocation
    }

    // Prefer new clean location IDs over old ones
    const preferredLocationIds = ['loc1', 'loc2', 'loc3', 'home', 'online']
    const preferredLocation = locations.find(loc => preferredLocationIds.includes(loc.id))

    if (preferredLocation) {
      return preferredLocation.id
    }

    // Fallback to first available location
    return locations.length > 0 ? locations[0].id : ""
  }

  const [formData, setFormData] = useState({
    fromLocationId: getPreferredLocationId(),
    toLocationId: "",
    quantity: 0,
    notes: "",
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      fromLocationId: getPreferredLocationId(),
      toLocationId: "",
      quantity: 0,
      notes: "",
    })
  }

  // Get stock available at a specific location
  const getLocationStock = (product: Product, locationId: string): number => {
    if (product.locations && product.locations.length > 0) {
      // Debug logging to see the actual data structure
      console.log('getLocationStock - Product locations:', product.locations)
      console.log('getLocationStock - Looking for locationId:', locationId)

      // Try direct match first
      let locationStock = product.locations.find(loc => loc.locationId === locationId)

      // If not found, try matching by location name (fallback for duplicate locations)
      if (!locationStock) {
        const selectedLocation = getLocationById(locationId)
        if (selectedLocation) {
          console.log('getLocationStock - Trying to match by location name:', selectedLocation.name)

          // Find a product location that matches the selected location name
          // This handles cases where there are duplicate locations with different IDs
          locationStock = product.locations.find(loc => {
            const productLocationId = loc.locationId
            const productLocation = getLocationById(productLocationId)
            if (productLocation) {
              const nameMatch = productLocation.name.toLowerCase().trim() === selectedLocation.name.toLowerCase().trim()
              console.log(`getLocationStock - Comparing "${productLocation.name}" with "${selectedLocation.name}": ${nameMatch}`)
              return nameMatch
            }
            return false
          })
        }
      }

      console.log('getLocationStock - Found location stock:', locationStock)
      const stock = locationStock?.stock || 0
      console.log('getLocationStock - Returning stock:', stock)
      return stock
    }
    console.log('getLocationStock - No locations found for product')
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsSubmitting(true)

    try {
      // Validate locations are available
      if (filteredLocations.length === 0) {
        toast({
          variant: "destructive",
          title: "No locations available",
          description: "Please ensure locations are properly configured before creating transfers.",
        })
        return
      }

      // Validate transfer
      if (formData.fromLocationId === formData.toLocationId) {
        toast({
          variant: "destructive",
          title: "Invalid transfer",
          description: "Source and destination locations cannot be the same.",
        })
        return
      }

      if (formData.quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid quantity",
          description: "Transfer quantity must be greater than 0.",
        })
        return
      }

      // Check available stock at the source location
      const availableStock = getLocationStock(product, formData.fromLocationId)
      if (formData.quantity > availableStock) {
        toast({
          variant: "destructive",
          title: "Insufficient stock",
          description: `Only ${availableStock} units available at source location.`,
        })
        return
      }

      // Create transfer
      const transfer = await createTransfer({
        productId: product.id,
        productName: product.name,
        fromLocationId: formData.fromLocationId,
        toLocationId: formData.toLocationId,
        quantity: formData.quantity,
        status: 'pending',
        notes: formData.notes,
        createdBy: currentUser?.id || "system",
      })

      // Note: Toast is now handled in the createTransfer function

      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Failed to create transfer:", error)

      // Extract more specific error message
      let errorMessage = "Failed to create transfer. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter locations to show only active locations (excluding online-only locations for physical transfers)
  const filteredLocations = locations.filter(loc => {
    console.log('Filtering location:', {
      id: loc.id,
      name: loc.name,
      status: loc.status,
      hasName: !!loc.name,
      nameNotEmpty: loc.name && loc.name.trim() !== '',
      notOnline: loc.id !== 'online'
    })

    return (
      loc.status === 'Active' &&
      loc.name &&
      loc.name.trim() !== '' &&
      loc.id !== 'online' // Exclude online store from physical transfers
    )
  })

  const fromLocation = getLocationById(formData.fromLocationId)
  const toLocation = getLocationById(formData.toLocationId)

  // Debug logging for location issues
  React.useEffect(() => {
    console.log('Transfer Dialog - Available locations:', locations.length)
    console.log('Transfer Dialog - Raw locations:', locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      status: loc.status
    })))
    console.log('Transfer Dialog - Filtered locations:', filteredLocations.length)
    console.log('Transfer Dialog - Filtered location IDs:', filteredLocations.map(loc => ({ id: loc.id, name: loc.name, status: loc.status })))

    if (filteredLocations.length === 0) {
      console.warn('Transfer Dialog - No locations available for transfer. Check location data and filtering.')
      console.warn('Transfer Dialog - First location sample:', locations[0])
    }
  }, [locations, filteredLocations])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transfer Product</DialogTitle>
          <DialogDescription>
            Move inventory between salon locations. This will create a transfer request that needs to be approved.
          </DialogDescription>
        </DialogHeader>

        {product && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{product.name}</span>
                <Badge variant="outline">{product.sku}</Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Category: {product.category}</span>
                <span>Total Stock: {product.locations?.reduce((total, loc) => total + (loc.stock || 0), 0) || 0} units</span>
              </div>
              {formData.fromLocationId && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Available at source:</span>
                  <span className="font-medium">{getLocationStock(product, formData.fromLocationId)} units</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromLocation">From Location *</Label>
              <Select
                value={formData.fromLocationId}
                onValueChange={(value) => handleChange("fromLocationId", value)}
              >
                <SelectTrigger id="fromLocation">
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-locations" disabled>
                      No locations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toLocation">To Location *</Label>
              <Select
                value={formData.toLocationId}
                onValueChange={(value) => handleChange("toLocationId", value)}
              >
                <SelectTrigger id="toLocation">
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.filter(loc => loc.id !== formData.fromLocationId).length > 0 ? (
                    filteredLocations
                      .filter(loc => loc.id !== formData.fromLocationId)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="no-destinations" disabled>
                      {formData.fromLocationId ? "No other locations available" : "Select source location first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fromLocation && toLocation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{fromLocation.name}</div>
                      <div className="text-muted-foreground">{fromLocation.address}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-medium">{toLocation.name}</div>
                      <div className="text-muted-foreground">{toLocation.address}</div>
                    </div>
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Transfer *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                handleChange("quantity", value)
              }}
              required
              placeholder="Enter quantity"
              className={
                product && formData.fromLocationId && formData.quantity > getLocationStock(product, formData.fromLocationId)
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {product && formData.fromLocationId && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Available at source location: {getLocationStock(product, formData.fromLocationId)} units
                </p>
                {formData.quantity > getLocationStock(product, formData.fromLocationId) && (
                  <p className="text-sm text-red-600">
                    ⚠️ Quantity exceeds available stock ({getLocationStock(product, formData.fromLocationId)} units available)
                  </p>
                )}
                {formData.quantity <= 0 && (
                  <p className="text-sm text-red-600">
                    ⚠️ Quantity must be greater than 0
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              placeholder="Add any notes about this transfer..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.toLocationId ||
                formData.quantity <= 0 ||
                (product && formData.fromLocationId && formData.quantity > getLocationStock(product, formData.fromLocationId))
              }
            >
              {isSubmitting ? "Creating Transfer..." : "Create Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
