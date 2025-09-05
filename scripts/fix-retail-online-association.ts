#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function fixRetailOnlineAssociation() {
  console.log('🔧 Fixing retail product association with online store...')

  try {
    // First, check if the "online" location exists
    let onlineLocation = await prisma.location.findFirst({
      where: {
        OR: [
          { id: 'online' },
          { name: { contains: 'Online' } }
        ]
      }
    })

    if (!onlineLocation) {
      console.log('📍 Creating online store location...')
      onlineLocation = await prisma.location.create({
        data: {
          id: 'online',
          name: 'Online store',
          address: 'E-commerce Platform',
          city: 'Doha',
          state: 'Doha',
          zipCode: '00001',
          country: 'Qatar',
          phone: '+974 1234 5682',
          email: 'online@vanityhub.com',
          isActive: true
        }
      })
      console.log('✅ Created online store location:', onlineLocation.name)
    } else {
      console.log('✅ Found online store location:', onlineLocation.name, '(ID:', onlineLocation.id, ')')
    }

    // Get all retail products
    const retailProducts = await prisma.product.findMany({
      where: {
        isRetail: true,
        isActive: true
      },
      include: {
        locations: true
      }
    })

    console.log(`📦 Found ${retailProducts.length} retail products`)

    let associatedCount = 0
    let updatedCount = 0

    for (const product of retailProducts) {
      // Check if product is already associated with online location
      const existingAssociation = product.locations.find(loc => loc.locationId === onlineLocation.id)

      if (!existingAssociation) {
        // Create association with default stock
        await prisma.productLocation.create({
          data: {
            productId: product.id,
            locationId: onlineLocation.id,
            stock: 50, // Default stock for online store
            isActive: true
          }
        })
        associatedCount++
        console.log(`✅ Associated ${product.name} with online store (50 units)`)
      } else {
        // Update existing association if stock is 0
        if (existingAssociation.stock === 0) {
          await prisma.productLocation.update({
            where: { id: existingAssociation.id },
            data: { stock: 50 }
          })
          updatedCount++
          console.log(`🔄 Updated ${product.name} stock to 50 units`)
        } else {
          console.log(`✓ ${product.name} already has stock (${existingAssociation.stock} units)`)
        }
      }
    }

    console.log('\n📊 Summary:')
    console.log(`   • Total retail products: ${retailProducts.length}`)
    console.log(`   • New associations created: ${associatedCount}`)
    console.log(`   • Stock levels updated: ${updatedCount}`)
    console.log(`   • Online location ID: ${onlineLocation.id}`)

    // Verify the associations
    const verifyCount = await prisma.productLocation.count({
      where: {
        locationId: onlineLocation.id,
        product: {
          isRetail: true,
          isActive: true
        }
      }
    })

    console.log(`✅ Verification: ${verifyCount} retail products are now associated with online store`)

  } catch (error) {
    console.error('❌ Error fixing retail-online association:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  fixRetailOnlineAssociation()
    .then(() => {
      console.log('🎉 Retail-online association fix completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

export { fixRetailOnlineAssociation }
