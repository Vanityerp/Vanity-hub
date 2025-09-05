#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function cleanupDuplicateLocations() {
  console.log('🧹 Starting cleanup of duplicate locations...\n')

  try {
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
              console.log(`     ❌ Failed to migrate service ${service.serviceId}:`, error)
            }
          } else {
            console.log(`     ⏭️  Service ${service.serviceId} already exists, skipping`)
          }
        }
      }
    }

    // Use a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all products
      const products = await tx.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })

      console.log(`📦 Found ${products.length} active products`)

      // 2. Get all product locations that are NOT in our target locations
      const oldProductLocations = await tx.productLocation.findMany({
        where: {
          locationId: { notIn: targetLocations }
        },
        include: {
          product: { select: { name: true } },
          location: { select: { name: true } }
        }
      })

      console.log(`🗑️ Found ${oldProductLocations.length} old product location records to delete`)

      // 3. Delete old product location records
      const deleteResult = await tx.productLocation.deleteMany({
        where: {
          locationId: { notIn: targetLocations }
        }
      })

      console.log(`✅ Deleted ${deleteResult.count} old product location records`)

      // 4. Verify current stock levels
      const currentProductLocations = await tx.productLocation.findMany({
        where: {
          locationId: { in: targetLocations }
        },
        include: {
          product: { select: { name: true } },
          location: { select: { name: true } }
        }
      })

      console.log(`📊 Current product location records: ${currentProductLocations.length}`)

      // Group by product to show stock summary
      const productStockSummary = new Map()
      
      for (const pl of currentProductLocations) {
        const productName = pl.product.name
        if (!productStockSummary.has(productName)) {
          productStockSummary.set(productName, { totalStock: 0, locations: [] })
        }
        
        const summary = productStockSummary.get(productName)
        summary.totalStock += pl.stock
        summary.locations.push({
          locationName: pl.location.name,
          stock: pl.stock
        })
      }

      return {
        productsProcessed: products.length,
        oldRecordsDeleted: deleteResult.count,
        currentRecords: currentProductLocations.length,
        productStockSummary: Array.from(productStockSummary.entries()).map(([name, data]) => ({
          productName: name,
          totalStock: data.totalStock,
          locations: data.locations
        }))
      }
    })

    console.log(`\n🎉 SUCCESS! Cleanup completed:`)
    console.log(`   📦 Products processed: ${result.productsProcessed}`)
    console.log(`   🗑️ Old records deleted: ${result.oldRecordsDeleted}`)
    console.log(`   📊 Current records: ${result.currentRecords}`)
    
    console.log(`\n📊 Stock Summary by Product:`)
    for (const product of result.productStockSummary) {
      console.log(`   ${product.productName}: Total ${product.totalStock} units`)
      for (const location of product.locations) {
        console.log(`     - ${location.locationName}: ${location.stock}`)
      }
    }

  } catch (error) {
    console.error('❌ Error cleaning up duplicate locations:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
cleanupDuplicateLocations()
