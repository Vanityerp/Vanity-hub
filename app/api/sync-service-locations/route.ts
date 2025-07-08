import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/sync-service-locations
 * 
 * Ensures all services are properly linked to all locations
 * This endpoint creates missing service-location relationships
 */
export async function POST() {
  try {
    console.log("🔄 Syncing service-location relationships...")

    // Get all active services and locations
    const [services, locations] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        include: {
          locations: true
        }
      }),
      prisma.location.findMany({
        where: { isActive: true }
      })
    ])

    console.log(`Found ${services.length} services and ${locations.length} locations`)

    let createdRelationships = 0
    let skippedRelationships = 0

    // For each service, ensure it's linked to all locations
    for (const service of services) {
      const existingLocationIds = service.locations.map(sl => sl.locationId)
      
      for (const location of locations) {
        // Check if relationship already exists
        if (!existingLocationIds.includes(location.id)) {
          try {
            await prisma.locationService.create({
              data: {
                serviceId: service.id,
                locationId: location.id,
                price: service.price, // Use service's base price
                isActive: true
              }
            })
            createdRelationships++
            console.log(`✅ Created relationship: ${service.name} -> ${location.name}`)
          } catch (error) {
            // Relationship might already exist due to race conditions
            console.log(`⚠️ Relationship already exists: ${service.name} -> ${location.name}`)
            skippedRelationships++
          }
        } else {
          skippedRelationships++
        }
      }
    }

    console.log(`✅ Sync complete: ${createdRelationships} created, ${skippedRelationships} skipped`)

    return NextResponse.json({
      success: true,
      message: "Service-location relationships synced successfully",
      stats: {
        servicesProcessed: services.length,
        locationsProcessed: locations.length,
        relationshipsCreated: createdRelationships,
        relationshipsSkipped: skippedRelationships
      }
    })

  } catch (error) {
    console.error("❌ Error syncing service-location relationships:", error)
    return NextResponse.json(
      { 
        error: "Failed to sync service-location relationships",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync-service-locations
 * 
 * Get statistics about service-location relationships
 */
export async function GET() {
  try {
    console.log("🔄 Getting service-location relationship statistics...")

    const [
      totalServices,
      totalLocations,
      totalRelationships,
      servicesWithoutLocations,
      locationsWithoutServices
    ] = await Promise.all([
      prisma.service.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.locationService.count({ where: { isActive: true } }),
      prisma.service.count({
        where: {
          isActive: true,
          locations: {
            none: {}
          }
        }
      }),
      prisma.location.count({
        where: {
          isActive: true,
          services: {
            none: {}
          }
        }
      })
    ])

    const expectedRelationships = totalServices * totalLocations
    const completionPercentage = totalRelationships > 0 
      ? Math.round((totalRelationships / expectedRelationships) * 100)
      : 0

    return NextResponse.json({
      statistics: {
        totalServices,
        totalLocations,
        totalRelationships,
        expectedRelationships,
        completionPercentage,
        servicesWithoutLocations,
        locationsWithoutServices,
        needsSync: totalRelationships < expectedRelationships
      }
    })

  } catch (error) {
    console.error("❌ Error getting service-location statistics:", error)
    return NextResponse.json(
      { 
        error: "Failed to get service-location statistics",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
