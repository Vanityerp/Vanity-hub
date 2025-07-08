import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Debug endpoint to check product data
export async function GET() {
  try {
    console.log('🔍 Debug: Fetching products...')
    
    const products = await prisma.product.findMany({
      include: {
        locations: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Debug: Found ${products.length} products`)
    
    // Transform products to parse JSON fields
    const transformedProducts = products.map(product => {
      const safeParseJSON = (jsonString: string | null, fallback: any = []) => {
        if (!jsonString) return fallback
        try {
          return JSON.parse(jsonString)
        } catch (error) {
          console.warn(`Failed to parse JSON: ${jsonString}`, error)
          return fallback
        }
      }

      return {
        ...product,
        images: safeParseJSON(product.images, []),
        features: safeParseJSON(product.features, []),
        ingredients: safeParseJSON(product.ingredients, []),
        howToUse: safeParseJSON(product.howToUse, [])
      }
    })
    
    // Debug info
    const debugInfo = {
      totalProducts: transformedProducts.length,
      retailProducts: transformedProducts.filter(p => p.isRetail === true).length,
      professionalProducts: transformedProducts.filter(p => p.isRetail === false).length,
      activeProducts: transformedProducts.filter(p => p.isActive === true).length,
      inactiveProducts: transformedProducts.filter(p => p.isActive === false).length,
      productDetails: transformedProducts.map(p => ({
        name: p.name,
        isRetail: p.isRetail,
        isRetailType: typeof p.isRetail,
        isActive: p.isActive,
        isActiveType: typeof p.isActive,
        totalStock: p.locations.reduce((sum, loc) => sum + loc.stock, 0)
      }))
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      products: transformedProducts
    })
  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch debug data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
