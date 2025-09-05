import { prisma } from '../lib/prisma'

async function assignStaffLocations() {
  try {
    console.log("🔧 Assigning staff to their locations...")
    
    // Get all staff members with their location assignments
    const staff = await prisma.staffMember.findMany({
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      }
    })
    
    console.log(`📊 Found ${staff.length} staff members`)
    
    // Define location assignments for each staff member
    const staffLocationAssignments = {
      "sarah@vanityhub.com": ["loc1", "loc2"], // D-ring road and Muaither
      "ahmed@vanityhub.com": ["loc1", "loc3"], // D-ring road and Medinat Khalifa  
      "maria@vanityhub.com": ["loc2", "loc3", "home"] // Muaither, Medinat Khalifa, and Home service
    }
    
    for (const staffMember of staff) {
      const email = staffMember.user.email
      const assignedLocations = staffLocationAssignments[email]
      
      if (!assignedLocations) {
        console.log(`⏭️ Skipping ${staffMember.name} (${email}) - no assignment defined`)
        continue
      }
      
      console.log(`📍 Processing ${staffMember.name} (${email})`)
      console.log(`📍 Current locations: ${staffMember.locations.map(l => l.location.name).join(', ')}`)
      console.log(`📍 Should be assigned to: ${assignedLocations.join(', ')}`)
      
      // Remove existing location assignments
      await prisma.staffLocation.deleteMany({
        where: {
          staffId: staffMember.id
        }
      })
      
      // Add new location assignments
      for (const locationId of assignedLocations) {
        try {
          await prisma.staffLocation.create({
            data: {
              staffId: staffMember.id,
              locationId: locationId,
              isActive: true
            }
          })
          console.log(`✅ Assigned ${staffMember.name} to location: ${locationId}`)
        } catch (error) {
          console.error(`❌ Failed to assign ${staffMember.name} to ${locationId}:`, error)
        }
      }
    }
    
    console.log("✅ Staff location assignments completed")
    
  } catch (error) {
    console.error("❌ Error assigning staff locations:", error)
  } finally {
    await prisma.$disconnect()
  }
}

assignStaffLocations()
