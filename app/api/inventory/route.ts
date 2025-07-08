import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")

    if (!locationId) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 })
    }

    console.log(`🔄 Fetching inventory for location: ${locationId}`)

    // Get inventory data from Prisma database
    const productLocations = await prisma.productLocation.findMany({
      where: {
        locationId: locationId,
        isActive: true
      },
      include: {
        product: true,
        location: true
      }
    })

    // Transform to expected inventory format
    const inventory = productLocations.map(pl => ({
      id: pl.product.id,
      name: pl.product.name,
      description: pl.product.description || "",
      category: pl.product.category,
      type: pl.product.type,
      brand: pl.product.brand || "",
      sku: pl.product.sku || "",
      barcode: pl.product.barcode || "",
      price: pl.price || pl.product.price,
      cost: pl.product.cost || 0,
      stock: pl.stock,
      isRetail: pl.product.isRetail,
      isActive: pl.product.isActive,
      isFeatured: pl.product.isFeatured,
      locationId: pl.locationId,
      locationName: pl.location.name
    }))

    console.log(`✅ Found ${inventory.length} inventory items for location`)
    return NextResponse.json({ inventory })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check user session and permissions
    const session = await getServerSession()

    // If no session or user, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.locationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`🔄 Creating new product: ${data.name}`)

    // Create the product using Prisma
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        category: data.category || "Other",
        type: data.type || data.category || "Other",
        brand: data.brand || null,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.costPrice) || 0,
        isRetail: data.isRetail || false,
      }
    })

    // Create product-location association with initial stock
    await prisma.productLocation.create({
      data: {
        productId: product.id,
        locationId: data.locationId,
        stock: parseInt(data.initialStock) || 0,
        price: data.locationPrice ? parseFloat(data.locationPrice) : null
      }
    })

    console.log(`✅ Created product: ${product.name} with initial stock`)
    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

