import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface LocationAdjustment {
  locationId: string
  currentStock: number
  newStock: number
  adjustment: number
  operation: 'add' | 'remove' | 'set'
}

interface RequestData {
  productId: string
  adjustments: LocationAdjustment[]
  reason: string
  notes?: string
}

export async function GET() {
  return NextResponse.json({
    message: "Multi-location inventory adjustment API is working",
    timestamp: new Date().toISOString(),
    methods: ["POST"],
    requiredFields: ["productId", "adjustments", "reason"],
    adjustmentFields: ["locationId", "currentStock", "newStock", "adjustment", "operation"]
  })
}

export async function POST(request: Request) {
  console.log("🔄 Starting multi-location inventory adjustment API call...")

  try {
    const data: RequestData = await request.json()
    console.log("📥 Received adjustment data:", {
      productId: data.productId,
      adjustmentCount: data.adjustments?.length,
      reason: data.reason,
      hasNotes: !!data.notes
    })

    // Validate required fields
    if (!data.productId || !data.adjustments || !Array.isArray(data.adjustments) || !data.reason) {
      console.error("❌ Missing required fields")
      return NextResponse.json({ 
        error: "Missing required fields: productId, adjustments, reason" 
      }, { status: 400 })
    }

    if (data.adjustments.length === 0) {
      console.error("❌ No adjustments provided")
      return NextResponse.json({ 
        error: "At least one adjustment is required" 
      }, { status: 400 })
    }

    // Validate each adjustment
    for (const adjustment of data.adjustments) {
      if (!adjustment.locationId || typeof adjustment.newStock !== 'number' || !adjustment.operation) {
        console.error("❌ Invalid adjustment data:", adjustment)
        return NextResponse.json({ 
          error: "Each adjustment must have locationId, newStock, and operation" 
        }, { status: 400 })
      }

      if (adjustment.newStock < 0) {
        console.error("❌ Negative stock not allowed:", adjustment)
        return NextResponse.json({ 
          error: `Negative stock not allowed for location ${adjustment.locationId}` 
        }, { status: 400 })
      }
    }

    const productId = data.productId

    // Check if product exists
    console.log("🔍 Looking for product:", productId)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        locations: true
      }
    })

    if (!product) {
      console.error("❌ Product not found:", productId)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("✅ Found product:", product.name)

    // Verify all locations exist
    const locationIds = data.adjustments.map(adj => adj.locationId)
    const locations = await prisma.location.findMany({
      where: { 
        id: { in: locationIds },
        isActive: true 
      }
    })

    if (locations.length !== locationIds.length) {
      const foundLocationIds = locations.map(loc => loc.id)
      const missingLocationIds = locationIds.filter(id => !foundLocationIds.includes(id))
      console.error("❌ Some locations not found:", missingLocationIds)
      return NextResponse.json({ 
        error: `Locations not found: ${missingLocationIds.join(', ')}` 
      }, { status: 404 })
    }

    console.log("✅ All locations verified")

    // Process adjustments in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const adjustmentResults = []

      for (const adjustment of data.adjustments) {
        console.log(`🔄 Processing adjustment for location ${adjustment.locationId}...`)

        // Get or create product location record
        let productLocation = await tx.productLocation.findUnique({
          where: {
            productId_locationId: {
              productId: productId,
              locationId: adjustment.locationId
            }
          }
        })

        if (!productLocation) {
          console.log("📝 Creating new product-location record...")
          productLocation = await tx.productLocation.create({
            data: {
              productId: productId,
              locationId: adjustment.locationId,
              stock: 0,
              isActive: true
            }
          })
        }

        const previousStock = productLocation.stock
        const newStock = adjustment.newStock

        console.log(`📊 Stock update for location ${adjustment.locationId}:`, {
          previousStock,
          newStock,
          operation: adjustment.operation,
          change: newStock - previousStock
        })

        // Update the stock level
        const updatedProductLocation = await tx.productLocation.update({
          where: {
            productId_locationId: {
              productId: productId,
              locationId: adjustment.locationId
            }
          },
          data: {
            stock: newStock,
            updatedAt: new Date()
          },
          include: {
            location: true
          }
        })

        // Create audit trail record
        await tx.inventoryAudit.create({
          data: {
            productId: productId,
            locationId: adjustment.locationId,
            adjustmentType: adjustment.operation,
            previousStock: previousStock,
            newStock: newStock,
            quantity: Math.abs(newStock - previousStock),
            reason: data.reason,
            notes: data.notes || `Multi-location adjustment: ${adjustment.operation} operation`,
            userId: "system", // TODO: Get actual user ID from auth
          }
        })

        adjustmentResults.push({
          locationId: adjustment.locationId,
          locationName: updatedProductLocation.location.name,
          previousStock,
          newStock,
          change: newStock - previousStock,
          operation: adjustment.operation
        })

        console.log(`✅ Completed adjustment for location ${adjustment.locationId}`)
      }

      return adjustmentResults
    })

    console.log("✅ All adjustments completed successfully!")

    // Calculate summary
    const totalPreviousStock = results.reduce((sum, result) => sum + result.previousStock, 0)
    const totalNewStock = results.reduce((sum, result) => sum + result.newStock, 0)
    const totalChange = totalNewStock - totalPreviousStock

    return NextResponse.json({
      success: true,
      message: `Stock adjusted successfully for ${results.length} location(s)`,
      productId: productId,
      productName: product.name,
      adjustments: results,
      summary: {
        locationsUpdated: results.length,
        totalPreviousStock,
        totalNewStock,
        totalChange
      },
      auditTrail: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error in multi-location stock adjustment:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    return NextResponse.json({
      error: "Internal server error during stock adjustment",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
