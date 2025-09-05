import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/delete-duplicates
 * 
 * Delete specific duplicate location IDs
 */
export async function POST(request: Request) {
  try {
    const { idsToDelete } = await request.json()
    
    if (!idsToDelete || !Array.isArray(idsToDelete)) {
      return NextResponse.json(
        { error: "Please provide an array of IDs to delete" },
        { status: 400 }
      )
    }

    console.log("🗑️ Deleting specific location IDs:", idsToDelete)

    const deletedLocations = []
    const errors = []

    for (const id of idsToDelete) {
      try {
        const location = await prisma.location.findUnique({
          where: { id }
        })

        if (location) {
          await prisma.location.delete({
            where: { id }
          })
          deletedLocations.push({
            id: location.id,
            name: location.name
          })
          console.log(`✅ Deleted location: ${location.name} (${id})`)
        } else {
          console.log(`⚠️ Location not found: ${id}`)
        }
      } catch (error) {
        console.error(`❌ Error deleting location ${id}:`, error)
        errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get final locations
    const finalLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedLocations.length} locations`,
      deletedLocations,
      errors,
      finalLocationCount: finalLocations.length,
      finalLocations: finalLocations.map(loc => ({
        id: loc.id,
        name: loc.name
      }))
    })

  } catch (error) {
    console.error("❌ Error during deletion:", error)
    return NextResponse.json(
      { 
        error: "Failed to delete locations",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/delete-duplicates
 * 
 * List all current locations to identify duplicates
 */
export async function GET() {
  try {
    const allLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    // Group by name to identify duplicates
    const locationGroups = allLocations.reduce((groups, location) => {
      const name = location.name.toLowerCase().trim()
      if (!groups[name]) {
        groups[name] = []
      }
      groups[name].push(location)
      return groups
    }, {} as Record<string, typeof allLocations>)

    const duplicates = Object.entries(locationGroups)
      .filter(([_, locations]) => locations.length > 1)
      .map(([name, locations]) => ({
        name,
        count: locations.length,
        locations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          createdAt: loc.createdAt
        }))
      }))

    return NextResponse.json({
      totalLocations: allLocations.length,
      allLocations: allLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        createdAt: loc.createdAt
      })),
      duplicateGroups: duplicates,
      hasDuplicates: duplicates.length > 0
    })

  } catch (error) {
    console.error("Error listing locations:", error)
    return NextResponse.json(
      { error: "Failed to list locations" },
      { status: 500 }
    )
  }
}
