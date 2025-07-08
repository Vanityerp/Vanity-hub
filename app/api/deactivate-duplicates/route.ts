import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/deactivate-duplicates
 * 
 * Mark duplicate locations as inactive instead of deleting them
 */
export async function POST() {
  try {
    console.log("🔄 Deactivating duplicate locations...")

    // IDs of duplicate locations to deactivate
    const duplicateIds = [
      'cmbkob47q0001ufh0ywow14fo', // D-Ring Road (auto-generated)
      'cmbkob4810002ufh0vykdliff', // Muaither (auto-generated) 
      'location3' // Medinat Khalifa (old format)
    ]

    const results = {
      deactivated: [],
      errors: []
    }

    for (const id of duplicateIds) {
      try {
        const location = await prisma.location.findUnique({
          where: { id }
        })

        if (location) {
          await prisma.location.update({
            where: { id },
            data: { isActive: false }
          })
          
          results.deactivated.push({
            id: location.id,
            name: location.name
          })
          console.log(`✅ Deactivated location: ${location.name} (${id})`)
        } else {
          console.log(`⚠️ Location not found: ${id}`)
        }
      } catch (error) {
        console.error(`❌ Error deactivating location ${id}:`, error)
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get active locations only
    const activeLocations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    console.log("🎉 Duplicate deactivation completed!")
    console.log(`Active location count: ${activeLocations.length}`)

    return NextResponse.json({
      success: true,
      message: `Deactivated ${results.deactivated.length} duplicate locations`,
      results,
      activeLocationCount: activeLocations.length,
      activeLocations: activeLocations.map(loc => ({
        id: loc.id,
        name: loc.name
      }))
    })

  } catch (error) {
    console.error("❌ Error during deactivation:", error)
    return NextResponse.json(
      { 
        error: "Failed to deactivate duplicates",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
