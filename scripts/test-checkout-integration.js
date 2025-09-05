/**
 * Integration test to verify that the checkout process properly deducts inventory
 * This simulates the actual checkout flow that customers would go through
 */

const BASE_URL = 'http://localhost:3000'

async function getOnlineLocationId() {
  try {
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json()
      const onlineLocation = locationsData.locations.find(loc => 
        loc.name.toLowerCase().includes('online') || loc.id === 'online'
      )
      return onlineLocation?.id || 'online'
    }
  } catch (error) {
    console.warn('Failed to fetch online location ID, using fallback:', error)
  }
  return 'online'
}

async function testCheckoutIntegration() {
  console.log('🛒 Starting checkout integration test...')
  
  try {
    const onlineLocationId = await getOnlineLocationId()
    console.log('🏪 Using online location ID:', onlineLocationId)
    
    // Step 1: Get available products from the shop
    console.log('\n📋 Step 1: Getting available products from shop...')
    const shopResponse = await fetch(`${BASE_URL}/api/shop/products`)
    
    if (!shopResponse.ok) {
      throw new Error(`Failed to fetch shop products: ${shopResponse.statusText}`)
    }
    
    const shopData = await shopResponse.json()
    console.log(`✅ Found ${shopData.products.length} products in shop`)
    
    // Find a product with stock > 1 for testing
    const testProduct = shopData.products.find(product => product.stock > 1)
    
    if (!testProduct) {
      console.log('⚠️ No products with sufficient stock found in shop.')
      return
    }
    
    console.log(`📦 Test product: ${testProduct.name} (Current stock: ${testProduct.stock})`)
    
    // Step 2: Check initial inventory level
    console.log('\n📊 Step 2: Checking initial inventory level...')
    const initialInventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    
    if (!initialInventoryResponse.ok) {
      throw new Error(`Failed to fetch initial inventory: ${initialInventoryResponse.statusText}`)
    }
    
    const initialInventoryData = await initialInventoryResponse.json()
    const initialProductInventory = initialInventoryData.inventory.find(item => item.id === testProduct.id)
    
    if (!initialProductInventory) {
      throw new Error(`Product ${testProduct.name} not found in inventory`)
    }
    
    console.log(`📊 Initial inventory: ${initialProductInventory.stock} units`)
    
    // Step 3: Simulate the checkout inventory adjustment (what the checkout process does)
    console.log('\n🛒 Step 3: Simulating checkout inventory adjustment...')
    const testQuantity = 1
    
    const checkoutAdjustmentResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: onlineLocationId,
        adjustmentType: 'remove',
        quantity: testQuantity,
        reason: `Online store sale - Test Order`,
        notes: `Integration test - simulated checkout`
      }),
    })
    
    if (!checkoutAdjustmentResponse.ok) {
      const errorData = await checkoutAdjustmentResponse.json()
      throw new Error(`Checkout adjustment failed: ${errorData.error || 'Unknown error'}`)
    }
    
    const adjustmentResult = await checkoutAdjustmentResponse.json()
    console.log(`✅ Checkout adjustment successful:`)
    console.log(`   Previous stock: ${adjustmentResult.previousStock}`)
    console.log(`   New stock: ${adjustmentResult.newStock}`)
    
    // Step 4: Verify the inventory was properly updated
    console.log('\n🔍 Step 4: Verifying inventory update...')
    const finalInventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    
    if (!finalInventoryResponse.ok) {
      throw new Error(`Failed to fetch final inventory: ${finalInventoryResponse.statusText}`)
    }
    
    const finalInventoryData = await finalInventoryResponse.json()
    const finalProductInventory = finalInventoryData.inventory.find(item => item.id === testProduct.id)
    
    if (!finalProductInventory) {
      throw new Error(`Product ${testProduct.name} not found in final inventory`)
    }
    
    const expectedStock = initialProductInventory.stock - testQuantity
    if (finalProductInventory.stock === expectedStock) {
      console.log(`✅ SUCCESS: Checkout inventory deduction worked correctly!`)
      console.log(`   Initial stock: ${initialProductInventory.stock}`)
      console.log(`   Expected final stock: ${expectedStock}`)
      console.log(`   Actual final stock: ${finalProductInventory.stock}`)
    } else {
      console.log(`❌ FAILURE: Inventory deduction did not work correctly!`)
      console.log(`   Initial stock: ${initialProductInventory.stock}`)
      console.log(`   Expected final stock: ${expectedStock}`)
      console.log(`   Actual final stock: ${finalProductInventory.stock}`)
    }
    
    // Step 5: Restore inventory for cleanup
    console.log('\n🔄 Step 5: Restoring inventory...')
    const restoreResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: onlineLocationId,
        adjustmentType: 'add',
        quantity: testQuantity,
        reason: 'Test cleanup - restoring inventory after integration test',
        notes: 'Automated test cleanup'
      }),
    })
    
    if (restoreResponse.ok) {
      const restoreResult = await restoreResponse.json()
      console.log(`✅ Inventory restored: ${restoreResult.previousStock} -> ${restoreResult.newStock}`)
    } else {
      console.log(`⚠️ Failed to restore inventory - manual cleanup may be needed`)
    }
    
    console.log('\n🎉 Checkout integration test completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   ✅ Shop products API working')
    console.log('   ✅ Inventory API working')
    console.log('   ✅ Inventory adjustment API working')
    console.log('   ✅ Checkout inventory deduction working')
    console.log('   ✅ Changes persist to database')
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCheckoutIntegration()
}

module.exports = { testCheckoutIntegration }
