import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { seedComprehensiveCategories } from "@/scripts/seed-comprehensive-categories"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🌱 Starting comprehensive category seeding...')
    
    const result = await seedComprehensiveCategories()
    
    console.log('✅ Category seeding completed successfully')
    return NextResponse.json({ 
      message: "Categories seeded successfully",
      success: true,
      ...result
    })
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    return NextResponse.json({ 
      error: "Failed to seed categories",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
