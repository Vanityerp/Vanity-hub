#!/usr/bin/env tsx

/**
 * Location Seeding Script
 * 
 * This script seeds the database with the required 5 locations:
 * - D-ring road
 * - Muaither  
 * - Medinat Khalifa
 * - Home service
 * - Online store
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const requiredLocations = [
  {
    id: 'loc1',
    name: 'D-ring road',
    address: '123 D-Ring Road',
    city: 'Doha',
    state: 'Doha',
    zipCode: '12345',
    country: 'Qatar',
    phone: '(974) 123-4567',
    email: 'dring@vanityhub.com',
    isActive: true
  },
  {
    id: 'loc2',
    name: 'Muaither',
    address: '456 Muaither St',
    city: 'Doha',
    state: 'Doha',
    zipCode: '23456',
    country: 'Qatar',
    phone: '(974) 234-5678',
    email: 'muaither@vanityhub.com',
    isActive: true
  },
  {
    id: 'loc3',
    name: 'Medinat Khalifa',
    address: '789 Medinat Khalifa Blvd',
    city: 'Doha',
    state: 'Doha',
    zipCode: '34567',
    country: 'Qatar',
    phone: '(974) 345-6789',
    email: 'medinat@vanityhub.com',
    isActive: true
  },
  {
    id: 'home',
    name: 'Home service',
    address: 'Client\'s Location',
    city: 'Doha',
    state: 'Doha',
    zipCode: '',
    country: 'Qatar',
    phone: '(974) 456-7890',
    email: 'homeservice@vanityhub.com',
    isActive: true
  },
  {
    id: 'online',
    name: 'Online store',
    address: 'Virtual Location',
    city: 'Doha',
    state: 'Doha',
    zipCode: '',
    country: 'Qatar',
    phone: '(974) 567-8901',
    email: 'online@vanityhub.com',
    isActive: true
  }
]

async function seedLocations() {
  console.log('🌱 Starting location seeding...')

  try {
    const seededLocations = []
    const errors = []

    for (const location of requiredLocations) {
      try {
        // Check if location already exists
        const existingLocation = await prisma.location.findUnique({
          where: { id: location.id }
        })

        if (existingLocation) {
          console.log(`📍 Location "${location.name}" already exists, updating...`)
          
          // Update existing location to ensure it has the correct data
          const updatedLocation = await prisma.location.update({
            where: { id: location.id },
            data: {
              name: location.name,
              address: location.address,
              city: location.city,
              state: location.state,
              zipCode: location.zipCode,
              country: location.country,
              phone: location.phone,
              email: location.email,
              isActive: location.isActive,
            }
          })
          
          seededLocations.push(updatedLocation)
          console.log(`✅ Updated location: ${location.name}`)
        } else {
          // Create new location
          const newLocation = await prisma.location.create({
            data: location
          })
          
          seededLocations.push(newLocation)
          console.log(`✅ Created location: ${location.name}`)
        }
      } catch (locationError) {
        console.error(`❌ Error processing location ${location.name}:`, locationError)
        errors.push({
          location: location.name,
          error: locationError instanceof Error ? locationError.message : 'Unknown error'
        })
      }
    }

    console.log(`\n🎉 Location seeding completed!`)
    console.log(`✅ Successfully processed: ${seededLocations.length} locations`)
    console.log(`❌ Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      errors.forEach(error => {
        console.log(`  - ${error.location}: ${error.error}`)
      })
    }

    // Verify all required locations exist
    const allLocations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    console.log(`\n📊 Database now contains ${allLocations.length} active locations:`)
    allLocations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.id})`)
    })

    return {
      success: true,
      seededCount: seededLocations.length,
      errorCount: errors.length,
      locations: allLocations
    }

  } catch (error) {
    console.error('❌ Fatal error during location seeding:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedLocations()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Location seeding completed successfully!')
        process.exit(0)
      } else {
        console.error('\n💥 Location seeding failed:', result.error)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error)
      process.exit(1)
    })
}

export { seedLocations }
