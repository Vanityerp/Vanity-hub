import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  return NextResponse.json({
    message: "Inventory adjustment API is working",
    timestamp: new Date().toISOString(),
    methods: ["POST"],
    requiredFields: ["productId", "locationId", "quantity", "adjustmentType", "reason"]
  })
}

export async function POST(request: Request) {
  console.log("🔄 Starting inventory adjustment API call...")

  try {
    // Parse request body
    let data
    try {
      data = await request.json()
      console.log("📝 Request data received:", data)
    } catch (parseError) {
      console.error("❌ Failed to parse request JSON:", parseError)
      return NextResponse.json({
        error: "Invalid JSON in request body",
        details: parseError instanceof Error ? parseError.message : "Unknown parse error"
      }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ['productId', 'locationId', 'quantity', 'adjustmentType', 'reason']
    const missingFields = requiredFields.filter(field => !data[field])

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields)
      return NextResponse.json({
        error: "Missing required fields",
        missingFields: missingFields,
        received: Object.keys(data)
      }, { status: 400 })
    }

    const productId = data.productId // Keep as string UUID
    const locationId = data.locationId // Keep as string UUID
    let quantity = Number.parseInt(data.quantity)

    console.log("🔍 Parsed values:", {
      productId,
      locationId,
      quantity,
      adjustmentType: data.adjustmentType,
      reason: data.reason
    })

    // Validate adjustment type
    if (!["add", "remove"].includes(data.adjustmentType)) {
      console.error("❌ Invalid adjustment type:", data.adjustmentType)
      return NextResponse.json({ error: "Invalid adjustment type. Must be 'add' or 'remove'" }, { status: 400 })
    }

    // Validate quantity is a valid number
    if (isNaN(quantity) || quantity <= 0) {
      console.error("❌ Invalid quantity:", quantity)
      return NextResponse.json({ error: "Invalid quantity. Must be a positive number" }, { status: 400 })
    }

    // For transaction records, keep track of the signed adjustment
    const adjustmentQuantity = data.adjustmentType === "remove" ? -quantity : quantity
    console.log("📊 Adjustment details:", {
      type: data.adjustmentType,
      quantity: quantity,
      adjustmentQuantity: adjustmentQuantity,
      reason: data.reason
    })

    // Check if product exists
    console.log("🔍 Looking for product:", productId)
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      console.error("❌ Product not found:", productId)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    console.log("✅ Product found:", product.name)

    // Check if location exists
    console.log("🔍 Looking for location:", locationId)
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      console.error("❌ Location not found:", locationId)
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }
    console.log("✅ Location found:", location.name)

    // Find or create product location record
    console.log("🔍 Looking for product-location relationship...")
    let productLocation = await prisma.productLocation.findUnique({
      where: {
        productId_locationId: {
          productId: productId,
          locationId: locationId
        }
      }
    })

    if (!productLocation) {
      console.log("📝 Creating new product-location record...")
      // Create new product location record if it doesn't exist
      productLocation = await prisma.productLocation.create({
        data: {
          productId: productId,
          locationId: locationId,
          stock: 0,
          isActive: true
        }
      })
      console.log("✅ Created product-location record:", productLocation.id)
    } else {
      console.log("✅ Found existing product-location record:", productLocation.id)
    }

    // Calculate new stock level
    const currentStock = productLocation.stock
    let newStock: number

    if (data.adjustmentType === "add") {
      // Adding stock - straightforward addition
      newStock = currentStock + quantity
    } else {
      // Removing stock - subtract the quantity
      newStock = currentStock - quantity

      // Check for negative stock and handle appropriately
      if (newStock < 0) {
        console.warn("⚠️ Stock will go negative:", {
          currentStock,
          removing: quantity,
          newStock
        })

        // For production, we should prevent negative stock unless explicitly allowed
        // Check if negative stock is allowed (could be a setting)
        const allowNegativeStock = process.env.ALLOW_NEGATIVE_STOCK === 'true' || false

        if (!allowNegativeStock) {
          console.error("❌ Negative stock not allowed")
          return NextResponse.json({
            error: "Insufficient stock",
            details: `Cannot remove ${quantity} units. Only ${currentStock} units available.`,
            currentStock,
            requestedQuantity: quantity
          }, { status: 400 })
        }
      }
    }

    console.log("📊 Stock calculation:", {
      currentStock,
      adjustmentType: data.adjustmentType,
      quantity,
      adjustmentQuantity,
      newStock,
      operation: data.adjustmentType === "add" ? `${currentStock} + ${quantity}` : `${currentStock} - ${quantity}`
    })

    // Update the stock level
    console.log("💾 Updating stock level...")
    const updatedProductLocation = await prisma.productLocation.update({
      where: {
        productId_locationId: {
          productId: productId,
          locationId: locationId
        }
      },
      data: {
        stock: newStock
      },
      include: {
        product: true,
        location: true
      }
    })

    // Create audit trail entry
    try {
      await prisma.inventoryAudit.create({
        data: {
          productId: productId,
          locationId: locationId,
          adjustmentType: data.adjustmentType,
          quantity: quantity,
          previousStock: currentStock,
          newStock: newStock,
          reason: data.reason,
          notes: data.notes || null,
          userId: 'system', // TODO: Get actual user ID from session
          timestamp: new Date()
        }
      })
      console.log("✅ Audit trail entry created")
    } catch (auditError) {
      console.warn("⚠️ Failed to create audit trail entry:", auditError)
      // Don't fail the main operation if audit fails
    }

    console.log("✅ Stock adjustment successful!")

    return NextResponse.json({
      success: true,
      message: `Stock ${data.adjustmentType === "add" ? "increased" : "decreased"} successfully`,
      productLocation: updatedProductLocation,
      previousStock: currentStock,
      newStock: newStock,
      adjustment: adjustmentQuantity,
      auditTrail: true
    })
  } catch (error) {
    console.error("❌ Error adjusting inventory:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    return NextResponse.json({
      error: "Failed to adjust inventory",
      details: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.name : "UnknownError"
    }, { status: 500 })
  }
}

