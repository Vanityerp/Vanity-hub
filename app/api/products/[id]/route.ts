import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/products/[id] - Fetch a single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Transform product to parse JSON fields
    const transformedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      features: product.features ? JSON.parse(product.features) : [],
      ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
      howToUse: product.howToUse ? JSON.parse(product.howToUse) : []
    }

    console.log(`✅ Fetched product: ${transformedProduct.name}`)
    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error("❌ Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const product = await prisma.product.update({
      where: { id },
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
        isRetail: data.isRetail !== undefined ? data.isRetail : false,
        isActive: data.isActive !== undefined ? data.isActive : true,
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

    console.log(`✅ Updated product: ${product.name}`)
    return NextResponse.json({ product })
  } catch (error) {
    console.error("❌ Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete a product (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Soft delete by setting isActive to false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    console.log(`✅ Deleted product: ${product.name}`)
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
