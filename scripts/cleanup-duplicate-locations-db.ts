#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function cleanupDuplicateLocationsDB() {
  console.log('🧹 Cleaning up duplicate locations from database...')

  try {
    // Define the target locations we want to keep (new clean IDs)
    const targetLocationIds = ['loc1', 'loc2', 'loc3', 'home', 'online']

    // Use a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all locations
      const allLocations = await tx.location.findMany({
        select: { id: true, name: true, isActive: true }
      })

      console.log(`📍 Found ${allLocations.length} total locations`)
      
      // 2. Identify old locations to delete (not in target list)
      const oldLocations = allLocations.filter(loc => !targetLocationIds.includes(loc.id))
      const keepLocations = allLocations.filter(loc => targetLocationIds.includes(loc.id))

      console.log(`🗑️ Locations to delete: ${oldLocations.length}`)
      oldLocations.forEach(loc => {
        console.log(`   - ${loc.id} (${loc.name})`)
      })

      console.log(`✅ Locations to keep: ${keepLocations.length}`)
      keepLocations.forEach(loc => {
        console.log(`   - ${loc.id} (${loc.name})`)
      })

      // 3. Check if any product locations reference the old locations
      const productLocationsUsingOldIds = await tx.productLocation.findMany({
        where: {
          locationId: { in: oldLocations.map(loc => loc.id) }
        },
        include: {
          product: { select: { name: true } },
          location: { select: { name: true } }
        }
      })

      if (productLocationsUsingOldIds.length > 0) {
        console.log(`⚠️ Found ${productLocationsUsingOldIds.length} product locations using old location IDs`)
        console.log('❌ Cannot delete old locations - they are still referenced by products')
        console.log('   This should have been cleaned up by the previous script')
        return {
          success: false,
          message: 'Old locations are still referenced by products',
          oldLocationsDeleted: 0,
          productLocationsFound: productLocationsUsingOldIds.length
        }
      }

      // 4. Delete old location records
      const deleteResult = await tx.location.deleteMany({
        where: {
          id: { in: oldLocations.map(loc => loc.id) }
        }
      })

      console.log(`✅ Deleted ${deleteResult.count} old location records`)

      // 5. Verify remaining locations
      const remainingLocations = await tx.location.findMany({
        select: { id: true, name: true, isActive: true }
      })

      console.log(`📊 Remaining locations: ${remainingLocations.length}`)
      remainingLocations.forEach(loc => {
        console.log(`   - ${loc.id} (${loc.name}) - ${loc.isActive ? 'Active' : 'Inactive'}`)
      })

      return {
        success: true,
        oldLocationsDeleted: deleteResult.count,
        remainingLocations: remainingLocations.length,
        locationsList: remainingLocations
      }
    })

    if (result.success) {
      console.log(`\n🎉 SUCCESS! Database cleanup completed:`)
      console.log(`   🗑️ Old locations deleted: ${result.oldLocationsDeleted}`)
      console.log(`   📊 Remaining locations: ${result.remainingLocations}`)
      console.log(`\n✅ The location provider should now only return the clean location IDs`)
    } else {
      console.log(`\n❌ FAILED: ${result.message}`)
      console.log(`   📊 Product locations found: ${result.productLocationsFound}`)
    }

  } catch (error) {
    console.error('❌ Error cleaning up duplicate locations:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
cleanupDuplicateLocationsDB()
