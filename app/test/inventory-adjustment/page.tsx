"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog"
import { Package, Plus, Minus, RefreshCw } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  locations?: Array<{
    id: string
    locationId: string
    stock: number
    location?: {
      id: string
      name: string
    }
  }>
}

export default function InventoryAdjustmentTest() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState("")

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        // Transform products to include stock from first location
        const transformedProducts = data.map((product: any) => ({
          ...product,
          stock: product.locations?.[0]?.stock || 0
        }))
        setProducts(transformedProducts.slice(0, 10)) // Show first 10 products
        setMessage(`✅ Loaded ${transformedProducts.length} products`)
      } else {
        throw new Error("Failed to load products")
      }
    } catch (error) {
      console.error("Error loading products:", error)
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  const handleStockAdjusted = () => {
    // Refresh products after stock adjustment
    loadProducts()
    setMessage("✅ Stock adjusted successfully! Products refreshed.")
  }

  const createTestProduct = async () => {
    try {
      const testProduct = {
        name: `Test Product ${Date.now()}`,
        description: "Test product for inventory adjustment",
        price: 29.99,
        cost: 15.00,
        category: "TESTING",
        type: "Test Product",
        brand: "Test Brand",
        sku: `TEST-${Date.now()}`,
        isRetail: true,
        isActive: true
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testProduct),
      })

      if (response.ok) {
        const newProduct = await response.json()
        setMessage(`✅ Created test product: ${newProduct.name}`)
        loadProducts() // Refresh the list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create test product")
      }
    } catch (error) {
      console.error("Error creating test product:", error)
      setMessage(`❌ Error creating test product: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading products...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Inventory Adjustment Test</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Test the inventory adjustment functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={loadProducts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Products
            </Button>
            <Button onClick={createTestProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Create Test Product
            </Button>
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-700' :
              message.includes('❌') ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products for Testing</CardTitle>
          <CardDescription>
            Click "Adjust Stock" to test the inventory adjustment functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Create a test product to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Price: ${product.price.toFixed(2)} • Stock: {product.stock} units
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                      {product.stock} in stock
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleAdjustStock(product)}
                      className="flex items-center gap-1"
                    >
                      <Package className="h-3 w-3" />
                      Adjust Stock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>💡 Testing Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Adjust Stock" on any product to open the adjustment dialog</li>
          <li>Try both adding and removing stock</li>
          <li>Test different quantities and reasons</li>
          <li>Check that stock levels update correctly after adjustment</li>
          <li>Verify error handling with invalid inputs</li>
        </ul>
      </div>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onStockAdjusted={handleStockAdjusted}
      />
    </div>
  )
}
