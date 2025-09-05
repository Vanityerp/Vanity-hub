import { prisma } from '../lib/prisma'

async function checkStaff() {
  try {
    console.log("🔍 Checking staff in database...")
    
    const staff = await prisma.staffMember.findMany({
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📊 Total staff in database: ${staff.length}`)
    
    if (staff.length > 0) {
      console.log("\n👥 Staff found:")
      staff.forEach((staffMember, index) => {
        console.log(`  ${index + 1}. ${staffMember.name} (${staffMember.id})`)
        console.log(`     User: ${staffMember.user.email}`)
        console.log(`     Role: ${staffMember.user.role}`)
        console.log(`     Job Role: ${staffMember.jobRole}`)
        console.log(`     Status: ${staffMember.status}`)
        console.log(`     Locations: ${staffMember.locations.map(loc => loc.location.name).join(', ')}`)
        console.log(`     Home Service: ${staffMember.homeService}`)
        console.log("")
      })
    } else {
      console.log("❌ No staff found in database!")
      console.log("💡 You may need to seed the database with staff.")
    }
    
  } catch (error) {
    console.error("❌ Error checking staff:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStaff()
