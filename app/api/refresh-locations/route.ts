import { NextResponse } from "next/server"

/**
 * POST /api/refresh-locations
 * 
 * Simple endpoint to trigger location refresh on client side
 */
export async function POST() {
  try {
    console.log("🔄 Location refresh requested")
    
    return NextResponse.json({
      success: true,
      message: "Location refresh triggered",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ Error in refresh endpoint:", error)
    return NextResponse.json(
      { 
        error: "Failed to trigger refresh",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/refresh-locations
 * 
 * Get current location status
 */
export async function GET() {
  try {
    // Import prisma here to avoid issues
    const { prisma } = await import("@/lib/prisma")
    
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      locationCount: locations.length,
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        isActive: loc.isActive
      })),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("❌ Error getting location status:", error)
    return NextResponse.json(
      { 
        error: "Failed to get location status",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
