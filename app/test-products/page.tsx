"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProducts } from "@/lib/product-provider"


export default function TestProductsPage() {
  const { addProduct, products, getRetailProducts, fixRetailProducts, ensureShopIntegration, refreshShop } = useProducts()
  const [isAdding, setIsAdding] = useState(false)

  const addTestExtensionsProduct = async () => {
    setIsAdding(true)
    try {
      const product = addProduct({
        name: "Test Human Hair Extensions",
        description: "Premium quality human hair extensions for testing",
        price: 120,
        category: "Extensions",
        type: "Human Hair",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        stock: 15,
        minStock: 3,
        sku: `TEST-EXT-${Date.now()}`,
        isRetail: true,
        isActive: true,
        location: "Main Location"
      })

      console.log("✅ Test Extensions product added:", product)
    } catch (error) {
      console.error("❌ Error adding test product:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const addTestNailCareProduct = async () => {
    setIsAdding(true)
    try {
      const product = addProduct({
        name: "Test Professional Nail Polish",
        description: "High-quality nail polish for professional use",
        price: 25,
        category: "Nail Care",
        type: "Nail Polish",
        image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        stock: 30,
        minStock: 5,
        sku: `TEST-NAIL-${Date.now()}`,
        isRetail: true,
        isActive: true,
        location: "Main Location"
      })

      console.log("✅ Test Nail Care product added:", product)
    } catch (error) {
      console.error("❌ Error adding test product:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const runTests = () => {
    console.log("🧪 === RUNNING PRODUCT TESTS ===")

    const allProducts = products
    const retailProducts = getRetailProducts()

    console.log("📦 Total products:", allProducts.length)
    console.log("🛒 Retail products:", retailProducts.length)

    // Test Extensions products
    const extensionsProducts = allProducts.filter(p => p.category === "Extensions")
    const extensionsRetail = extensionsProducts.filter(p => p.isRetail && p.isActive !== false)

    console.log("🔗 Extensions products:", extensionsProducts.length, "retail:", extensionsRetail.length)
    extensionsProducts.forEach(p => {
      console.log(`  - ${p.name}: retail=${p.isRetail}, active=${p.isActive}`)
    })

    // Test Nail Care products
    const nailCareProducts = allProducts.filter(p => p.category === "Nail Care")
    const nailCareRetail = nailCareProducts.filter(p => p.isRetail && p.isActive !== false)

    console.log("💅 Nail Care products:", nailCareProducts.length, "retail:", nailCareRetail.length)
    nailCareProducts.forEach(p => {
      console.log(`  - ${p.name}: retail=${p.isRetail}, active=${p.isActive}`)
    })

    // Check if products appear in retail list
    const extensionsInRetail = retailProducts.filter(p => p.category === "Extensions")
    const nailCareInRetail = retailProducts.filter(p => p.category === "Nail Care")

    console.log("✅ Extensions in retail list:", extensionsInRetail.length)
    console.log("✅ Nail Care in retail list:", nailCareInRetail.length)

    if (extensionsInRetail.length === 0 && extensionsProducts.length > 0) {
      console.log("❌ Extensions products exist but not showing in retail!")
    }

    if (nailCareInRetail.length === 0 && nailCareProducts.length > 0) {
      console.log("❌ Nail Care products exist but not showing in retail!")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Testing Page</h1>
          <p className="text-gray-600">Test product visibility in Extensions and Nail Care categories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Test Products</CardTitle>
              <CardDescription>
                Add test products to Extensions and Nail Care categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={addTestExtensionsProduct}
                disabled={isAdding}
                className="w-full"
              >
                {isAdding ? "Adding..." : "Add Test Extensions Product"}
              </Button>

              <Button
                onClick={addTestNailCareProduct}
                disabled={isAdding}
                className="w-full"
                variant="outline"
              >
                {isAdding ? "Adding..." : "Add Test Nail Care Product"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test & Debug</CardTitle>
              <CardDescription>
                Run tests and fix any issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runTests} className="w-full" variant="outline">
                🧪 Run Product Tests
              </Button>

              <Button
                onClick={() => {
                  const fixed = fixRetailProducts()
                  if (fixed) {
                    console.log("✅ Products fixed!")
                  } else {
                    console.log("ℹ️ No products needed fixing")
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                🔧 Fix Product Retail Status
              </Button>

              <Button
                onClick={() => {
                  console.log("🔄 Ensuring shop integration...")
                  const retailProducts = ensureShopIntegration()
                  console.log(`✅ Shop integration complete: ${retailProducts.length} retail products`)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                🔄 Ensure Shop Integration
              </Button>

              <Button
                onClick={() => {
                  console.log("🔄 Refreshing shop...")
                  refreshShop()
                  console.log("✅ Shop refresh complete")
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                🛒 Refresh Shop
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard/inventory" target="_blank">
                  📦 Open Inventory Page
                </a>
              </Button>

              <Button asChild variant="outline">
                <a href="/client-portal/shop" target="_blank">
                  🛒 Open Shop Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
