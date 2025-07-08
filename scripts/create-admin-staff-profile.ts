import { prisma } from '../lib/prisma'

async function createAdminStaffProfile() {
  try {
    console.log("🔧 Creating staff profile for admin user...")
    
    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
      include: {
        staffProfile: true
      }
    })
    
    if (!adminUser) {
      console.log("❌ No admin user found!")
      return
    }
    
    console.log(`📍 Found admin user: ${adminUser.email}`)
    
    if (adminUser.staffProfile) {
      console.log("✅ Admin user already has a staff profile")
      console.log(`📍 Staff profile: ${adminUser.staffProfile.name}`)
      return
    }
    
    // Create staff profile for admin
    const staffProfile = await prisma.staffMember.create({
      data: {
        userId: adminUser.id,
        name: "Admin User",
        phone: "(974) 000-0000",
        avatar: "AU",
        color: "bg-red-100 text-red-800",
        jobRole: "super_admin",
        homeService: true,
        status: "ACTIVE"
      }
    })
    
    console.log(`✅ Created staff profile for admin: ${staffProfile.name}`)
    
    // Get all location IDs
    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    })
    
    console.log(`📍 Found ${locations.length} locations to assign`)
    
    // Assign admin to all locations
    for (const location of locations) {
      await prisma.staffLocation.create({
        data: {
          staffId: staffProfile.id,
          locationId: location.id,
          isActive: true
        }
      })
      console.log(`✅ Assigned admin to location: ${location.name}`)
    }
    
    console.log("✅ Admin staff profile created and assigned to all locations")
    
  } catch (error) {
    console.error("❌ Error creating admin staff profile:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminStaffProfile()
