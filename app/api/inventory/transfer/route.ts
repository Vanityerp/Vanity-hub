import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/inventory/transfer - Create an atomic transfer between locations
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.productId || !data.fromLocationId || !data.toLocationId || !data.quantity) {
      return NextResponse.json({
        error: "Missing required fields: productId, fromLocationId, toLocationId, and quantity are required"
      }, { status: 400 })
    }

    if (data.quantity <= 0) {
      return NextResponse.json({
        error: "Quantity must be greater than 0"
      }, { status: 400 })
    }

    if (data.fromLocationId === data.toLocationId) {
      return NextResponse.json({
        error: "Source and destination locations cannot be the same"
      }, { status: 400 })
    }

    // Use a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify the product exists
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: { id: true, name: true, isActive: true }
      })

      if (!product) {
        throw new Error("Product not found")
      }

      if (!product.isActive) {
        throw new Error("Cannot transfer inactive product")
      }

      // 2. Verify both locations exist
      const [fromLocation, toLocation] = await Promise.all([
        tx.location.findUnique({
          where: { id: data.fromLocationId },
          select: { id: true, name: true, isActive: true }
        }),
        tx.location.findUnique({
          where: { id: data.toLocationId },
          select: { id: true, name: true, isActive: true }
        })
      ])

      if (!fromLocation) {
        throw new Error("Source location not found")
      }

      if (!toLocation) {
        throw new Error("Destination location not found")
      }

      if (!fromLocation.isActive) {
        throw new Error("Source location is inactive")
      }

      if (!toLocation.isActive) {
        throw new Error("Destination location is inactive")
      }

      // 3. Get current stock at source location
      const sourceProductLocation = await tx.productLocation.findUnique({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.fromLocationId
          }
        }
      })

      const currentStock = sourceProductLocation?.stock || 0

      if (currentStock < data.quantity) {
        throw new Error(`Insufficient stock at ${fromLocation.name}. Available: ${currentStock}, Requested: ${data.quantity}`)
      }

      // 4. Update source location stock (remove)
      await tx.productLocation.upsert({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.fromLocationId
          }
        },
        update: {
          stock: {
            decrement: data.quantity
          },
          updatedAt: new Date()
        },
        create: {
          productId: data.productId,
          locationId: data.fromLocationId,
          stock: -data.quantity, // This should not happen if we have proper validation
          isActive: true
        }
      })

      // 5. Update destination location stock (add)
      await tx.productLocation.upsert({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.toLocationId
          }
        },
        update: {
          stock: {
            increment: data.quantity
          },
          updatedAt: new Date()
        },
        create: {
          productId: data.productId,
          locationId: data.toLocationId,
          stock: data.quantity,
          isActive: true
        }
      })

      // 6. Generate transfer ID for tracking
      const transferId = `TXF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 7. Create transfer record in database
      const transferRecord = await tx.transfer.create({
        data: {
          transferId,
          productId: data.productId,
          productName: product.name,
          fromLocationId: data.fromLocationId,
          toLocationId: data.toLocationId,
          quantity: data.quantity,
          status: 'completed',
          reason: data.reason || `Transfer of ${product.name}`,
          notes: data.notes,
          createdBy: data.performedBy || 'system',
          completedAt: new Date()
        }
      })

      console.log(`✅ Transfer ${transferId} completed and saved: ${data.quantity} units of ${product.name} from ${fromLocation.name} to ${toLocation.name}`)

      // 7. Get updated stock levels for response
      const [updatedSourceStock, updatedDestStock] = await Promise.all([
        tx.productLocation.findUnique({
          where: {
            productId_locationId: {
              productId: data.productId,
              locationId: data.fromLocationId
            }
          },
          select: { stock: true }
        }),
        tx.productLocation.findUnique({
          where: {
            productId_locationId: {
              productId: data.productId,
              locationId: data.toLocationId
            }
          },
          select: { stock: true }
        })
      ])

      return {
        transferId,
        transferRecord,
        product: {
          id: product.id,
          name: product.name
        },
        fromLocation: {
          id: fromLocation.id,
          name: fromLocation.name,
          previousStock: currentStock,
          newStock: updatedSourceStock?.stock || 0
        },
        toLocation: {
          id: toLocation.id,
          name: toLocation.name,
          newStock: updatedDestStock?.stock || 0
        },
        quantity: data.quantity,
        completedAt: new Date()
      }
    })

    console.log(`✅ Transfer completed successfully: ${result.transferId}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${result.quantity} units of ${result.product.name} from ${result.fromLocation.name} to ${result.toLocation.name}`,
      transfer: result
    })

  } catch (error) {
    console.error("❌ Error processing transfer:", error)

    let errorMessage = "Failed to process transfer"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message
      
      // Set appropriate status codes for different error types
      if (error.message.includes("not found")) {
        statusCode = 404
      } else if (error.message.includes("Insufficient stock") || 
                 error.message.includes("inactive") ||
                 error.message.includes("cannot be the same")) {
        statusCode = 400
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: statusCode })
  }
}

// GET /api/inventory/transfer - Get transfer history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const locationId = searchParams.get("locationId")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build where clause for transfers
    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ]
    }

    // Get transfers from database
    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        fromLocation: {
          select: { id: true, name: true }
        },
        toLocation: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    console.log(`📦 Found ${transfers.length} transfers in database`)
    if (transfers.length > 0) {
      console.log('📋 Sample transfer:', {
        id: transfers[0].transferId,
        product: transfers[0].productName,
        from: transfers[0].fromLocation.name,
        to: transfers[0].toLocation.name,
        quantity: transfers[0].quantity
      })
    }

    return NextResponse.json({
      transfers: transfers.map(transfer => ({
        id: transfer.transferId,
        productId: transfer.productId,
        productName: transfer.productName,
        productSku: transfer.product.sku,
        fromLocation: transfer.fromLocation,
        toLocation: transfer.toLocation,
        quantity: transfer.quantity,
        status: transfer.status,
        reason: transfer.reason,
        notes: transfer.notes,
        createdBy: transfer.createdBy,
        createdAt: transfer.createdAt,
        completedAt: transfer.completedAt
      })),
      total: transfers.length
    })

  } catch (error) {
    console.error("❌ Error fetching transfer history:", error)
    return NextResponse.json({ error: "Failed to fetch transfer history" }, { status: 500 })
  }
}
