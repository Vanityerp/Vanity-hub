"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocations } from "@/lib/location-provider"
import { ChevronDown, ChevronRight, MapPin } from "lucide-react"
import type { Product } from "@/lib/types"

interface LocationStockDisplayProps {
  product: Product
  getProductStock: (product: Product) => number
  getMinStock: (product: Product) => number
  compact?: boolean
}

export function LocationStockDisplay({ 
  product, 
  getProductStock, 
  getMinStock, 
  compact = false 
}: LocationStockDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { locations, getLocationName } = useLocations()

  // Calculate total stock across all locations
  const totalStock = getProductStock(product)
  const minStock = getMinStock(product)
  const isLowStock = totalStock < minStock

  // Get location-specific stock data
  const locationStocks = product.locations || []
  const hasLocationData = locationStocks.length > 0

  // If no location data, show traditional stock display
  if (!hasLocationData) {
    return (
      <Badge
        variant={isLowStock ? "destructive" : "outline"}
        className="w-16"
      >
        {totalStock}
      </Badge>
    )
  }

  // Compact view for smaller displays
  if (compact) {
    return (
      <div className="space-y-1">
        <Badge
          variant={isLowStock ? "destructive" : "outline"}
          className="w-16"
        >
          {totalStock}
        </Badge>
        <div className="text-xs text-gray-500">
          {locationStocks.length} location{locationStocks.length !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }

  // Full expandable view
  return (
    <div className="space-y-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-1 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge
                  variant={isLowStock ? "destructive" : "outline"}
                  className="w-12 text-xs"
                >
                  {totalStock}
                </Badge>
                <span className="text-xs text-gray-500">
                  {locationStocks.length} loc
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-1">
          <Card className="border-gray-200">
            <CardContent className="p-2 space-y-1">
              {locationStocks.map((locationStock) => {
                const location = locations.find(loc => loc.id === locationStock.locationId)
                const locationName = location?.name || getLocationName(locationStock.locationId)
                const stock = locationStock.stock || 0
                const isLocationLowStock = stock < (minStock / locationStocks.length) // Distribute min stock across locations
                
                return (
                  <div key={locationStock.locationId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 truncate max-w-[80px]" title={locationName}>
                        {locationName}
                      </span>
                    </div>
                    <Badge
                      variant={stock === 0 ? "destructive" : isLocationLowStock ? "secondary" : "outline"}
                      className="text-xs px-1 py-0 h-5 min-w-[24px]"
                    >
                      {stock}
                    </Badge>
                  </div>
                )
              })}
              
              {/* Show locations with 0 stock if they exist */}
              {locations
                .filter(location => 
                  location.status === 'Active' && 
                  !locationStocks.some(ls => ls.locationId === location.id)
                )
                .slice(0, 3) // Limit to 3 to avoid clutter
                .map((location) => (
                  <div key={location.id} className="flex items-center justify-between text-xs opacity-60">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500 truncate max-w-[80px]" title={location.name}>
                        {location.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-5 min-w-[24px] opacity-60">
                      0
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Alternative horizontal layout for wider displays
export function LocationStockHorizontal({ 
  product, 
  getProductStock, 
  getMinStock 
}: LocationStockDisplayProps) {
  const { locations, getLocationName } = useLocations()
  
  const totalStock = getProductStock(product)
  const minStock = getMinStock(product)
  const isLowStock = totalStock < minStock
  const locationStocks = product.locations || []

  if (locationStocks.length === 0) {
    return (
      <Badge
        variant={isLowStock ? "destructive" : "outline"}
        className="w-16"
      >
        {totalStock}
      </Badge>
    )
  }

  return (
    <div className="space-y-1">
      {/* Total stock */}
      <div className="flex items-center justify-center">
        <Badge
          variant={isLowStock ? "destructive" : "outline"}
          className="w-16 font-medium"
        >
          {totalStock}
        </Badge>
      </div>
      
      {/* Location breakdown */}
      <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
        {locationStocks.slice(0, 4).map((locationStock) => {
          const location = locations.find(loc => loc.id === locationStock.locationId)
          const locationName = location?.name || getLocationName(locationStock.locationId)
          const stock = locationStock.stock || 0
          const shortName = locationName.split(' ')[0].substring(0, 3) // First 3 chars of first word
          
          return (
            <div key={locationStock.locationId} className="text-xs" title={`${locationName}: ${stock} units`}>
              <Badge 
                variant="outline" 
                className="text-xs px-1 py-0 h-4 min-w-[20px] bg-gray-50"
              >
                {stock}
              </Badge>
            </div>
          )
        })}
        {locationStocks.length > 4 && (
          <div className="text-xs text-gray-500" title={`+${locationStocks.length - 4} more locations`}>
            +{locationStocks.length - 4}
          </div>
        )}
      </div>
    </div>
  )
}
