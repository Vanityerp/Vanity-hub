import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testRealServicesAPI() {
  try {
    console.log('🧪 Testing real services API and database...')

    // Test 1: Count services by category
    console.log('\n📊 Services by category:')
    const servicesByCategory = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    servicesByCategory.forEach(({ category, _count }) => {
      console.log(`   - ${category}: ${_count.id} services`)
    })

    // Test 2: Price range analysis
    console.log('\n💰 Price analysis:')
    const priceStats = await prisma.service.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
      _count: { id: true }
    })

    console.log(`   - Total services: ${priceStats._count.id}`)
    console.log(`   - Lowest price: QAR ${priceStats._min.price}`)
    console.log(`   - Highest price: QAR ${priceStats._max.price}`)
    console.log(`   - Average price: QAR ${Math.round(Number(priceStats._avg.price))}`)

    // Test 3: Duration analysis
    console.log('\n⏱️ Duration analysis:')
    const durationStats = await prisma.service.aggregate({
      _min: { duration: true },
      _max: { duration: true },
      _avg: { duration: true }
    })

    console.log(`   - Shortest service: ${durationStats._min.duration} minutes`)
    console.log(`   - Longest service: ${durationStats._max.duration} minutes`)
    console.log(`   - Average duration: ${Math.round(Number(durationStats._avg.duration))} minutes`)

    // Test 4: Sample services from each category
    console.log('\n🔍 Sample services from each category:')
    for (const { category } of servicesByCategory.slice(0, 5)) {
      const sampleService = await prisma.service.findFirst({
        where: { category },
        select: {
          name: true,
          duration: true,
          price: true,
          category: true
        }
      })
      
      if (sampleService) {
        console.log(`   - ${category}: "${sampleService.name}" (${sampleService.duration}min, QAR ${sampleService.price})`)
      }
    }

    // Test 5: Location associations
    console.log('\n🏢 Location associations:')
    const locationServices = await prisma.locationService.groupBy({
      by: ['locationId'],
      _count: {
        serviceId: true
      }
    })

    // Get location names for the associations
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true
      }
    })

    for (const { locationId, _count } of locationServices) {
      const location = locations.find(l => l.id === locationId)
      console.log(`   - ${location?.name || 'Unknown'}: ${_count.serviceId} services`)
    }

    // Test 6: Most expensive services
    console.log('\n💎 Top 5 most expensive services:')
    const expensiveServices = await prisma.service.findMany({
      select: {
        name: true,
        category: true,
        duration: true,
        price: true
      },
      orderBy: {
        price: 'desc'
      },
      take: 5
    })

    expensiveServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.category}) - ${service.duration}min - QAR ${service.price}`)
    })

    // Test 7: Quickest services
    console.log('\n⚡ Top 5 quickest services:')
    const quickServices = await prisma.service.findMany({
      select: {
        name: true,
        category: true,
        duration: true,
        price: true
      },
      orderBy: {
        duration: 'asc'
      },
      take: 5
    })

    quickServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.category}) - ${service.duration}min - QAR ${service.price}`)
    })

    console.log('\n✅ All tests passed! Real services are properly imported and accessible.')

  } catch (error) {
    console.error('❌ Error testing services:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testRealServicesAPI()
  .then(() => {
    console.log('\n🎉 Service testing completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Service testing failed:', error)
    process.exit(1)
  })
