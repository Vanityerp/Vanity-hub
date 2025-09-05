import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Interface for shop product (converted from inventory)
interface ShopProduct {
  id: string
  name: string
  description: string
  price: number
  salePrice?: number
  cost?: number
  category: string
  type: string
  image: string
  images: string[]
  stock: number
  minStock: number
  isNew?: boolean
  isBestSeller?: boolean
  isSale?: boolean
  isOnSale?: boolean
  features: string[]
  ingredients?: string[]
  howToUse?: string[]
  relatedProducts: string[]
  rating: number
  reviewCount: number
  sku: string
  barcode?: string
  location?: string
  isRetail: boolean
  isActive: boolean
  isFeatured?: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Convert database product to shop product format
function convertProductToShopProduct(product: any, locationStock: number = 0): ShopProduct {
  // Map categories to appropriate placeholder images
  const getProductImage = (category: string, name: string): string => {
    const categoryLower = category.toLowerCase()
    const nameLower = name.toLowerCase()

    if (categoryLower.includes('skincare') || nameLower.includes('cleanser') || nameLower.includes('serum')) {
      return '/images/products/skincare-placeholder.jpg'
    } else if (categoryLower.includes('makeup') || nameLower.includes('foundation') || nameLower.includes('lipstick')) {
      return '/images/products/makeup-placeholder.jpg'
    } else if (categoryLower.includes('hair') || nameLower.includes('shampoo') || nameLower.includes('conditioner')) {
      return '/images/products/haircare-placeholder.jpg'
    } else if (categoryLower.includes('nail') || nameLower.includes('polish')) {
      return '/images/products/nailcare-placeholder.jpg'
    } else if (categoryLower.includes('fragrance') || nameLower.includes('perfume')) {
      return '/images/products/fragrance-placeholder.jpg'
    }
    return '/placeholder.jpg'
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: parseFloat(product.price.toString()),
    salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : undefined,
    cost: product.cost ? parseFloat(product.cost.toString()) : undefined,
    category: product.category,
    type: product.type,
    image: product.image || getProductImage(product.category, product.name),
    images: product.image ? [product.image] : [getProductImage(product.category, product.name)],
    stock: locationStock,
    minStock: 5, // Default minimum stock
    isNew: product.isNew || false,
    isBestSeller: product.isBestSeller || false,
    isSale: product.isSale || false,
    isOnSale: product.isSale || false,
    features: product.features ? JSON.parse(product.features) : [],
    ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
    howToUse: product.howToUse ? JSON.parse(product.howToUse) : [],
    relatedProducts: [],
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    sku: product.sku || '',
    barcode: product.barcode || '',
    location: '',
    isRetail: product.isRetail,
    isActive: product.isActive,
    isFeatured: product.isFeatured || false,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // Build where clause for retail products only
    const where: any = {
      isRetail: true,
      isActive: true
    }

    if (category) {
      where.category = {
        contains: category
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Fetch products with location stock information
    const products = await prisma.product.findMany({
      where,
      include: {
        locations: locationId ? {
          where: { locationId }
        } : true
      },
      orderBy: { name: 'asc' }
    })

    // Convert to shop product format
    const shopProducts = products
      .filter(product => {
        // Only include products with stock if locationId is specified
        if (locationId) {
          const locationStock = product.locations.find(loc => loc.locationId === locationId)
          return locationStock && locationStock.stock > 0
        }
        return true
      })
      .map(product => {
        // Get stock for the specific location or total stock
        const stock = locationId
          ? product.locations.find(loc => loc.locationId === locationId)?.stock || 0
          : product.locations.reduce((total, loc) => total + loc.stock, 0)

        return convertProductToShopProduct(product, stock)
      })

    console.log(`🛒 Shop API: Found ${shopProducts.length} retail products${locationId ? ` for location ${locationId}` : ''}`)

    return NextResponse.json({
      products: shopProducts,
      total: shopProducts.length,
      locationId
    })
  } catch (error) {
    console.error("❌ Error fetching shop products:", error)
    return NextResponse.json({ error: "Failed to fetch shop products" }, { status: 500 })
  }
}
