import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSampleProducts() {
  console.log('🛍️ Adding sample products for testing transfers...')

  // Get locations
  const locations = await prisma.location.findMany()
  const onlineStore = locations.find(l => l.name === 'Online store')
  const dRing = locations.find(l => l.name === 'D-ring road')
  const muaither = locations.find(l => l.name === 'Muaither')

  if (!onlineStore || !dRing || !muaither) {
    console.error('❌ Required locations not found')
    return
  }

  // Create sample products (using string categories and types)
  const products = [
    {
      name: '24" Human Hair',
      description: '24 inch premium human hair extension',
      sku: 'HH24-001',
      category: 'HAIR_EXTENSIONS',
      type: 'Human Hair Extension',
      price: 150.00,
      cost: 75.00
    },
    {
      name: '18" Synthetic Hair',
      description: '18 inch high-quality synthetic hair extension',
      sku: 'SH18-001',
      category: 'HAIR_EXTENSIONS',
      type: 'Synthetic Hair Extension',
      price: 80.00,
      cost: 40.00
    },
    {
      name: 'Professional Hair Serum',
      description: 'Premium hair treatment serum',
      sku: 'HS-001',
      category: 'HAIR_CARE',
      type: 'Hair Treatment',
      price: 45.00,
      cost: 22.50
    },
    {
      name: 'Nail Polish Set',
      description: 'Professional nail polish collection',
      sku: 'NP-SET-001',
      category: 'NAIL_CARE',
      type: 'Nail Polish',
      price: 35.00,
      cost: 17.50
    }
  ]

  const createdProducts = []
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    })
    createdProducts.push(product)
    console.log(`✅ Created product: ${product.name}`)
  }

  // Add stock to locations
  console.log('📦 Adding stock to locations...')
  
  for (const product of createdProducts) {
    // Add stock to Online store (main inventory)
    await prisma.productLocation.create({
      data: {
        productId: product.id,
        locationId: onlineStore.id,
        stock: 50
      }
    })

    // Add some stock to D-ring road
    await prisma.productLocation.create({
      data: {
        productId: product.id,
        locationId: dRing.id,
        stock: 10
      }
    })

    // Add some stock to Muaither
    await prisma.productLocation.create({
      data: {
        productId: product.id,
        locationId: muaither.id,
        stock: 8
      }
    })

    console.log(`📦 Added stock for ${product.name} to all locations`)
  }

  console.log('✅ Sample products and stock added successfully!')
  console.log('📊 Summary:')
  console.log(`  - ${createdProducts.length} products created`)
  console.log(`  - ${createdProducts.length * 3} stock entries created`)
  console.log('  - Stock distributed across Online store, D-ring road, and Muaither')
}

addSampleProducts()
  .catch((e) => {
    console.error('❌ Error adding sample products:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
