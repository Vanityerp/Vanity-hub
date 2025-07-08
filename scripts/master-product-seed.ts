import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function masterProductSeed() {
  console.log('🚀 Starting Master Product Seeding Process...')
  console.log('This will populate the inventory with comprehensive product categories:\n')
  
  console.log('📋 Categories to be added:')
  console.log('   • Skincare (Cleansers, Exfoliators & Toners, Treatments, Moisturizers, Eye & Lip Care, Masks, Sun Care)')
  console.log('   • Makeup (Face, Eyes, Lips)')
  console.log('   • Haircare (Cleanse & Condition, Styling, Treatments)')
  console.log('   • Hair Extensions (Human Hair, Synthetic Hair)')
  console.log('   • Body Care (Bath & Shower, Moisturizers & Treatments, Specialized Care)')
  console.log('   • Fragrance (Personal Fragrance)')
  console.log('   • Tools & Brushes (Makeup Applicators, Beauty Tools, Hair Tools)')
  console.log('')

  try {
    // Clear existing products first
    console.log('🗑️ Clearing existing products...')
    await prisma.productLocation.deleteMany()
    await prisma.product.deleteMany()
    console.log('✅ Existing products cleared\n')

    // Get locations count for reference
    const locations = await prisma.location.findMany()
    console.log(`📍 Found ${locations.length} locations for product distribution\n`)

    let totalProductsCreated = 0

    // 1. Seed Skincare Products
    console.log('🧴 Seeding Skincare Products...')
    await seedComprehensiveProducts()
    const skincareCount = await prisma.product.count({ where: { type: 'SKINCARE' } })
    totalProductsCreated += skincareCount
    console.log(`✅ Created ${skincareCount} skincare products\n`)

    // 2. Seed Makeup Products
    console.log('💄 Seeding Makeup Products...')
    await seedMakeupProducts()
    const makeupCount = await prisma.product.count({ where: { type: 'MAKEUP' } })
    totalProductsCreated += (makeupCount - skincareCount)
    console.log(`✅ Created ${makeupCount - skincareCount} makeup products\n`)

    // 3. Seed Remaining Products (Lips, Haircare)
    console.log('💋 Seeding Lips & Haircare Products...')
    await seedRemainingProducts()
    const afterRemainingCount = await prisma.product.count()
    const remainingCount = afterRemainingCount - makeupCount
    totalProductsCreated += remainingCount
    console.log(`✅ Created ${remainingCount} lips & haircare products\n`)

    // 4. Seed Final Categories (Hair Extensions, Body Care, Fragrance)
    console.log('🌸 Seeding Hair Extensions, Body Care & Fragrance...')
    await seedFinalCategories()
    const afterFinalCount = await prisma.product.count()
    const finalCount = afterFinalCount - afterRemainingCount
    totalProductsCreated += finalCount
    console.log(`✅ Created ${finalCount} hair extensions, body care & fragrance products\n`)

    // 5. Seed Tools & Brushes
    console.log('🔧 Seeding Tools & Brushes...')
    await seedToolsBrushes()
    const finalTotalCount = await prisma.product.count()
    const toolsCount = finalTotalCount - afterFinalCount
    totalProductsCreated += toolsCount
    console.log(`✅ Created ${toolsCount} tools & brushes\n`)

    // Final summary
    console.log('🎉 MASTER PRODUCT SEEDING COMPLETED! 🎉')
    console.log('=' .repeat(50))
    console.log(`📊 FINAL SUMMARY:`)
    console.log(`   Total Products Created: ${finalTotalCount}`)
    console.log(`   Locations Stocked: ${locations.length}`)
    console.log(`   Total Product-Location Associations: ${finalTotalCount * locations.length}`)
    console.log('')

    // Category breakdown
    const categoryBreakdown = await getCategoryBreakdown()
    console.log('📋 CATEGORY BREAKDOWN:')
    for (const [category, count] of Object.entries(categoryBreakdown)) {
      console.log(`   • ${category}: ${count} products`)
    }
    console.log('')

    // Product type breakdown
    const typeBreakdown = await getTypeBreakdown()
    console.log('🏷️ PRODUCT TYPE BREAKDOWN:')
    for (const [type, count] of Object.entries(typeBreakdown)) {
      console.log(`   • ${type}: ${count} products`)
    }
    console.log('')

    console.log('✨ Your inventory is now fully stocked with comprehensive product categories!')
    console.log('🛒 All products are available for retail sale in the client portal')
    console.log('📦 Stock levels have been randomly assigned (10-59 units per location)')
    console.log('⭐ Products have random ratings (3.0-5.0) and review counts (0-49)')
    console.log('🆕 20% of products are marked as "New"')
    console.log('')
    console.log('🎯 Next steps:')
    console.log('   1. Visit the inventory page to see all products')
    console.log('   2. Check the client portal shop to see retail products')
    console.log('   3. Adjust stock levels and pricing as needed')
    console.log('   4. Add product images for better presentation')

  } catch (error) {
    console.error('❌ Master product seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function getCategoryBreakdown() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  })
  
  const breakdown: Record<string, number> = {}
  categories.forEach(cat => {
    breakdown[cat.category] = cat._count.id
  })
  
  return breakdown
}

async function getTypeBreakdown() {
  const types = await prisma.product.groupBy({
    by: ['type'],
    _count: {
      id: true
    }
  })
  
  const breakdown: Record<string, number> = {}
  types.forEach(type => {
    breakdown[type.type] = type._count.id
  })
  
  return breakdown
}

// Run the master seeding function
if (require.main === module) {
  masterProductSeed()
    .then(() => {
      console.log('🏁 Master product seeding process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Master product seeding process failed:', error)
      process.exit(1)
    })
}

export { masterProductSeed }
