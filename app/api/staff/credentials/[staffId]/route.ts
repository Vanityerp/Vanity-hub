import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTemporaryPassword, hashPassword } from "@/lib/auth-utils"

/**
 * PUT /api/staff/credentials/[staffId]
 * 
 * Update staff member credentials (reset password, update locations, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params
    const body = await request.json()
    const { action, locationIds, newPassword } = body

    console.log(`🔄 Updating credentials for staff ID: ${staffId}, action: ${action}`)

    // Get staff member with user details
    const staffMember = await prisma.staffMember.findUnique({
      where: { id: staffId },
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    if (!staffMember.user) {
      return NextResponse.json({ error: "Staff member has no login credentials" }, { status: 400 })
    }

    let result: any = { success: true }

    switch (action) {
      case 'reset_password':
        const tempPassword = generateTemporaryPassword()
        const hashedPassword = hashPassword(tempPassword)
        
        await prisma.user.update({
          where: { id: staffMember.user.id },
          data: { password: hashedPassword }
        })
        
        result.temporaryPassword = tempPassword
        console.log(`✅ Password reset for ${staffMember.name}`)
        break

      case 'update_password':
        if (!newPassword) {
          return NextResponse.json({ error: "New password is required" }, { status: 400 })
        }
        
        const newHashedPassword = hashPassword(newPassword)
        await prisma.user.update({
          where: { id: staffMember.user.id },
          data: { password: newHashedPassword }
        })
        
        console.log(`✅ Password updated for ${staffMember.name}`)
        break

      case 'update_locations':
        if (!locationIds || !Array.isArray(locationIds)) {
          return NextResponse.json({ error: "Location IDs array is required" }, { status: 400 })
        }

        // Remove existing location assignments
        await prisma.staffLocation.deleteMany({
          where: { staffId }
        })

        // Add new location assignments
        if (locationIds.length > 0) {
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

        console.log(`✅ Location assignments updated for ${staffMember.name}`)
        break

      case 'toggle_active':
        await prisma.user.update({
          where: { id: staffMember.user.id },
          data: { isActive: !staffMember.user.isActive }
        })
        
        result.isActive = !staffMember.user.isActive
        console.log(`✅ Account status toggled for ${staffMember.name}: ${result.isActive ? 'Active' : 'Inactive'}`)
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("❌ Error updating staff credentials:", error)
    return NextResponse.json({ error: "Failed to update staff credentials" }, { status: 500 })
  }
}

/**
 * DELETE /api/staff/credentials/[staffId]
 * 
 * Remove login credentials for a staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params

    console.log(`🔄 Removing credentials for staff ID: ${staffId}`)

    // Get staff member with user details
    const staffMember = await prisma.staffMember.findUnique({
      where: { id: staffId },
      include: { user: true }
    })

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    if (!staffMember.user) {
      return NextResponse.json({ error: "Staff member has no login credentials" }, { status: 400 })
    }

    // Remove user account (this will cascade to remove staff member due to foreign key)
    await prisma.user.delete({
      where: { id: staffMember.user.id }
    })

    console.log(`✅ Successfully removed credentials for ${staffMember.name}`)
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ Error removing staff credentials:", error)
    return NextResponse.json({ error: "Failed to remove staff credentials" }, { status: 500 })
  }
}
