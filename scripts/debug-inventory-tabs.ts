import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugInventoryTabs() {
  try {
    console.log('🔍 Debugging Inventory Tab Issue...\n')
    
    // Fetch all products with their locations
    const products = await prisma.product.findMany({
      include: {
        locations: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Total products in database: ${products.length}\n`)
    
    // Simulate the filtering logic from the inventory page
    console.log('🔍 Simulating tab filtering logic:\n')
    
    // All products tab (should show all active products)
    const allProducts = products.filter(product => product.isActive)
    console.log(`📋 "All Products" tab would show: ${allProducts.length} products`)
    allProducts.forEach(product => {
      console.log(`   • ${product.name} (isRetail: ${product.isRetail}, isActive: ${product.isActive})`)
    })
    
    // Retail & Shop tab (should show only retail products)
    const retailProducts = products.filter(product => {
      // This is the exact logic from the inventory page
      if (!product.isRetail) {
        return false
      }
      return true
    })
    console.log(`\n🛒 "Retail & Shop" tab would show: ${retailProducts.length} products`)
    retailProducts.forEach(product => {
      console.log(`   • ${product.name} (isRetail: ${product.isRetail}, isActive: ${product.isActive})`)
    })
    
    // Professional Use tab (should show only professional products)
    const professionalProducts = products.filter(product => {
      // This is the exact logic from the inventory page
      if (product.isRetail) {
        return false
      }
      return true
    })
    console.log(`\n🔧 "Professional Use" tab would show: ${professionalProducts.length} products`)
    professionalProducts.forEach(product => {
      console.log(`   • ${product.name} (isRetail: ${product.isRetail}, isActive: ${product.isActive})`)
    })
    
    // Check for any data type issues
    console.log('\n🔍 Checking for data type issues:')
    products.forEach(product => {
      const isRetailType = typeof product.isRetail
      const isActiveType = typeof product.isActive
      if (isRetailType !== 'boolean' || isActiveType !== 'boolean') {
        console.log(`❌ Type issue found in ${product.name}:`)
        console.log(`   isRetail: ${product.isRetail} (${isRetailType})`)
        console.log(`   isActive: ${product.isActive} (${isActiveType})`)
      }
    })
    
    // Check stock levels
    console.log('\n📦 Stock levels by location:')
    products.forEach(product => {
      const totalStock = product.locations.reduce((sum, loc) => sum + loc.stock, 0)
      console.log(`   ${product.name}: Total stock = ${totalStock}`)
      product.locations.forEach(loc => {
        console.log(`     - Location ${loc.locationId}: ${loc.stock}`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error debugging inventory tabs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugInventoryTabs()
