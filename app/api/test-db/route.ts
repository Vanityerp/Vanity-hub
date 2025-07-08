import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Test location count
    const locationCount = await prisma.location.count()
    console.log(`📍 Locations: ${locationCount}`)
    
    // Test product count
    const productCount = await prisma.product.count()
    console.log(`📦 Products: ${productCount}`)
    
    // Test a simple query
    const locations = await prisma.location.findMany({
      take: 3
    })
    
    const products = await prisma.product.findMany({
      take: 3,
      include: {
        locations: true
      }
    })
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        locationCount,
        productCount,
        sampleLocations: locations.map(l => ({ id: l.id, name: l.name })),
        sampleProducts: products.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category,
          isRetail: p.isRetail,
          locationCount: p.locations.length
        }))
      }
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
