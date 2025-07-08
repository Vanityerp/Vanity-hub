import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/cleanup-locations
 * 
 * Clean up duplicate locations and ensure only the required 5 locations exist
 */
export async function POST() {
  try {
    console.log("🧹 Starting location cleanup...")

    // First, get all current locations
    const allLocations = await prisma.location.findMany({
      orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${allLocations.length} total locations`)

    // Define the required locations with their correct IDs
    const requiredLocations = [
      { id: 'loc1', name: 'D-ring road' },
      { id: 'loc2', name: 'Muaither' },
      { id: 'loc3', name: 'Medinat Khalifa' },
      { id: 'home', name: 'Home service' },
      { id: 'online', name: 'Online store' }
    ]

    const cleanupResults = {
      deleted: [],
      kept: [],
      errors: []
    }

    // For each required location, find duplicates and keep only the one with correct ID
    for (const required of requiredLocations) {
      try {
        // Find all locations with this name (case-insensitive)
        const duplicates = allLocations.filter(loc => 
          loc.name.toLowerCase() === required.name.toLowerCase()
        )

        console.log(`Found ${duplicates.length} locations named "${required.name}"`)

        if (duplicates.length > 1) {
          // Keep the one with the correct ID, delete others
          const correctLocation = duplicates.find(loc => loc.id === required.id)
          const toDelete = duplicates.filter(loc => loc.id !== required.id)

          for (const duplicate of toDelete) {
            await prisma.location.delete({
              where: { id: duplicate.id }
            })
            cleanupResults.deleted.push({
              id: duplicate.id,
              name: duplicate.name,
              reason: `Duplicate of ${required.id}`
            })
            console.log(`Deleted duplicate location: ${duplicate.name} (${duplicate.id})`)
          }

          if (correctLocation) {
            cleanupResults.kept.push({
              id: correctLocation.id,
              name: correctLocation.name
            })
          }
        } else if (duplicates.length === 1) {
          cleanupResults.kept.push({
            id: duplicates[0].id,
            name: duplicates[0].name
          })
        }
      } catch (error) {
        console.error(`Error processing ${required.name}:`, error)
        cleanupResults.errors.push({
          location: required.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Delete any locations that don't match our required list
    const finalLocations = await prisma.location.findMany()
    const requiredIds = requiredLocations.map(loc => loc.id)
    const extraLocations = finalLocations.filter(loc => !requiredIds.includes(loc.id))

    for (const extra of extraLocations) {
      try {
        await prisma.location.delete({
          where: { id: extra.id }
        })
        cleanupResults.deleted.push({
          id: extra.id,
          name: extra.name,
          reason: 'Not in required locations list'
        })
        console.log(`Deleted extra location: ${extra.name} (${extra.id})`)
      } catch (error) {
        console.error(`Error deleting extra location ${extra.name}:`, error)
        cleanupResults.errors.push({
          location: extra.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get final count
    const finalCount = await prisma.location.count()

    console.log("🎉 Location cleanup completed!")
    console.log(`Final location count: ${finalCount}`)

    return NextResponse.json({
      success: true,
      message: "Location cleanup completed successfully",
      results: cleanupResults,
      finalLocationCount: finalCount
    })

  } catch (error) {
    console.error("❌ Error during location cleanup:", error)
    return NextResponse.json(
      { 
        error: "Failed to cleanup locations",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cleanup-locations
 * 
 * Check for duplicate locations without cleaning up
 */
export async function GET() {
  try {
    const allLocations = await prisma.location.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { name: 'asc' }
    })

    // Group by name to find duplicates
    const locationGroups = allLocations.reduce((groups, location) => {
      const name = location.name.toLowerCase()
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
        locations
      }))

    return NextResponse.json({
      totalLocations: allLocations.length,
      duplicateGroups: duplicates,
      hasDuplicates: duplicates.length > 0,
      allLocations
    })

  } catch (error) {
    console.error("Error checking for duplicates:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    )
  }
}
