import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    console.log('🚀 Starting database initialization...')
    
    // Check if locations exist
    const locationCount = await prisma.location.count()
    console.log(`📍 Found ${locationCount} locations`)
    
    if (locationCount === 0) {
      console.log('🏗️ Creating default locations...')
      
      // Create default locations
      const defaultLocations = [
        { id: 'loc1', name: 'D-ring road', address: 'D-ring road', city: 'Doha', country: 'Qatar' },
        { id: 'loc2', name: 'Muaither', address: 'Muaither', city: 'Doha', country: 'Qatar' },
        { id: 'loc3', name: 'Medinat Khalifa', address: 'Medinat Khalifa', city: 'Doha', country: 'Qatar' },
        { id: 'home', name: 'Home Service', address: 'Mobile Service', city: 'Doha', country: 'Qatar' },
        { id: 'online', name: 'Online Store', address: 'Online', city: 'Doha', country: 'Qatar' }
      ]
      
      for (const location of defaultLocations) {
        await prisma.location.create({ data: location })
        console.log(`✅ Created location: ${location.name}`)
      }
    }
    
    // Check product count
    const productCount = await prisma.product.count()
    console.log(`📦 Found ${productCount} products`)
    
    return NextResponse.json({ 
      success: true,
      message: "Database initialized successfully",
      locations: locationCount === 0 ? 5 : locationCount,
      products: productCount
    })
    
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    return NextResponse.json({ 
      error: "Failed to initialize database",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
