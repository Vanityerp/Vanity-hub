import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🔍 Checking database status...')
    
    // Test database connection
    await prisma.$connect()
    
    // Check counts
    const locationCount = await prisma.location.count()
    const productCount = await prisma.product.count()
    const retailProductCount = await prisma.product.count({
      where: { isRetail: true, isActive: true }
    })
    
    // Get sample data
    const sampleLocations = await prisma.location.findMany({ take: 3 })
    const sampleProducts = await prisma.product.findMany({ 
      take: 3,
      where: { isRetail: true, isActive: true },
      include: { locations: true }
    })
    
    const status = {
      database: {
        connected: true,
        locationCount,
        productCount,
        retailProductCount
      },
      sampleData: {
        locations: sampleLocations.map(l => ({ id: l.id, name: l.name })),
        products: sampleProducts.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          isRetail: p.isRetail,
          isActive: p.isActive,
          locationCount: p.locations.length
        }))
      },
      recommendations: []
    }
    
    // Add recommendations based on status
    if (locationCount === 0) {
      status.recommendations.push("Initialize database: Create locations first")
    }
    if (productCount === 0) {
      status.recommendations.push("Seed database: Add products to the catalog")
    }
    if (retailProductCount === 0 && productCount > 0) {
      status.recommendations.push("No retail products found: Check product isRetail flags")
    }
    
    console.log('✅ Database status check completed:', status)
    return NextResponse.json(status)
    
  } catch (error) {
    console.error('❌ Database status check failed:', error)
    return NextResponse.json({
      database: { connected: false },
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: ["Check database connection and run migrations"]
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
