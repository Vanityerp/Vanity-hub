import { prisma } from '../lib/prisma'

async function checkLocations() {
  try {
    console.log("🔍 Checking locations in database...")
    
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📊 Total locations in database: ${locations.length}`)
    
    if (locations.length > 0) {
      console.log("\n📍 Locations found:")
      locations.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.name} (${location.id})`)
        console.log(`     Address: ${location.address}, ${location.city}`)
        console.log(`     Active: ${location.isActive}`)
        console.log(`     Created: ${location.createdAt}`)
        console.log("")
      })
    } else {
      console.log("❌ No locations found in database!")
      console.log("💡 You may need to seed the database with locations.")
    }
    
    // Check active locations specifically
    const activeLocations = await prisma.location.findMany({
      where: {
        isActive: true
      }
    })
    
    console.log(`✅ Active locations: ${activeLocations.length}`)
    
  } catch (error) {
    console.error("❌ Error checking locations:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLocations()
