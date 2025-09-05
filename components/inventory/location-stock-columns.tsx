"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { TableCell } from "@/components/ui/table"
import { useLocations } from "@/lib/location-provider"
import type { Product } from "@/lib/types"

interface LocationStockColumnsProps {
  product: Product
  getMinStock: (product: Product) => number
}

export function LocationStockColumns({ product, getMinStock }: LocationStockColumnsProps) {
  const { getActiveLocations } = useLocations()
  const minStock = getMinStock(product)
  const locationStocks = product.locations || []

  // Get active locations from the database
  const activeLocations = getActiveLocations()

  // Define the expected location order for retail display
  const expectedLocationNames = ['D-Ring Road', 'Muaither', 'Medinat Khalifa', 'Online Store']

  // Sort locations to match the expected order, with any additional locations at the end
  const sortedLocations = [...activeLocations].sort((a, b) => {
    const aIndex = expectedLocationNames.indexOf(a.name)
    const bIndex = expectedLocationNames.indexOf(b.name)

    // If both locations are in expected list, sort by their expected order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only one is in expected list, prioritize it
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    // If neither is in expected list, sort alphabetically
    return a.name.localeCompare(b.name)
  })

  // Helper function to get stock for a specific location
  const getLocationStock = (locationId: string): number => {
    const locationStock = locationStocks.find(ls => ls.locationId === locationId)
    return locationStock?.stock || 0
  }

  // Helper function to check if a location has stock data for this product
  const hasLocationStockData = (locationId: string): boolean => {
    return locationStocks.some(ls => ls.locationId === locationId)
  }

  // Helper function to determine badge variant based on stock level
  const getStockVariant = (stock: number, minStock: number, locationCount: number, hasData: boolean) => {
    if (!hasData) return "outline" // Gray for no data
    if (stock === 0) return "destructive" // Red for out of stock
    // Distribute min stock across locations for low stock warning
    const minStockPerLocation = locationCount > 0 ? Math.ceil(minStock / locationCount) : minStock
    if (stock < minStockPerLocation) return "secondary" // Yellow for low stock
    return "outline" // Default for normal stock
  }

  return (
    <>
      {sortedLocations.map((location) => {
        const stock = getLocationStock(location.id)
        const hasData = hasLocationStockData(location.id)
        const variant = getStockVariant(stock, minStock, sortedLocations.length, hasData)

        return (
          <TableCell key={location.id} className="text-center">
            <Badge
              variant={variant}
              className={`w-12 text-xs font-medium ${!hasData ? 'opacity-60' : ''}`}
              title={hasData
                ? `${location.name}: ${stock} units`
                : `${location.name}: No stock data available`
              }
            >
              {hasData ? stock : '-'}
            </Badge>
          </TableCell>
        )
      })}
    </>
  )
}

// Alternative component that shows total stock with location breakdown tooltip
export function LocationStockWithTotal({ product, getMinStock }: LocationStockColumnsProps) {
  const { getActiveLocations } = useLocations()
  const minStock = getMinStock(product)
  const locationStocks = product.locations || []
  const activeLocations = getActiveLocations()

  // Calculate total stock across all locations
  const totalStock = locationStocks.reduce((total, ls) => total + (ls.stock || 0), 0)
  const isLowStock = totalStock < minStock

  // Create tooltip text with location breakdown
  const locationBreakdown = activeLocations.map(location => {
    const locationStock = locationStocks.find(ls => ls.locationId === location.id)
    const stock = locationStock?.stock || 0
    const hasData = !!locationStock
    const shortName = location.name.split(' ')[0].substring(0, 3) // First 3 chars of first word
    return `${shortName}: ${hasData ? stock : 'N/A'}`
  }).join(', ')

  return (
    <TableCell className="text-center">
      <div className="space-y-1">
        <Badge
          variant={isLowStock ? "destructive" : "outline"}
          className="w-16 font-medium"
          title={`Total: ${totalStock} units\nBreakdown: ${locationBreakdown}`}
        >
          {totalStock}
        </Badge>
        <div className="text-xs text-gray-500 truncate max-w-[80px]" title={locationBreakdown}>
          {locationBreakdown}
        </div>
      </div>
    </TableCell>
  )
}

// Component for displaying location stock in a compact grid format
export function LocationStockGrid({ product, getMinStock }: LocationStockColumnsProps) {
  const { getActiveLocations } = useLocations()
  const minStock = getMinStock(product)
  const locationStocks = product.locations || []
  const activeLocations = getActiveLocations()

  return (
    <TableCell className="text-center">
      <div className="grid grid-cols-2 gap-1 max-w-[100px] mx-auto">
        {activeLocations.map((location) => {
          const locationStock = locationStocks.find(ls => ls.locationId === location.id)
          const stock = locationStock?.stock || 0
          const hasData = !!locationStock
          const minStockPerLocation = activeLocations.length > 0 ? Math.ceil(minStock / activeLocations.length) : minStock
          const variant = !hasData ? "outline" :
                        stock === 0 ? "destructive" :
                        stock < minStockPerLocation ? "secondary" : "outline"

          // Create short name from location name
          const shortName = location.name.split(' ')[0].substring(0, 4)

          return (
            <div key={location.id} className="text-center">
              <div className="text-xs text-gray-500 truncate" title={location.name}>
                {shortName}
              </div>
              <Badge
                variant={variant}
                className={`w-8 h-5 text-xs p-0 justify-center ${!hasData ? 'opacity-60' : ''}`}
                title={hasData
                  ? `${location.name}: ${stock} units`
                  : `${location.name}: No stock data available`
                }
              >
                {hasData ? stock : '-'}
              </Badge>
            </div>
          )
        })}
      </div>
    </TableCell>
  )
}
