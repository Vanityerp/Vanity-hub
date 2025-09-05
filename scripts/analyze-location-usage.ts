import { prisma } from '../lib/prisma'

async function analyzeLocationUsage() {
  try {
    console.log('🔍 Analyzing location usage in the database...\n')
    
    // Get all locations
    const allLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`📍 Total locations found: ${allLocations.length}`)
    console.log('\nAll locations:')
    allLocations.forEach((loc, index) => {
      console.log(`  ${index + 1}. ${loc.name} (${loc.id}) - Active: ${loc.isActive}`)
    })
    
    // Group by name to identify duplicates
    const locationsByName = new Map<string, typeof allLocations>()
    allLocations.forEach(loc => {
      const name = loc.name.toLowerCase()
      if (!locationsByName.has(name)) {
        locationsByName.set(name, [])
      }
      locationsByName.get(name)!.push(loc)
    })
    
    console.log('\n🔍 Duplicate analysis:')
    for (const [name, locations] of locationsByName) {
      if (locations.length > 1) {
        console.log(`\n❌ DUPLICATE: "${name}" (${locations.length} entries)`)
        locations.forEach((loc, index) => {
          console.log(`   ${index + 1}. ID: ${loc.id} | Active: ${loc.isActive} | Created: ${loc.createdAt}`)
        })
      } else {
        console.log(`✅ UNIQUE: "${name}" - ID: ${locations[0].id}`)
      }
    }
    
    // Check which locations have associated data
    console.log('\n📊 Checking location usage in other tables...')
    
    for (const location of allLocations) {
      console.log(`\n📍 Location: ${location.name} (${location.id})`)
      
      // Check product locations
      const productCount = await prisma.productLocation.count({
        where: { locationId: location.id }
      })
      console.log(`   📦 Products: ${productCount}`)
      
      // Check appointments
      const appointmentCount = await prisma.appointment.count({
        where: { locationId: location.id }
      })
      console.log(`   📅 Appointments: ${appointmentCount}`)
      
      // Check staff locations
      const staffCount = await prisma.staffLocation.count({
        where: { locationId: location.id }
      })
      console.log(`   👥 Staff assignments: ${staffCount}`)
      
      // Check service locations
      const serviceCount = await prisma.locationService.count({
        where: { locationId: location.id }
      })
      console.log(`   🛠️ Services: ${serviceCount}`)
      
      const totalUsage = productCount + appointmentCount + staffCount + serviceCount
      console.log(`   📊 Total usage: ${totalUsage}`)
      
      if (totalUsage === 0) {
        console.log(`   ⚠️  UNUSED LOCATION - Safe to delete`)
      }
    }
    
    // Identify preferred locations (short IDs vs UUIDs)
    console.log('\n🎯 Identifying preferred locations to keep:')
    const shortIdLocations = allLocations.filter(loc => loc.id.length <= 10)
    const uuidLocations = allLocations.filter(loc => loc.id.length > 10)
    
    console.log(`\n📋 Short ID locations (${shortIdLocations.length}):`)
    shortIdLocations.forEach(loc => {
      console.log(`   - ${loc.name} (${loc.id})`)
    })
    
    console.log(`\n🔗 UUID locations (${uuidLocations.length}):`)
    uuidLocations.forEach(loc => {
      console.log(`   - ${loc.name} (${loc.id})`)
    })
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    
    for (const [name, locations] of locationsByName) {
      if (locations.length > 1) {
        // Find the preferred location (short ID first, then by creation date)
        const shortIdLocation = locations.find(loc => loc.id.length <= 10)
        const preferredLocation = shortIdLocation || locations.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0]
        
        const duplicatesToDelete = locations.filter(loc => loc.id !== preferredLocation.id)
        
        console.log(`\n🎯 For "${name}":`)
        console.log(`   ✅ KEEP: ${preferredLocation.name} (${preferredLocation.id})`)
        console.log(`   ❌ DELETE: ${duplicatesToDelete.map(loc => `${loc.id}`).join(', ')}`)
      }
    }
    
    return {
      totalLocations: allLocations.length,
      duplicateGroups: Array.from(locationsByName.entries()).filter(([_, locs]) => locs.length > 1),
      shortIdLocations,
      uuidLocations
    }
    
  } catch (error) {
    console.error('❌ Error analyzing location usage:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the analysis
analyzeLocationUsage()
  .then(result => {
    console.log('\n✅ Analysis completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Analysis failed:', error)
    process.exit(1)
  })
