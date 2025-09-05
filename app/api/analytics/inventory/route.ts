import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")

    console.log(`🔄 Calculating inventory analytics for location: ${locationId || 'all'}`)

    // Build the where clause for location filtering
    const whereClause: any = {
      isActive: true,
      product: {
        isActive: true
      }
    }

    if (locationId && locationId !== 'all') {
      whereClause.locationId = locationId
    }

    // Get all product-location relationships with product details
    const productLocations = await prisma.productLocation.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            cost: true,
            price: true,
            category: true,
            isRetail: true,

          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`📦 Found ${productLocations.length} product-location relationships`)

    // Calculate inventory metrics
    let totalInventoryValue = 0
    let totalInventoryItems = 0
    let lowStockItems = 0
    let outOfStockItems = 0
    let totalCostBasis = 0
    let totalRetailValue = 0

    const productMetrics = new Map<string, {
      name: string
      category: string
      totalStock: number
      totalValue: number
      totalCost: number
      locations: number
      isLowStock: boolean
      isOutOfStock: boolean
    }>()

    for (const productLocation of productLocations) {
      const { product, stock } = productLocation
      const cost = parseFloat(product.cost?.toString() || '0')
      const price = parseFloat(product.price?.toString() || '0')
      const minStock = 5 // Default minimum stock level

      // Calculate values
      const itemValue = stock * cost
      const retailValue = stock * price

      totalInventoryValue += itemValue
      totalCostBasis += itemValue
      totalRetailValue += retailValue
      totalInventoryItems += stock

      // Check stock levels
      if (stock === 0) {
        outOfStockItems++
      } else if (stock <= minStock) {
        lowStockItems++
      }

      // Aggregate by product
      const productKey = product.id
      if (!productMetrics.has(productKey)) {
        productMetrics.set(productKey, {
          name: product.name,
          category: product.category,
          totalStock: 0,
          totalValue: 0,
          totalCost: 0,
          locations: 0,
          isLowStock: false,
          isOutOfStock: false
        })
      }

      const productMetric = productMetrics.get(productKey)!
      productMetric.totalStock += stock
      productMetric.totalValue += itemValue
      productMetric.totalCost += itemValue
      productMetric.locations += 1
      
      if (stock === 0) {
        productMetric.isOutOfStock = true
      } else if (stock <= minStock) {
        productMetric.isLowStock = true
      }
    }

    // Calculate turnover rate (simplified - would need sales data for accurate calculation)
    const estimatedTurnoverRate = totalInventoryValue > 0 ? 6.2 : 0 // Mock value for now

    // Get top products by value
    const topProductsByValue = Array.from(productMetrics.entries())
      .map(([id, metrics]) => ({
        productId: id,
        name: metrics.name,
        category: metrics.category,
        totalStock: metrics.totalStock,
        totalValue: metrics.totalValue,
        locations: metrics.locations
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10)

    // Get low stock products
    const lowStockProducts = Array.from(productMetrics.entries())
      .filter(([_, metrics]) => metrics.isLowStock && !metrics.isOutOfStock)
      .map(([id, metrics]) => ({
        productId: id,
        name: metrics.name,
        category: metrics.category,
        totalStock: metrics.totalStock,
        totalValue: metrics.totalValue
      }))
      .slice(0, 10)

    // Get out of stock products
    const outOfStockProducts = Array.from(productMetrics.entries())
      .filter(([_, metrics]) => metrics.isOutOfStock)
      .map(([id, metrics]) => ({
        productId: id,
        name: metrics.name,
        category: metrics.category,
        totalValue: metrics.totalValue
      }))
      .slice(0, 10)

    const analytics = {
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalRetailValue: Math.round(totalRetailValue * 100) / 100,
      totalInventoryItems,
      lowStockItemsCount: lowStockItems,
      outOfStockItemsCount: outOfStockItems,
      turnoverRate: estimatedTurnoverRate,
      uniqueProducts: productMetrics.size,
      averageValuePerItem: totalInventoryItems > 0 ? Math.round((totalInventoryValue / totalInventoryItems) * 100) / 100 : 0,
      potentialProfit: Math.round((totalRetailValue - totalCostBasis) * 100) / 100,
      profitMargin: totalRetailValue > 0 ? Math.round(((totalRetailValue - totalCostBasis) / totalRetailValue) * 100 * 100) / 100 : 0,
      topProductsByValue,
      lowStockProducts,
      outOfStockProducts,
      lastCalculated: new Date().toISOString()
    }

    console.log(`✅ Inventory analytics calculated:`, {
      totalValue: analytics.totalInventoryValue,
      totalItems: analytics.totalInventoryItems,
      lowStock: analytics.lowStockItemsCount,
      outOfStock: analytics.outOfStockItemsCount
    })

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error("❌ Error calculating inventory analytics:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to calculate inventory analytics" 
    }, { status: 500 })
  }
}
