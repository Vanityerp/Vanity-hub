import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTemporaryPassword, generateUsername, hashPassword, mapStaffRoleToUserRole } from "@/lib/auth-utils"

/**
 * GET /api/staff/credentials
 * 
 * Get all staff members with their credential status
 */
export async function GET() {
  try {
    console.log("🔄 Fetching staff credentials...")
    
    const staffMembers = await prisma.staffMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
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

    const staffWithCredentials = staffMembers.map(staff => ({
      id: staff.id,
      name: staff.name,
      employeeNumber: staff.employeeNumber,
      jobRole: staff.jobRole,
      status: staff.status,
      hasCredentials: !!staff.user,
      user: staff.user ? {
        id: staff.user.id,
        email: staff.user.email,
        role: staff.user.role,
        isActive: staff.user.isActive,
        createdAt: staff.user.createdAt,
        updatedAt: staff.user.updatedAt
      } : null,
      locations: staff.locations.map(sl => ({
        id: sl.location.id,
        name: sl.location.name,
        city: sl.location.city,
        isActive: sl.isActive
      }))
    }))

    console.log(`✅ Successfully fetched ${staffWithCredentials.length} staff members`)
    return NextResponse.json({ staff: staffWithCredentials })
  } catch (error) {
    console.error("❌ Error fetching staff credentials:", error)
    return NextResponse.json({ error: "Failed to fetch staff credentials" }, { status: 500 })
  }
}

/**
 * POST /api/staff/credentials
 * 
 * Create login credentials for a staff member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, locationIds, generatePassword = true, customPassword } = body

    console.log(`🔄 Creating credentials for staff ID: ${staffId}`)

    // Get staff member details
    const staffMember = await prisma.staffMember.findUnique({
      where: { id: staffId },
      include: {
        user: true,
        locations: true
      }
    })

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    if (staffMember.user) {
      return NextResponse.json({ error: "Staff member already has login credentials" }, { status: 400 })
    }

    // Generate username and password
    const username = generateUsername(staffMember.name, staffMember.employeeNumber || undefined)
    const email = `${username}@vanityhub.com`
    const password = generatePassword ? generateTemporaryPassword() : customPassword
    
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = hashPassword(password)

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: mapStaffRoleToUserRole(staffMember.jobRole || 'staff'),
        isActive: staffMember.status === 'ACTIVE'
      }
    })

    // Update staff member with user ID
    await prisma.staffMember.update({
      where: { id: staffId },
      data: { userId: user.id }
    })

    // Update location assignments if provided
    if (locationIds && locationIds.length > 0) {
      // Remove existing location assignments
      await prisma.staffLocation.deleteMany({
        where: { staffId }
      })

      // Add new location assignments
      await Promise.all(
        locationIds.map((locationId: string) =>
          prisma.staffLocation.create({
            data: {
              staffId,
              locationId,
              isActive: true
            }
          })
        )
      )
    }

    console.log(`✅ Successfully created credentials for ${staffMember.name}`)
    
    return NextResponse.json({
      success: true,
      credentials: {
        username: email,
        temporaryPassword: generatePassword ? password : undefined,
        staffId,
        userId: user.id
      }
    }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating staff credentials:", error)
    return NextResponse.json({ error: "Failed to create staff credentials" }, { status: 500 })
  }
}
