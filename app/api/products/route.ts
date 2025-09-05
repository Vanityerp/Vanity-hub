import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/products - Fetch all products with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const type = searchParams.get("type")
    const isRetail = searchParams.get("isRetail")
    const locationId = searchParams.get("locationId")
    const search = searchParams.get("search")

    // Build where clause
    const where: any = {
      isActive: true
    }

    if (category) {
      where.category = {
        contains: category
      }
    }

    if (type) {
      where.type = {
        contains: type
      }
    }

    if (isRetail !== null) {
      where.isRetail = isRetail === "true"
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } }
      ]
    }

    // Include location-specific data if locationId is provided
    const include: any = {
      locations: locationId ? {
        where: { locationId }
      } : true
    }

    const products = await prisma.product.findMany({
      where,
      include,
      orderBy: { name: 'asc' }
    })

    // Transform products to parse JSON fields with error handling
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

    console.log(`✅ Fetched ${transformedProducts.length} products from database`)
    return NextResponse.json({ products: transformedProducts, total: transformedProducts.length })
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || data.price === undefined || data.price === null || !data.category) {
      return NextResponse.json({
        error: "Missing required fields: name, price, and category are required"
      }, { status: 400 })
    }

    // Validate type (now a string)
    if (data.type && typeof data.type !== 'string') {
      return NextResponse.json({
        error: "Product type must be a string"
      }, { status: 400 })
    }



    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        cost: data.cost ? parseFloat(data.cost) : null,
        category: data.category,
        type: data.type || "Other",
        brand: data.brand || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        image: data.image || (data.images && data.images.length > 0 ? data.images[0] : null),
        images: JSON.stringify(data.images || []),
        isRetail: data.isRetail || false,
        isFeatured: data.isFeatured || false,
        isNew: data.isNew || false,
        isBestSeller: data.isBestSeller || false,
        isSale: data.isSale || false,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        features: JSON.stringify(data.features || []),
        ingredients: JSON.stringify(data.ingredients || []),
        howToUse: JSON.stringify(data.howToUse || [])
      },
      include: {
        locations: true
      }
    })

    // Create location associations if provided
    if (data.locations && Array.isArray(data.locations)) {
      // First, let's check what locations exist in the database
      const existingLocations = await prisma.location.findMany({
        select: { id: true, name: true }
      })

      for (const locationData of data.locations) {
        // Check if the location exists before creating the association
        const locationExists = existingLocations.some(loc => loc.id === locationData.locationId)
        if (!locationExists) {
          console.log(`❌ Location ${locationData.locationId} does not exist in database. Skipping.`)
          continue
        }

        try {
          await prisma.productLocation.create({
            data: {
              productId: product.id,
              locationId: locationData.locationId,
              stock: locationData.stock || 0,
              price: locationData.price ? parseFloat(locationData.price) : null
            }
          })
        } catch (error) {
          console.log(`❌ Failed to create ProductLocation for location ${locationData.locationId}:`, error)
        }
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("❌ Error creating product:", error)

    // Provide more detailed error information
    let errorMessage = "Failed to create product"
    if (error instanceof Error) {
      errorMessage = error.message
      console.error("❌ Detailed error:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json({
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
