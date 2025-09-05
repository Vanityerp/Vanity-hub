import { seedComprehensiveBeautyProducts } from "./seed-comprehensive-beauty-products"

async function testSeeding() {
  try {
    console.log('🧪 Testing comprehensive beauty product seeding...')
    const result = await seedComprehensiveBeautyProducts()
    console.log('✅ Test completed successfully:', result)
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSeeding()
