import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || "hanan@vanityhub.com"

    console.log(`🔍 Debug: Looking up user locations for ${email}`)

    // Get user with staff profile and location assignments
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staffProfile: {
          include: {
            locations: {
              include: {
                location: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all locations for reference
    const allLocations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    const result = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      staffProfile: user.staffProfile ? {
        id: user.staffProfile.id,
        name: user.staffProfile.name,
        locationAssignments: user.staffProfile.locations.map(sl => ({
          locationId: sl.locationId,
          locationName: sl.location.name,
          isActive: sl.isActive
        }))
      } : null,
      allLocations: allLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        isActive: loc.isActive
      })),
      expectedLocationIds: user.staffProfile?.locations
        .filter(sl => sl.isActive)
        .map(sl => sl.location.id) || []
    }

    console.log(`✅ Debug: User locations result:`, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Debug: Error fetching user locations:", error)
    return NextResponse.json({ error: "Failed to fetch user locations" }, { status: 500 })
  }
}
