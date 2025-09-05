"use client"

import { useAuth } from "@/lib/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, ShoppingCart } from "lucide-react"

// Mock data - would be replaced with actual API calls
const lowStockProducts = [
  {
    id: "4",
    name: "Hair Color - Brown",
    sku: "HC-002",
    category: "Color",
    stock: 3,
    minStock: 5,
    location: "loc1",
  },
  {
    id: "8",
    name: "Bleach Powder",
    sku: "BP-001",
    category: "Color",
    stock: 7,
    minStock: 10,
    location: "loc1",
  },
  {
    id: "12",
    name: "Nail Polish - Red",
    sku: "NP-001",
    category: "Nail Care",
    stock: 4,
    minStock: 8,
    location: "loc2",
  },
  {
    id: "15",
    name: "Facial Cleanser",
    sku: "FC-001",
    category: "Skin Care",
    stock: 2,
    minStock: 5,
    location: "loc3",
  },
]

export function LowStockAlert() {
  const { currentLocation } = useAuth()

  // Filter products based on location
  const filteredProducts = lowStockProducts.filter(
    (product) => currentLocation === "all" || product.location === currentLocation,
  )

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
        <div className="rounded-full bg-primary/10 p-3 mb-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
        </div>
        <p>All products are adequately stocked</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredProducts.map((product) => (
        <div key={product.id} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="font-medium">{product.name}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {product.stock}/{product.minStock}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Restock
          </Button>
        </div>
      ))}
    </div>
  )
}

