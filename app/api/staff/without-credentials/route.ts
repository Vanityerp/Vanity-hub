import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/staff/without-credentials
 * 
 * Get all staff members who don't have login credentials yet
 */
export async function GET() {
  try {
    console.log("🔄 Fetching staff members without credentials...")
    
    const staffWithoutCredentials = await prisma.staffMember.findMany({
      where: {
        userId: null // Staff members without user accounts
      },
      include: {
        locations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedStaff = staffWithoutCredentials.map(staff => ({
      id: staff.id,
      name: staff.name,
      employeeNumber: staff.employeeNumber,
      jobRole: staff.jobRole,
      phone: staff.phone,
      status: staff.status,
      locations: staff.locations.map(sl => ({
        id: sl.location.id,
        name: sl.location.name,
        city: sl.location.city,
        isActive: sl.isActive
      }))
    }))

    console.log(`✅ Found ${formattedStaff.length} staff members without credentials`)
    return NextResponse.json({ staff: formattedStaff })
  } catch (error) {
    console.error("❌ Error fetching staff without credentials:", error)
    return NextResponse.json({ error: "Failed to fetch staff without credentials" }, { status: 500 })
  }
}
