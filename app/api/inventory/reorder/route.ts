import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

// POST /api/inventory/reorder - Create a reorder request/purchase order
export async function POST(request: Request) {
  try {
    // Check user session and permissions
    const session = await getServerSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.productId || !data.locationId || !data.quantity) {
      return NextResponse.json({ 
        error: "Missing required fields: productId, locationId, and quantity are required" 
      }, { status: 400 })
    }

    console.log("🔄 Creating reorder request...")

    const { productId, locationId, quantity, urgency = 'normal', notes } = data

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify product and location exist
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { 
          id: true, 
          name: true, 
          sku: true, 
          cost: true,
          category: true,
          minStock: true
        }
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

      // 2. Get current stock level
      const productLocation = await tx.productLocation.findUnique({
        where: {
          productId_locationId: {
            productId,
            locationId
          }
        }
      })

      const currentStock = productLocation?.stock || 0

      // 3. Generate reorder ID
      const reorderCount = await tx.inventoryAudit.count({
        where: {
          reason: {
            startsWith: "REORDER:"
          }
        }
      })
      const reorderId = `RO-${Date.now()}-${(reorderCount + 1).toString().padStart(4, '0')}`

      // 4. Calculate estimated cost
      const estimatedCost = (product.cost || 0) * parseInt(quantity)

      // 5. Create audit record for the reorder request
      await tx.inventoryAudit.create({
        data: {
          productId,
          locationId,
          adjustmentType: "add", // This will be the expected addition
          quantity: parseInt(quantity),
          reason: `REORDER: ${reorderId} - ${urgency.toUpperCase()} priority`,
          notes: notes || `Reorder request for ${product.name} at ${location.name}. Current stock: ${currentStock}, Min stock: ${product.minStock || 5}`,
          performedBy: session.user.email || "Unknown User",
          previousStock: currentStock,
          newStock: currentStock // Will be updated when stock actually arrives
        }
      })

      return {
        reorderId,
        product,
        location,
        requestedQuantity: parseInt(quantity),
        currentStock,
        estimatedCost,
        urgency,
        notes: notes || null
      }
    })

    console.log(`✅ Created reorder request: ${result.reorderId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Reorder request ${result.reorderId} created successfully`,
      reorder: {
        id: result.reorderId,
        productName: result.product.name,
        productSku: result.product.sku,
        locationName: result.location.name,
        requestedQuantity: result.requestedQuantity,
        currentStock: result.currentStock,
        estimatedCost: result.estimatedCost,
        urgency: result.urgency,
        status: "pending",
        createdAt: new Date().toISOString(),
        notes: result.notes
      }
    })

  } catch (error) {
    console.error("❌ Error creating reorder request:", error)
    return NextResponse.json({ 
      error: "Failed to create reorder request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET /api/inventory/reorder - Get reorder history and pending requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const locationId = searchParams.get("locationId")
    const status = searchParams.get("status") || "all"
    const limit = parseInt(searchParams.get("limit") || "50")

    console.log("🔄 Fetching reorder history...")

    // Build where clause for reorder records
    const whereClause: any = {
      reason: {
        startsWith: "REORDER:"
      }
    }

    if (productId) {
      whereClause.productId = productId
    }

    if (locationId) {
      whereClause.locationId = locationId
    }

    const reorderHistory = await prisma.inventoryAudit.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            cost: true
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

    // Transform the data to include reorder-specific information
    const reorders = reorderHistory.map(record => {
      const reasonParts = record.reason.split(' - ')
      const reorderId = reasonParts[0].replace('REORDER: ', '')
      const priority = reasonParts[1]?.replace(' priority', '') || 'normal'
      
      return {
        id: record.id,
        reorderId,
        productName: record.product.name,
        productSku: record.product.sku,
        locationName: record.location.name,
        requestedQuantity: record.quantity,
        estimatedCost: (record.product.cost || 0) * record.quantity,
        priority,
        status: "pending", // In a real system, this would be tracked separately
        createdAt: record.createdAt,
        notes: record.notes,
        performedBy: record.performedBy
      }
    })

    console.log(`✅ Found ${reorders.length} reorder records`)
    return NextResponse.json({ reorders })
  } catch (error) {
    console.error("❌ Error fetching reorder history:", error)
    return NextResponse.json({ error: "Failed to fetch reorder history" }, { status: 500 })
  }
}
