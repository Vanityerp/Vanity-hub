import { prisma } from '../lib/prisma'

async function testInventoryAlerts() {
  try {
    console.log('🧪 Testing Inventory Alerts System...\n')
    
    // Test 1: Check locations
    console.log('1️⃣ Checking locations...')
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    })
    console.log(`   ✅ Found ${locations.length} active locations:`)
    locations.forEach(loc => console.log(`      - ${loc.name} (${loc.id})`))
    
    if (locations.length === 0) {
      console.log('   ❌ No locations found! Please seed locations first.')
      return
    }
    
    // Test 2: Check products with location data
    console.log('\n2️⃣ Checking products with location data...')
    const productsWithLocations = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      },
      take: 10
    })
    
    console.log(`   ✅ Found ${productsWithLocations.length} products`)
    
    // Test 3: Identify low stock items
    console.log('\n3️⃣ Identifying low stock items...')
    let lowStockCount = 0
    const lowStockItems: any[] = []
    
    productsWithLocations.forEach(product => {
      const minStock = 5 // Default minimum stock
      
      if (product.locations && product.locations.length > 0) {
        product.locations.forEach(productLocation => {
          const stockLevel = productLocation.stock || 0
          if (stockLevel <= minStock) {
            lowStockCount++
            lowStockItems.push({
              productName: product.name,
              locationName: productLocation.location.name,
              currentStock: stockLevel,
              minStock: minStock,
              status: stockLevel === 0 ? 'Critical' : 'Low'
            })
          }
        })
      }
    })
    
    console.log(`   📊 Found ${lowStockCount} low stock items:`)
    lowStockItems.forEach(item => {
      console.log(`      - ${item.productName} at ${item.locationName}: ${item.currentStock} units (${item.status})`)
    })
    
    // Test 4: Test the inventory alerts logic
    console.log('\n4️⃣ Testing inventory alerts logic...')
    
    if (lowStockItems.length === 0) {
      console.log('   ⚠️  No low stock items found. Creating test data...')
      
      // Create a test product with low stock
      const testProduct = await prisma.product.create({
        data: {
          name: 'Test Alert Product',
          description: 'Test product for inventory alerts',
          price: 25.99,
          cost: 12.50,
          category: 'Test Category',
          type: 'Test Type',
          sku: 'TEST-ALERT-001',
          isRetail: true
        }
      })
      
      // Add low stock at first location
      if (locations.length > 0) {
        await prisma.productLocation.create({
          data: {
            productId: testProduct.id,
            locationId: locations[0].id,
            stock: 2, // Low stock
            isActive: true
          }
        })
        
        console.log(`   ✅ Created test product "${testProduct.name}" with 2 units at ${locations[0].name}`)
      }
    }
    
    // Test 5: Verify the alerts would be generated
    console.log('\n5️⃣ Verifying alert generation...')
    const alertProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })
    
    const generatedAlerts: any[] = []
    alertProducts.forEach(product => {
      if (product.locations && product.locations.length > 0) {
        product.locations.forEach(productLocation => {
          const stockLevel = productLocation.stock || 0
          const minStock = 5
          
          if (stockLevel <= minStock) {
            generatedAlerts.push({
              id: `${product.id}-${productLocation.locationId}`,
              name: product.name,
              category: product.category,
              stock: stockLevel,
              minStock: minStock,
              status: stockLevel === 0 ? "Critical" : stockLevel <= minStock / 2 ? "Critical" : "Low",
              location: productLocation.location?.name || "Unknown Location",
              sku: product.sku || ""
            })
          }
        })
      }
    })
    
    console.log(`   📋 Generated ${generatedAlerts.length} alerts:`)
    generatedAlerts.forEach(alert => {
      console.log(`      - ${alert.name} at ${alert.location}: ${alert.stock}/${alert.minStock} units (${alert.status})`)
    })
    
    console.log('\n✅ Inventory alerts test completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Locations: ${locations.length}`)
    console.log(`   - Products: ${productsWithLocations.length}`)
    console.log(`   - Low stock alerts: ${generatedAlerts.length}`)
    
    return {
      success: true,
      locationCount: locations.length,
      productCount: productsWithLocations.length,
      alertCount: generatedAlerts.length,
      alerts: generatedAlerts
    }
    
  } catch (error) {
    console.error('❌ Error testing inventory alerts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testInventoryAlerts()
  .then(result => {
    console.log('\n🎉 Test completed successfully:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error)
    process.exit(1)
  })
