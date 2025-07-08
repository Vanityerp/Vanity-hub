#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function debugTransferStock() {
  console.log('🔍 Debugging transfer stock lookup...')

  try {
    // 1. Get all locations
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    })

    console.log('\n📍 Available Locations:')
    locations.forEach(loc => {
      console.log(`   ${loc.id} -> ${loc.name}`)
    })

    // 2. Find the Clip-In Hair Extensions product
    const product = await prisma.product.findFirst({
      where: { 
        name: { contains: 'Clip-In Hair Extensions' },
        isActive: true 
      },
      include: {
        locations: {
          include: {
            location: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!product) {
      console.log('❌ Product not found')
      return
    }

    console.log(`\n📦 Product: ${product.name} (${product.id})`)
    console.log(`   SKU: ${product.sku}`)
    
    console.log('\n📊 Product Location Stock:')
    product.locations.forEach(pl => {
      console.log(`   Location ID: ${pl.locationId}`)
      console.log(`   Location Name: ${pl.location.name}`)
      console.log(`   Stock: ${pl.stock}`)
      console.log(`   ---`)
    })

    // 3. Check specifically for D-Ring Road
    const dRingLocation = locations.find(loc => 
      loc.name.toLowerCase().includes('d-ring') || 
      loc.name.toLowerCase().includes('dring')
    )

    if (dRingLocation) {
      console.log(`\n🎯 D-Ring Road Location:`)
      console.log(`   ID: ${dRingLocation.id}`)
      console.log(`   Name: ${dRingLocation.name}`)

      const dRingStock = product.locations.find(pl => pl.locationId === dRingLocation.id)
      console.log(`   Stock for this product: ${dRingStock?.stock || 0}`)
    } else {
      console.log('\n❌ D-Ring Road location not found')
    }

    // 4. Total stock calculation
    const totalStock = product.locations.reduce((total, pl) => total + pl.stock, 0)
    console.log(`\n📈 Total Stock: ${totalStock}`)

  } catch (error) {
    console.error('❌ Error debugging transfer stock:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
debugTransferStock()
