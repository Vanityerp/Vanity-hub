import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n')
    
    const products = await prisma.product.findMany({
      include: {
        locations: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Total products found: ${products.length}\n`)
    
    // Group by isRetail status
    const retailProducts = products.filter(p => p.isRetail === true)
    const professionalProducts = products.filter(p => p.isRetail === false)
    
    console.log(`🛒 Retail products (isRetail: true): ${retailProducts.length}`)
    retailProducts.forEach(product => {
      const totalStock = product.locations.reduce((sum, loc) => sum + loc.stock, 0)
      console.log(`   • ${product.name} (Stock: ${totalStock})`)
    })
    
    console.log(`\n🔧 Professional products (isRetail: false): ${professionalProducts.length}`)
    professionalProducts.forEach(product => {
      const totalStock = product.locations.reduce((sum, loc) => sum + loc.stock, 0)
      console.log(`   • ${product.name} (Stock: ${totalStock})`)
    })
    
    console.log('\n📋 Product Details:')
    products.forEach(product => {
      const totalStock = product.locations.reduce((sum, loc) => sum + loc.stock, 0)
      console.log(`   ${product.name}:`)
      console.log(`     - isRetail: ${product.isRetail}`)
      console.log(`     - isActive: ${product.isActive}`)
      console.log(`     - Category: ${product.category}`)
      console.log(`     - Type: ${product.type}`)
      console.log(`     - Total Stock: ${totalStock}`)
      console.log(`     - Locations with stock: ${product.locations.length}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error checking products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProducts()
