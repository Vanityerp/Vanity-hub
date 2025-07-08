import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/fix-locations
 * 
 * Ensure we have exactly the 5 required locations with correct data
 */
export async function POST() {
  try {
    console.log("🔧 Fixing location data...")

    // Define the exact 5 required locations
    const requiredLocations = [
      {
        id: 'loc1',
        name: 'D-ring road',
        address: '123 D-Ring Road',
        city: 'Doha',
        state: 'Doha',
        zipCode: '12345',
        country: 'Qatar',
        phone: '(974) 123-4567',
        email: 'dring@vanityhub.com',
        isActive: true
      },
      {
        id: 'loc2',
        name: 'Muaither',
        address: '456 Muaither St',
        city: 'Doha',
        state: 'Doha',
        zipCode: '23456',
        country: 'Qatar',
        phone: '(974) 234-5678',
        email: 'muaither@vanityhub.com',
        isActive: true
      },
      {
        id: 'loc3',
        name: 'Medinat Khalifa',
        address: '789 Medinat Khalifa Blvd',
        city: 'Doha',
        state: 'Doha',
        zipCode: '34567',
        country: 'Qatar',
        phone: '(974) 345-6789',
        email: 'medinat@vanityhub.com',
        isActive: true
      },
      {
        id: 'home',
        name: 'Home service',
        address: 'Client\'s Location',
        city: 'Doha',
        state: 'Doha',
        zipCode: '',
        country: 'Qatar',
        phone: '(974) 456-7890',
        email: 'homeservice@vanityhub.com',
        isActive: true
      },
      {
        id: 'online',
        name: 'Online store',
        address: 'Virtual Location',
        city: 'Doha',
        state: 'Doha',
        zipCode: '',
        country: 'Qatar',
        phone: '(974) 567-8901',
        email: 'online@vanityhub.com',
        isActive: true
      }
    ]

    const results = {
      upserted: [],
      deleted: [],
      errors: []
    }

    // Step 1: Upsert each required location
    for (const location of requiredLocations) {
      try {
        const upsertedLocation = await prisma.location.upsert({
          where: { id: location.id },
          update: {
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            zipCode: location.zipCode,
            country: location.country,
            phone: location.phone,
            email: location.email,
            isActive: location.isActive
          },
          create: location
        })

        results.upserted.push({
          id: upsertedLocation.id,
          name: upsertedLocation.name,
          action: 'upserted'
        })
        console.log(`✅ Upserted location: ${location.name} (${location.id})`)
      } catch (error) {
        console.error(`❌ Error upserting location ${location.name}:`, error)
        results.errors.push({
          location: location.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Step 2: Find and delete any locations that are NOT in our required list
    const requiredIds = requiredLocations.map(loc => loc.id)
    const allLocations = await prisma.location.findMany()
    const extraLocations = allLocations.filter(loc => !requiredIds.includes(loc.id))

    for (const extraLocation of extraLocations) {
      try {
        await prisma.location.delete({
          where: { id: extraLocation.id }
        })
        results.deleted.push({
          id: extraLocation.id,
          name: extraLocation.name,
          reason: 'Not in required locations list'
        })
        console.log(`🗑️ Deleted extra location: ${extraLocation.name} (${extraLocation.id})`)
      } catch (error) {
        console.error(`❌ Error deleting extra location ${extraLocation.name}:`, error)
        results.errors.push({
          location: extraLocation.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Step 3: Verify final state
    const finalLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    console.log("🎉 Location fix completed!")
    console.log(`Final location count: ${finalLocations.length}`)

    return NextResponse.json({
      success: true,
      message: "Location data fixed successfully",
      results,
      finalLocationCount: finalLocations.length,
      finalLocations: finalLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        isActive: loc.isActive
      }))
    })

  } catch (error) {
    console.error("❌ Error during location fix:", error)
    return NextResponse.json(
      { 
        error: "Failed to fix location data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
