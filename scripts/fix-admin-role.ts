import { prisma } from '../lib/prisma'

async function fixAdminRole() {
  try {
    console.log("🔧 Fixing admin@vanityhub.com user role...")
    
    // Get the admin@vanityhub.com user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@vanityhub.com'
      }
    })
    
    if (!adminUser) {
      console.log("❌ admin@vanityhub.com user not found!")
      return
    }
    
    console.log(`📍 Found user: ${adminUser.email}`)
    console.log(`📍 Current role: ${adminUser.role}`)
    console.log(`📍 Current status: ${adminUser.isActive ? 'Active' : 'Inactive'}`)
    
    // Update admin user to have ADMIN role
    const updatedUser = await prisma.user.update({
      where: {
        id: adminUser.id
      },
      data: {
        role: "ADMIN", // Set to super admin role
        isActive: true // Ensure the account is active
      }
    })
    
    console.log(`✅ Updated user role to: ${updatedUser.role}`)
    console.log(`✅ User status: ${updatedUser.isActive ? 'Active' : 'Inactive'}`)
    
    // Also check if there's a staff profile associated and update it
    const staffProfile = await prisma.staffMember.findFirst({
      where: {
        userId: adminUser.id
      }
    })
    
    if (staffProfile) {
      console.log(`📍 Found associated staff profile: ${staffProfile.name}`)
      console.log(`📍 Current job role: ${staffProfile.jobRole}`)
      
      // Update staff profile to reflect admin role
      const updatedStaff = await prisma.staffMember.update({
        where: {
          id: staffProfile.id
        },
        data: {
          jobRole: "super_admin", // Set the job role to super_admin
          status: "ACTIVE" // Ensure staff profile is active
        }
      })
      
      console.log(`✅ Updated staff job role to: ${updatedStaff.jobRole}`)
      console.log(`✅ Staff status: ${updatedStaff.status}`)
    } else {
      console.log("ℹ️ No staff profile found for this user")
    }
    
    console.log("🎉 Admin role fix completed successfully!")
    
  } catch (error) {
    console.error("❌ Error fixing admin role:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
fixAdminRole()
