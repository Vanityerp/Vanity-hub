import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/sync-staff-locations
 * 
 * Ensures staff members have proper location assignments
 * This endpoint helps manage staff-location relationships
 */
export async function POST(request: Request) {
  try {
    console.log("🔄 Syncing staff-location relationships...")

    const body = await request.json()
    const { mode = "auto", staffId, locationIds } = body

    if (mode === "assign" && staffId && locationIds) {
      // Assign specific staff to specific locations
      return await assignStaffToLocations(staffId, locationIds)
    } else if (mode === "auto") {
      // Auto-assign staff without locations to all locations
      return await autoAssignStaffToLocations()
    } else {
      return NextResponse.json(
        { error: "Invalid mode or missing parameters" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("❌ Error syncing staff-location relationships:", error)
    return NextResponse.json(
      { 
        error: "Failed to sync staff-location relationships",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function assignStaffToLocations(staffId: string, locationIds: string[]) {
  try {
    // Remove existing location assignments for this staff member
    await prisma.staffLocation.deleteMany({
      where: { staffId }
    })

    // Create new location assignments
    const assignments = await Promise.all(
      locationIds.map(locationId =>
        prisma.staffLocation.create({
          data: {
            staffId,
            locationId,
            isActive: true
          }
        })
      )
    )

    console.log(`✅ Assigned staff ${staffId} to ${assignments.length} locations`)

    return NextResponse.json({
      success: true,
      message: `Staff member assigned to ${assignments.length} locations`,
      assignments: assignments.length
    })

  } catch (error) {
    console.error("❌ Error assigning staff to locations:", error)
    throw error
  }
}

async function autoAssignStaffToLocations() {
  try {
    // Get all active staff and locations
    const [staff, locations] = await Promise.all([
      prisma.staffMember.findMany({
        where: { status: "ACTIVE" },
        include: {
          locations: true
        }
      }),
      prisma.location.findMany({
        where: { isActive: true }
      })
    ])

    console.log(`Found ${staff.length} staff members and ${locations.length} locations`)

    let createdAssignments = 0
    let skippedAssignments = 0

    // For each staff member without location assignments, assign to all locations
    for (const staffMember of staff) {
      if (staffMember.locations.length === 0) {
        // Staff member has no location assignments, assign to all locations
        for (const location of locations) {
          try {
            await prisma.staffLocation.create({
              data: {
                staffId: staffMember.id,
                locationId: location.id,
                isActive: true
              }
            })
            createdAssignments++
            console.log(`✅ Assigned ${staffMember.name} to ${location.name}`)
          } catch (error) {
            // Assignment might already exist
            console.log(`⚠️ Assignment already exists: ${staffMember.name} -> ${location.name}`)
            skippedAssignments++
          }
        }
      } else {
        skippedAssignments += staffMember.locations.length
      }
    }

    console.log(`✅ Auto-assignment complete: ${createdAssignments} created, ${skippedAssignments} skipped`)

    return NextResponse.json({
      success: true,
      message: "Staff-location relationships auto-assigned successfully",
      stats: {
        staffProcessed: staff.length,
        locationsProcessed: locations.length,
        assignmentsCreated: createdAssignments,
        assignmentsSkipped: skippedAssignments
      }
    })

  } catch (error) {
    console.error("❌ Error in auto-assignment:", error)
    throw error
  }
}

/**
 * GET /api/sync-staff-locations
 * 
 * Get statistics about staff-location relationships
 */
export async function GET() {
  try {
    console.log("🔄 Getting staff-location relationship statistics...")

    const [
      totalStaff,
      totalLocations,
      totalAssignments,
      staffWithoutLocations,
      locationsWithoutStaff
    ] = await Promise.all([
      prisma.staffMember.count({ where: { status: "ACTIVE" } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.staffLocation.count({ where: { isActive: true } }),
      prisma.staffMember.count({
        where: {
          status: "ACTIVE",
          locations: {
            none: {}
          }
        }
      }),
      prisma.location.count({
        where: {
          isActive: true,
          staff: {
            none: {}
          }
        }
      })
    ])

    return NextResponse.json({
      statistics: {
        totalStaff,
        totalLocations,
        totalAssignments,
        staffWithoutLocations,
        locationsWithoutStaff,
        needsSync: staffWithoutLocations > 0
      }
    })

  } catch (error) {
    console.error("❌ Error getting staff-location statistics:", error)
    return NextResponse.json(
      { 
        error: "Failed to get staff-location statistics",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
