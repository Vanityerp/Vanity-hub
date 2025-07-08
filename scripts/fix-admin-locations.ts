import { prisma } from '../lib/prisma'

async function fixAdminLocations() {
  try {
    console.log("🔧 Fixing admin user location access...")
    
    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })
    
    if (!adminUser) {
      console.log("❌ No admin user found!")
      return
    }
    
    console.log(`📍 Found admin user: ${adminUser.email}`)
    console.log(`📍 Current locations: ${JSON.stringify(adminUser.locations)}`)
    
    // Update admin user to have access to all locations
    const updatedUser = await prisma.user.update({
      where: {
        id: adminUser.id
      },
      data: {
        locations: ["all"], // Give admin access to all locations
        name: "Admin User" // Also set a name if it's missing
      }
    })
    
    console.log(`✅ Updated admin user location access`)
    console.log(`✅ New locations: ${JSON.stringify(updatedUser.locations)}`)
    console.log(`✅ Name: ${updatedUser.name}`)
    
  } catch (error) {
    console.error("❌ Error fixing admin locations:", error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminLocations()
