import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/inventory/add-stock-all-locations - Add stock to all locations for all products
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { stockToAdd = 10 } = data

    console.log(`🔄 Adding ${stockToAdd} stock to all locations for all products...`)

    // Get all active locations that have existing product relationships
    // This excludes special locations like "Home service" and "Online store"
    const locationsWithProducts = await prisma.location.findMany({
      where: {
        isActive: true,
        products: {
          some: {}
        }
      },
      select: { id: true, name: true }
    })

    const targetLocations = locationsWithProducts.map(loc => loc.id)

    // Use a database transaction to ensure atomicity with extended timeout
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all active products
      const products = await tx.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })

      console.log(`📦 Found ${products.length} active products`)

      // 2. Verify all target locations exist
      const locations = await tx.location.findMany({
        where: { 
          id: { in: targetLocations },
          isActive: true 
        },
        select: { id: true, name: true }
      })

      console.log(`📍 Found ${locations.length} target locations:`, locations.map(l => l.name).join(', '))

      if (locations.length !== targetLocations.length) {
        const missingLocations = targetLocations.filter(id => !locations.some(l => l.id === id))
        throw new Error(`Missing locations: ${missingLocations.join(', ')}`)
      }

      // 3. Get all existing product-location relationships for target locations
      const existingProductLocations = await tx.productLocation.findMany({
        where: {
          productId: { in: products.map(p => p.id) },
          locationId: { in: locations.map(l => l.id) }
        },
        select: {
          productId: true,
          locationId: true,
          stock: true
        }
      })

      // 4. Prepare batch updates and audit records
      const updates = []
      const auditRecords = []
      const upsertOperations = []

      for (const product of products) {
        for (const location of locations) {
          const existing = existingProductLocations.find(
            pl => pl.productId === product.id && pl.locationId === location.id
          )

          const currentStock = existing?.stock || 0
          const newStock = currentStock + stockToAdd

          // Prepare upsert operation
          upsertOperations.push(
            tx.productLocation.upsert({
              where: {
                productId_locationId: {
                  productId: product.id,
                  locationId: location.id
                }
              },
              update: {
                stock: newStock,
                updatedAt: new Date()
              },
              create: {
                productId: product.id,
                locationId: location.id,
                stock: stockToAdd,
                isActive: true
              }
            })
          )

          updates.push({
            productId: product.id,
            productName: product.name,
            locationId: location.id,
            locationName: location.name,
            previousStock: currentStock,
            newStock: newStock,
            stockAdded: stockToAdd
          })

          auditRecords.push({
            productId: product.id,
            locationId: location.id,
            adjustmentType: 'add',
            quantity: stockToAdd,
            previousStock: currentStock,
            newStock: newStock,
            reason: 'Bulk stock addition to all locations',
            notes: `Added ${stockToAdd} units via bulk operation`,
            userId: 'system',
            timestamp: new Date()
          })
        }
      }

      // 5. Execute all upsert operations
      await Promise.all(upsertOperations)

      // 6. Create all audit records
      await tx.inventoryAudit.createMany({
        data: auditRecords
      })

      console.log(`✅ Updated stock for ${updates.length} product-location combinations`)

      return {
        productsUpdated: products.length,
        locationsUpdated: locations.length,
        totalUpdates: updates.length,
        stockAddedPerLocation: stockToAdd,
        updates: updates,
        locations: locations.map(l => ({ id: l.id, name: l.name }))
      }
    }, {
      timeout: 30000 // 30 second timeout
    })

    console.log(`✅ Bulk stock addition completed successfully`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully added ${stockToAdd} stock to ${result.locationsUpdated} locations for ${result.productsUpdated} products`,
      result: result
    })

  } catch (error) {
    console.error("❌ Error adding stock to all locations:", error)

    let errorMessage = "Failed to add stock to all locations"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
      
      if (error.message.includes("Missing locations")) {
        statusCode = 400
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: statusCode })
  }
}

// GET /api/inventory/add-stock-all-locations - Get current stock summary
export async function GET() {
  try {
    // Get all active locations that have existing product relationships
    const locationsWithProducts = await prisma.location.findMany({
      where: {
        isActive: true,
        products: {
          some: {}
        }
      },
      select: { id: true, name: true }
    })

    const targetLocations = locationsWithProducts.map(loc => loc.id)

    // Get stock summary for all locations
    const stockSummary = await prisma.productLocation.findMany({
      where: {
        locationId: { in: targetLocations },
        product: { isActive: true }
      },
      include: {
        product: {
          select: { id: true, name: true, isRetail: true }
        },
        location: {
          select: { id: true, name: true }
        }
      }
    })

    // Group by location
    const locationSummary = targetLocations.map(locationId => {
      const locationStocks = stockSummary.filter(ps => ps.locationId === locationId)
      const location = locationStocks[0]?.location || { id: locationId, name: 'Unknown' }
      
      return {
        locationId: location.id,
        locationName: location.name,
        totalProducts: locationStocks.length,
        totalStock: locationStocks.reduce((sum, ps) => sum + (ps.stock || 0), 0),
        retailProducts: locationStocks.filter(ps => ps.product.isRetail).length,
        professionalProducts: locationStocks.filter(ps => !ps.product.isRetail).length
      }
    })

    return NextResponse.json({
      summary: locationSummary,
      totalLocations: targetLocations.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error fetching stock summary:", error)
    return NextResponse.json({ error: "Failed to fetch stock summary" }, { status: 500 })
  }
}
