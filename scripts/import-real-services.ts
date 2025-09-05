import { PrismaClient } from '@prisma/client'
import { realServiceData } from '../prisma/real-services-data'

const prisma = new PrismaClient()

async function importRealServices() {
  try {
    console.log('🌱 Starting import of real VanityERP services...')
    console.log(`📊 Total services to import: ${realServiceData.length}`)

    // First, let's verify the database is clean
    const existingServices = await prisma.service.count()
    if (existingServices > 0) {
      console.log(`⚠️ Warning: ${existingServices} services already exist in database`)
      console.log('🧹 Clearing existing services first...')
      
      // Clear existing services and related data
      await prisma.appointmentService.deleteMany()
      await prisma.locationService.deleteMany()
      await prisma.staffService.deleteMany()
      await prisma.service.deleteMany()
      
      console.log('✅ Existing services cleared')
    }

    // Get all locations (excluding online store for services)
    const locations = await prisma.location.findMany({
      where: {
        name: {
          not: 'Online Store'
        }
      }
    })

    if (locations.length === 0) {
      throw new Error('No physical locations found. Please ensure locations are created first.')
    }

    console.log(`🏢 Found ${locations.length} physical locations for service association`)

    // Import services by category
    const servicesByCategory: Record<string, number> = {}
    const createdServices = []

    for (const serviceData of realServiceData) {
      try {
        const service = await prisma.service.create({
          data: {
            name: serviceData.name,
            description: `Professional ${serviceData.name.toLowerCase()} service`,
            duration: serviceData.duration,
            price: serviceData.price,
            category: serviceData.category,
            isActive: true,
            showPricesToClients: true,
          },
        })

        createdServices.push(service)
        
        // Count services by category
        servicesByCategory[serviceData.category] = (servicesByCategory[serviceData.category] || 0) + 1

        // Associate service with all physical locations
        for (const location of locations) {
          await prisma.locationService.create({
            data: {
              locationId: location.id,
              serviceId: service.id,
              price: serviceData.price,
              isActive: true,
            },
          })
        }

        console.log(`   ✅ Created: ${service.name} (${service.category}) - ${service.duration}min - QAR ${service.price}`)
      } catch (error) {
        console.error(`   ❌ Failed to create service: ${serviceData.name}`, error)
      }
    }

    // Final verification
    const totalServices = await prisma.service.count()
    const totalLocationServices = await prisma.locationService.count()

    console.log('\n🎉 Service import completed successfully!')
    console.log('📊 Import Summary:')
    console.log(`   - Total services created: ${totalServices}`)
    console.log(`   - Total location-service associations: ${totalLocationServices}`)
    console.log(`   - Physical locations: ${locations.length}`)

    console.log('\n📋 Services by category:')
    Object.entries(servicesByCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} services`)
      })

    console.log('\n💰 Price range analysis:')
    const prices = realServiceData.map(s => s.price).sort((a, b) => a - b)
    console.log(`   - Lowest price: QAR ${prices[0]}`)
    console.log(`   - Highest price: QAR ${prices[prices.length - 1]}`)
    console.log(`   - Average price: QAR ${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)}`)

    console.log('\n⏱️ Duration analysis:')
    const durations = realServiceData.map(s => s.duration).sort((a, b) => a - b)
    console.log(`   - Shortest service: ${durations[0]} minutes`)
    console.log(`   - Longest service: ${durations[durations.length - 1]} minutes`)
    console.log(`   - Average duration: ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} minutes`)

  } catch (error) {
    console.error('❌ Error importing services:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importRealServices()
  .then(() => {
    console.log('\n🚀 Ready to serve clients with comprehensive beauty services!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Service import failed:', error)
    process.exit(1)
  })
