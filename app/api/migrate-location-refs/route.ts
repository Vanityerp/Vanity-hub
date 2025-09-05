import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/migrate-location-refs
 * 
 * Migrate all foreign key references from duplicate locations to correct ones, then delete duplicates
 */
export async function POST() {
  try {
    console.log("🔄 Starting location reference migration...")

    // Define the mapping from old IDs to new IDs
    const locationMappings = [
      {
        oldId: 'cmbkob47q0001ufh0ywow14fo', // D-Ring Road (auto-generated)
        newId: 'loc1', // D-ring road (correct)
        name: 'D-ring road'
      },
      {
        oldId: 'cmbkob4810002ufh0vykdliff', // Muaither (auto-generated)
        newId: 'loc2', // Muaither (correct)
        name: 'Muaither'
      },
      {
        oldId: 'location3', // Medinat Khalifa (old format)
        newId: 'loc3', // Medinat Khalifa (correct)
        name: 'Medinat Khalifa'
      }
    ]

    const migrationResults = {
      appointmentsMigrated: 0,
      staffLocationsMigrated: 0,
      transactionsMigrated: 0,
      locationsDeleted: [],
      errors: []
    }

    for (const mapping of locationMappings) {
      try {
        console.log(`Migrating references from ${mapping.oldId} to ${mapping.newId}...`)

        // Check if both old and new locations exist
        const oldLocation = await prisma.location.findUnique({ where: { id: mapping.oldId } })
        const newLocation = await prisma.location.findUnique({ where: { id: mapping.newId } })

        if (!oldLocation) {
          console.log(`Old location ${mapping.oldId} not found, skipping...`)
          continue
        }

        if (!newLocation) {
          console.log(`New location ${mapping.newId} not found, skipping...`)
          continue
        }

        // Migrate appointments
        const appointmentUpdate = await prisma.appointment.updateMany({
          where: { location: mapping.oldId },
          data: { location: mapping.newId }
        })
        migrationResults.appointmentsMigrated += appointmentUpdate.count
        console.log(`Migrated ${appointmentUpdate.count} appointments`)

        // Migrate staff locations (if the table exists)
        try {
          const staffLocationUpdate = await prisma.staffLocation.updateMany({
            where: { locationId: mapping.oldId },
            data: { locationId: mapping.newId }
          })
          migrationResults.staffLocationsMigrated += staffLocationUpdate.count
          console.log(`Migrated ${staffLocationUpdate.count} staff location assignments`)
        } catch (error) {
          console.log("StaffLocation table might not exist, skipping...")
        }

        // Migrate transactions
        try {
          const transactionUpdate = await prisma.transaction.updateMany({
            where: { locationId: mapping.oldId },
            data: { locationId: mapping.newId }
          })
          migrationResults.transactionsMigrated += transactionUpdate.count
          console.log(`Migrated ${transactionUpdate.count} transactions`)
        } catch (error) {
          console.log("Transaction table might not exist or have different structure, skipping...")
        }

        // Now try to delete the old location
        try {
          await prisma.location.delete({
            where: { id: mapping.oldId }
          })
          migrationResults.locationsDeleted.push({
            id: mapping.oldId,
            name: mapping.name
          })
          console.log(`✅ Deleted old location: ${mapping.name} (${mapping.oldId})`)
        } catch (deleteError) {
          console.error(`❌ Could not delete location ${mapping.oldId}:`, deleteError)
          migrationResults.errors.push({
            location: mapping.oldId,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
          })
        }

      } catch (error) {
        console.error(`❌ Error migrating ${mapping.oldId}:`, error)
        migrationResults.errors.push({
          location: mapping.oldId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get final location count
    const finalLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    console.log("🎉 Location migration completed!")
    console.log(`Final location count: ${finalLocations.length}`)

    return NextResponse.json({
      success: true,
      message: "Location reference migration completed",
      migrationResults,
      finalLocationCount: finalLocations.length,
      finalLocations: finalLocations.map(loc => ({
        id: loc.id,
        name: loc.name
      }))
    })

  } catch (error) {
    console.error("❌ Error during location migration:", error)
    return NextResponse.json(
      { 
        error: "Failed to migrate location references",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
