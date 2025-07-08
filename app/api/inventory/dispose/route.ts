import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

// POST /api/inventory/dispose - Mark products for disposal and adjust inventory
export async function POST(request: Request) {
  try {
    // Check user session and permissions
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.productId || !data.locationId || !data.quantity || !data.reason) {
      return NextResponse.json({ 
        error: "Missing required fields: productId, locationId, quantity, and reason are required" 
      }, { status: 400 })
    }

    console.log("🗑️ Processing disposal request...")

    const { productId, locationId, quantity, reason, batchId, notes } = data

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify product and location exist
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, sku: true }
      })

      const location = await tx.location.findUnique({
        where: { id: locationId },
        select: { id: true, name: true }
      })

      if (!product) {
        throw new Error("Product not found")
      }

      if (!location) {
        throw new Error("Location not found")
      }

      // 2. Check current stock level
      const productLocation = await tx.productLocation.findUnique({
        where: {
          productId_locationId: {
            productId,
            locationId
          }
        }
      })

      if (!productLocation) {
        throw new Error("Product not found at this location")
      }

      const currentStock = productLocation.stock
      const disposalQuantity = parseInt(quantity)

      if (disposalQuantity > currentStock) {
        throw new Error(`Cannot dispose ${disposalQuantity} units. Only ${currentStock} units available.`)
      }

      // 3. If batchId is provided, handle batch disposal
      if (batchId) {
        const batch = await tx.productBatch.findUnique({
          where: { id: batchId }
        })

        if (!batch) {
          throw new Error("Batch not found")
        }

        if (batch.productId !== productId || batch.locationId !== locationId) {
          throw new Error("Batch does not match product and location")
        }

        if (disposalQuantity > batch.quantity) {
          throw new Error(`Cannot dispose ${disposalQuantity} units from batch. Only ${batch.quantity} units available in batch.`)
        }

        // Update batch quantity
        await tx.productBatch.update({
          where: { id: batchId },
          data: {
            quantity: batch.quantity - disposalQuantity,
            updatedAt: new Date()
          }
        })
      }

      // 4. Update product location stock
      const newStock = currentStock - disposalQuantity
      await tx.productLocation.update({
        where: {
          productId_locationId: {
            productId,
            locationId
          }
        },
        data: {
          stock: newStock,
          updatedAt: new Date()
        }
      })

      // 5. Create inventory audit record
      await tx.inventoryAudit.create({
        data: {
          productId,
          locationId,
          adjustmentType: "remove",
          quantity: disposalQuantity,
          reason: `DISPOSAL: ${reason}`,
          notes: notes || null,
          performedBy: session.user.email || "Unknown User",
          previousStock: currentStock,
          newStock: newStock
        }
      })

      return {
        product,
        location,
        disposedQuantity: disposalQuantity,
        previousStock: currentStock,
        newStock: newStock,
        batchId: batchId || null
      }
    })

    console.log(`✅ Disposed ${result.disposedQuantity} units of ${result.product.name}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully disposed ${result.disposedQuantity} units of ${result.product.name}`,
      disposal: {
        productName: result.product.name,
        locationName: result.location.name,
        disposedQuantity: result.disposedQuantity,
        previousStock: result.previousStock,
        newStock: result.newStock,
        reason,
        batchId: result.batchId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("❌ Error processing disposal:", error)
    return NextResponse.json({ 
      error: "Failed to process disposal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET /api/inventory/dispose - Get disposal history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const locationId = searchParams.get("locationId")
    const limit = parseInt(searchParams.get("limit") || "50")

    console.log("🔄 Fetching disposal history...")

    // Build where clause for disposal records
    const whereClause: any = {
      reason: {
        startsWith: "DISPOSAL:"
      }
    }

    if (productId) {
      whereClause.productId = productId
    }

    if (locationId) {
      whereClause.locationId = locationId
    }

    const disposalHistory = await prisma.inventoryAudit.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    console.log(`✅ Found ${disposalHistory.length} disposal records`)
    return NextResponse.json({ disposalHistory })
  } catch (error) {
    console.error("❌ Error fetching disposal history:", error)
    return NextResponse.json({ error: "Failed to fetch disposal history" }, { status: 500 })
  }
}
