import { NextResponse } from "next/server"
import { seedProducts } from "@/scripts/seed-products"

export async function POST(request: Request) {
  try {
    console.log('🌱 Starting product database seeding...')
    
    await seedProducts()
    
    console.log('✅ Product seeding completed successfully')
    return NextResponse.json({ 
      message: "Products seeded successfully",
      success: true 
    })
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    return NextResponse.json({ 
      error: "Failed to seed products",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
