#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkTransferSystem() {
  console.log('🔍 Checking transfer system status...')

  try {
    // Check if online location exists
    const onlineLocation = await prisma.location.findFirst({
      where: {
        OR: [
          { id: 'online' },
          { name: { contains: 'Online' } }
        ]
      }
    })

    console.log('📍 Online Location:', onlineLocation ? `${onlineLocation.name} (${onlineLocation.id})` : 'NOT FOUND')

    // Check Flawless Foundation product
    const flawlessFoundation = await prisma.product.findFirst({
      where: {
        name: { contains: 'Flawless Foundation' }
      },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    if (flawlessFoundation) {
      console.log('\n📦 Flawless Foundation Product:')
      console.log(`   ID: ${flawlessFoundation.id}`)
      console.log(`   Name: ${flawlessFoundation.name}`)
      console.log(`   Is Retail: ${flawlessFoundation.isRetail}`)
      console.log(`   Locations:`)
      
      flawlessFoundation.locations.forEach(loc => {
        console.log(`     • ${loc.location.name}: ${loc.stock} units (ID: ${loc.locationId})`)
      })

      // Check specifically for online store stock
      const onlineStock = flawlessFoundation.locations.find(loc => 
        loc.locationId === onlineLocation?.id ||
        loc.location.name.toLowerCase().includes('online')
      )

      console.log(`\n🛒 Online Store Stock: ${onlineStock ? onlineStock.stock : 'NOT FOUND'} units`)
    } else {
      console.log('\n❌ Flawless Foundation product not found')
    }

    // Check D-Ring Road location
    const dRingLocation = await prisma.location.findFirst({
      where: {
        name: { contains: 'D-ring' }
      }
    })

    console.log(`\n📍 D-Ring Road Location: ${dRingLocation ? `${dRingLocation.name} (${dRingLocation.id})` : 'NOT FOUND'}`)

    if (flawlessFoundation && dRingLocation) {
      const dRingStock = flawlessFoundation.locations.find(loc => loc.locationId === dRingLocation.id)
      console.log(`📦 D-Ring Road Stock: ${dRingStock ? dRingStock.stock : 'NOT FOUND'} units`)
    }

    // Check all locations
    console.log('\n📍 All Locations:')
    const allLocations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    allLocations.forEach(loc => {
      console.log(`   • ${loc.name} (${loc.id})`)
    })

    // Test inventory adjustment API
    console.log('\n🧪 Testing inventory adjustment API...')
    
    if (flawlessFoundation && onlineLocation) {
      const testPayload = {
        productId: flawlessFoundation.id,
        locationId: onlineLocation.id,
        adjustmentType: 'remove',
        quantity: 1,
        reason: 'Test transfer',
        notes: 'Testing transfer system'
      }

      console.log('📤 Test payload:', testPayload)

      try {
        const response = await fetch('http://localhost:3000/api/inventory/adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ API Test Result:', result)
        } else {
          const error = await response.text()
          console.log('❌ API Test Failed:', error)
        }
      } catch (error) {
        console.log('❌ API Test Error:', error)
      }
    }

  } catch (error) {
    console.error('❌ Error checking transfer system:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  checkTransferSystem()
    .then(() => {
      console.log('\n🎉 Transfer system check completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

export { checkTransferSystem }
