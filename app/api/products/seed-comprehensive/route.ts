import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { seedComprehensiveBeautyProducts } from "@/scripts/seed-comprehensive-beauty-products"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🌱 Starting comprehensive beauty product seeding...')
    
    const result = await seedComprehensiveBeautyProducts()
    
    console.log('✅ Comprehensive product seeding completed successfully')
    return NextResponse.json({ 
      message: "Comprehensive beauty products seeded successfully",
      success: true,
      ...result
    })
  } catch (error) {
    console.error('❌ Error seeding comprehensive products:', error)
    return NextResponse.json({ 
      error: "Failed to seed comprehensive products",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
