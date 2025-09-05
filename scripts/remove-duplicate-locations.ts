import { prisma } from '../lib/prisma'

async function removeDuplicateLocations() {
  try {
    console.log('🧹 Starting removal of duplicate locations...\n')
    
    // Define the locations to keep (short IDs) and their duplicates to remove
    const locationsToCleanup = [
      {
        keep: 'loc1',
        remove: 'cmcg6hmrs00006pi1ga9kr60r',
        name: 'D-ring road'
      },
      {
        keep: 'loc2', 
        remove: 'cmcg6hms000016pi13rciazpk',
        name: 'Muaither'
      },
      {
        keep: 'loc3',
        remove: 'cmcg6hms700026pi1wotaezf9', 
        name: 'Medinat Khalifa'
      },
      {
        keep: 'home',
        remove: 'cmcg6hmse00036pi1w6aw6r92',
        name: 'Home service'
      },
      {
        keep: 'online',
        remove: 'cmcg6hmsj00046pi10dzl2cs8',
        name: 'Online store'
      }
    ]
    
    console.log('📋 Cleanup plan:')
    locationsToCleanup.forEach(item => {
      console.log(`   ${item.name}: KEEP ${item.keep}, DELETE ${item.remove}`)
    })
    
    // Step 1: Migrate services from UUID locations to short ID locations
    console.log('\n🔄 Step 1: Migrating services...')
    
    for (const item of locationsToCleanup) {
      console.log(`\n📍 Processing ${item.name}...`)
      
      // Check if the location to keep exists
      const keepLocation = await prisma.location.findUnique({
        where: { id: item.keep }
      })
      
      if (!keepLocation) {
        console.log(`   ❌ Location to keep (${item.keep}) not found! Skipping...`)
        continue
      }
      
      // Check if the location to remove exists
      const removeLocation = await prisma.location.findUnique({
        where: { id: item.remove }
      })
      
      if (!removeLocation) {
        console.log(`   ⚠️  Location to remove (${item.remove}) not found. Already cleaned up?`)
        continue
      }
      
      // Get services from the location to remove
      const servicesToMigrate = await prisma.locationService.findMany({
        where: { locationId: item.remove }
      })
      
      console.log(`   📦 Found ${servicesToMigrate.length} services to migrate`)
      
      if (servicesToMigrate.length > 0) {
        // Check which services already exist for the keep location
        const existingServices = await prisma.locationService.findMany({
          where: { locationId: item.keep }
        })
        
        const existingServiceIds = new Set(existingServices.map(s => s.serviceId))
        
        // Migrate services that don't already exist
        for (const service of servicesToMigrate) {
          if (!existingServiceIds.has(service.serviceId)) {
            try {
              await prisma.locationService.create({
                data: {
                  locationId: item.keep,
                  serviceId: service.serviceId,
                  price: service.price,
                  isActive: service.isActive
                }
              })
              console.log(`     ✅ Migrated service ${service.serviceId}`)
            } catch (error) {
              console.log(`     ❌ Failed to migrate service ${service.serviceId}`)
            }
          } else {
            console.log(`     ⏭️  Service ${service.serviceId} already exists, skipping`)
          }
        }
      }
    }
    
    // Step 2: Remove duplicate locations
    console.log('\n🗑️  Step 2: Removing duplicate locations...')
    
    for (const item of locationsToCleanup) {
      console.log(`\n📍 Removing duplicate ${item.name} (${item.remove})...`)
      
      try {
        // Check if location exists before trying to delete
        const locationToDelete = await prisma.location.findUnique({
          where: { id: item.remove }
        })
        
        if (!locationToDelete) {
          console.log(`   ⚠️  Location ${item.remove} not found, already deleted?`)
          continue
        }
        
        // First, delete all related data
        console.log('   🔄 Deleting location services...')
        const deletedServices = await prisma.locationService.deleteMany({
          where: { locationId: item.remove }
        })
        console.log(`     ✅ Deleted ${deletedServices.count} services`)
        
        console.log('   🔄 Deleting staff locations...')
        const deletedStaff = await prisma.staffLocation.deleteMany({
          where: { locationId: item.remove }
        })
        console.log(`     ✅ Deleted ${deletedStaff.count} staff assignments`)
        
        console.log('   🔄 Deleting product locations...')
        const deletedProducts = await prisma.productLocation.deleteMany({
          where: { locationId: item.remove }
        })
        console.log(`     ✅ Deleted ${deletedProducts.count} product locations`)
        
        console.log('   🔄 Deleting location...')
        await prisma.location.delete({
          where: { id: item.remove }
        })
        
        console.log(`   ✅ Successfully removed ${item.name} (${item.remove})`)
        
      } catch (error) {
        console.log(`   ❌ Failed to remove ${item.name} (${item.remove}):`, error)
      }
    }
    
    // Step 3: Verify cleanup
    console.log('\n✅ Step 3: Verifying cleanup...')
    
    const remainingLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`\n📊 Remaining locations (${remainingLocations.length}):`)
    remainingLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.name} (${loc.id})`)
    })
    
    // Check for any remaining duplicates
    const locationsByName = new Map<string, typeof remainingLocations>()
    remainingLocations.forEach(loc => {
      const name = loc.name.toLowerCase()
      if (!locationsByName.has(name)) {
        locationsByName.set(name, [])
      }
      locationsByName.get(name)!.push(loc)
    })
    
    const duplicatesRemaining = Array.from(locationsByName.entries()).filter(([_, locs]) => locs.length > 1)
    
    if (duplicatesRemaining.length === 0) {
      console.log('\n🎉 SUCCESS: No duplicate locations remaining!')
    } else {
      console.log('\n⚠️  WARNING: Some duplicates still remain:')
      duplicatesRemaining.forEach(([name, locs]) => {
        console.log(`   ${name}: ${locs.map(l => l.id).join(', ')}`)
      })
    }
    
    // Final verification - check service counts
    console.log('\n📊 Final service counts:')
    for (const item of locationsToCleanup) {
      try {
        const serviceCount = await prisma.locationService.count({
          where: { locationId: item.keep }
        })
        console.log(`   ${item.name} (${item.keep}): ${serviceCount} services`)
      } catch (error) {
        console.log(`   ${item.name} (${item.keep}): Error checking services`)
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!')
    
    return {
      success: true,
      remainingLocations: remainingLocations.length,
      duplicatesRemaining: duplicatesRemaining.length
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
removeDuplicateLocations()
  .then(result => {
    console.log('\n🎉 Cleanup completed successfully:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
