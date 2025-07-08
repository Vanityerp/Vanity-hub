#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function addStockToAllLocations() {
  console.log('🚀 Adding 10 stock to all locations for all products...')

  try {
    // Define the specific locations we want to add stock to
    const targetLocations = ['loc1', 'loc2', 'loc3', 'online'] // D-Ring Road, Muaither, Medinat Khalifa, Online Store
    const stockToAdd = 10

    // Use a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get all active products
      const products = await tx.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      })

      console.log(`📦 Found ${products.length} active products`)

      // 2. Verify all target locations exist
      const locations = await tx.location.findMany({
        where: { 
          id: { in: targetLocations },
          isActive: true 
        },
        select: { id: true, name: true }
      })

      console.log(`📍 Found ${locations.length} target locations:`, locations.map(l => l.name).join(', '))

      if (locations.length !== targetLocations.length) {
        const missingLocations = targetLocations.filter(id => !locations.some(l => l.id === id))
        throw new Error(`Missing locations: ${missingLocations.join(', ')}`)
      }

      // 3. Add stock to each product at each location
      const updates = []

      for (const product of products) {
        for (const location of locations) {
          // Get current stock level
          const currentProductLocation = await tx.productLocation.findUnique({
            where: {
              productId_locationId: {
                productId: product.id,
                locationId: location.id
              }
            }
          })

          const currentStock = currentProductLocation?.stock || 0
          const newStock = currentStock + stockToAdd

          // Update or create product location record
          await tx.productLocation.upsert({
            where: {
              productId_locationId: {
                productId: product.id,
                locationId: location.id
              }
            },
            update: {
              stock: newStock,
              updatedAt: new Date()
            },
            create: {
              productId: product.id,
              locationId: location.id,
              stock: stockToAdd,
              isActive: true
            }
          })

          updates.push({
            productId: product.id,
            productName: product.name,
            locationId: location.id,
            locationName: location.name,
            previousStock: currentStock,
            newStock: newStock,
            stockAdded: stockToAdd
          })

          console.log(`   ✅ ${product.name} @ ${location.name}: ${currentStock} → ${newStock}`)
        }
      }

      console.log(`✅ Updated stock for ${updates.length} product-location combinations`)

      return {
        productsUpdated: products.length,
        locationsUpdated: locations.length,
        totalUpdates: updates.length,
        stockAddedPerLocation: stockToAdd,
        locations: locations.map(l => ({ id: l.id, name: l.name }))
      }
    })

    console.log(`\n🎉 SUCCESS! Bulk stock addition completed:`)
    console.log(`   📦 Products updated: ${result.productsUpdated}`)
    console.log(`   📍 Locations updated: ${result.locationsUpdated}`)
    console.log(`   🔄 Total updates: ${result.totalUpdates}`)
    console.log(`   📈 Stock added per location: ${result.stockAddedPerLocation}`)
    console.log(`   🏢 Locations: ${result.locations.map(l => l.name).join(', ')}`)
    
    // Show a summary of stock levels
    console.log(`\n📊 Stock Summary:`)
    for (const location of result.locations) {
      const stockCount = await prisma.productLocation.count({
        where: { 
          locationId: location.id,
          stock: { gt: 0 }
        }
      })
      const totalStock = await prisma.productLocation.aggregate({
        where: { locationId: location.id },
        _sum: { stock: true }
      })
      console.log(`   ${location.name}: ${stockCount} products with stock, total: ${totalStock._sum.stock || 0} units`)
    }

  } catch (error) {
    console.error('❌ Error adding stock to all locations:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addStockToAllLocations()
