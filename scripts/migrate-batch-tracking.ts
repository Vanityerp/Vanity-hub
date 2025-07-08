#!/usr/bin/env tsx

/**
 * Database Migration Script: Add Product Batch Tracking
 * 
 * This script applies the new ProductBatch model to the database
 * and creates sample batch data for testing the expiry alerts system.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting batch tracking migration...')

  try {
    // 1. Apply the schema changes (this should be done via Prisma migrate)
    console.log('📋 Schema changes should be applied via: npx prisma db push')
    
    // 2. Check if ProductBatch table exists by trying to count records
    try {
      const batchCount = await prisma.productBatch.count()
      console.log(`✅ ProductBatch table exists with ${batchCount} records`)
    } catch (error) {
      console.error('❌ ProductBatch table does not exist. Please run: npx prisma db push')
      return
    }

    // 3. Get some existing products and locations for sample data
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      },
      take: 10
    })

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      take: 5
    })

    if (products.length === 0 || locations.length === 0) {
      console.log('⚠️ No products or locations found. Skipping sample data creation.')
      return
    }

    console.log(`📦 Found ${products.length} products and ${locations.length} locations`)

    // 4. Create sample batch data for testing
    const sampleBatches = []
    let batchCounter = 1

    for (const product of products.slice(0, 6)) {
      for (const location of locations.slice(0, 2)) {
        // Create 2-3 batches per product-location combination
        for (let i = 0; i < 2; i++) {
          const batchNumber = `BATCH${batchCounter.toString().padStart(6, '0')}`
          
          // Create batches with different expiry dates for testing
          const daysFromNow = i === 0 
            ? Math.floor(Math.random() * 30) + 5  // 5-35 days (some expiring soon)
            : Math.floor(Math.random() * 180) + 60 // 60-240 days (safe)
          
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + daysFromNow)
          
          const quantity = Math.floor(Math.random() * 50) + 10 // 10-60 units
          const costPrice = product.cost ? product.cost * (0.8 + Math.random() * 0.4) : null // ±20% variation

          sampleBatches.push({
            productId: product.id,
            locationId: location.id,
            batchNumber,
            expiryDate,
            quantity,
            costPrice,
            supplierInfo: `Supplier ${Math.floor(Math.random() * 5) + 1}`,
            notes: `Sample batch for testing - ${product.name}`,
            isActive: true
          })

          batchCounter++
        }
      }
    }

    // 5. Insert sample batches
    console.log(`🔄 Creating ${sampleBatches.length} sample batches...`)
    
    for (const batch of sampleBatches) {
      try {
        await prisma.productBatch.create({
          data: batch
        })
        console.log(`✅ Created batch ${batch.batchNumber} for ${batch.productId}`)
      } catch (error) {
        console.log(`⚠️ Skipped batch ${batch.batchNumber} (may already exist)`)
      }
    }

    // 6. Summary
    const finalBatchCount = await prisma.productBatch.count()
    const expiringBatches = await prisma.productBatch.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        isActive: true
      }
    })

    console.log('\n📊 Migration Summary:')
    console.log(`✅ Total batches in database: ${finalBatchCount}`)
    console.log(`⚠️ Batches expiring within 30 days: ${expiringBatches}`)
    console.log('\n🎉 Batch tracking migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Test the inventory alerts dashboard to see expiry alerts')
    console.log('2. Test dispose functionality on expired batches')
    console.log('3. Test discount functionality on near-expiry batches')
    console.log('4. Test reorder functionality on low stock items')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
main()
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
