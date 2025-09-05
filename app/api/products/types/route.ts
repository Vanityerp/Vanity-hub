import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/products/types - Fetch all product types from database
export async function GET(request: Request) {
  try {
    console.log("🔄 Fetching product types...")

    const { searchParams } = new URL(request.url)
    const categoryFilter = searchParams.get("category")

    // Get all products and extract unique types with their categories
    const whereClause: any = {
      isActive: true
    }

    if (categoryFilter) {
      whereClause.category = categoryFilter
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        category: true,
        type: true
      }
    })

    // Extract unique types and count products for each
    const typeMap = new Map<string, { category: string, count: number }>()

    products.forEach(product => {
      const type = (product.type || "Other").trim()
      const category = (product.category || "Uncategorized").trim()
      
      if (type && type !== "") {
        const key = `${category}|${type}`
        if (typeMap.has(key)) {
          typeMap.get(key)!.count += 1
        } else {
          typeMap.set(key, { category, count: 1 })
        }
      }
    })

    // Convert to array format with unique ID generation
    const types = Array.from(typeMap.entries()).map(([key, data], index) => {
      const [category, typeName] = key.split('|')
      const baseId = key.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-|]/g, '')
      // Ensure unique ID by adding index if needed
      const id = baseId || `type-${index}`

      return {
        id,
        name: typeName,
        description: `${typeName} in ${category}`,
        category: category,
        categoryId: category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        productCount: data.count,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Additional deduplication by ID to ensure uniqueness
    const uniqueTypes = types.filter((type, index, array) =>
      array.findIndex(t => t.id === type.id) === index
    )

    // Sort by category then by name
    uniqueTypes.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })

    console.log(`✅ Found ${uniqueTypes.length} unique product types`)
    return NextResponse.json({ types: uniqueTypes })
  } catch (error) {
    console.error("❌ Error fetching product types:", error)
    return NextResponse.json({ error: "Failed to fetch types" }, { status: 500 })
  }
}

// POST /api/products/types - Create a new product type
export async function POST(request: Request) {
  try {
    console.log("🔄 Creating product type...")
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json({ 
        error: "Type name and category are required" 
      }, { status: 400 })
    }

    // Check if type already exists in this category
    const existingProducts = await prisma.product.findFirst({
      where: {
        category: data.category,
        type: data.name,
        isActive: true
      }
    })

    if (existingProducts) {
      return NextResponse.json({ 
        error: "Type already exists in this category" 
      }, { status: 400 })
    }

    // Since we're using string types in the product model,
    // we don't actually create a separate type record.
    // Types are created implicitly when products are created with them.
    const type = {
      id: `${data.category}|${data.name}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-|]/g, ''),
      name: data.name,
      description: data.description || `${data.name} in ${data.category}`,
      category: data.category,
      categoryId: data.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      productCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Type "${data.name}" ready for use in category "${data.category}"`)
    return NextResponse.json({ type })
  } catch (error) {
    console.error("❌ Error creating product type:", error)
    return NextResponse.json({ error: "Failed to create type" }, { status: 500 })
  }
}
