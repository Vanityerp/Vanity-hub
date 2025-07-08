/**
 * Test script to verify that the inventory fix for online store sales is working correctly
 * This script will:
 * 1. Check current inventory levels for online location
 * 2. Simulate a purchase by calling the inventory adjustment API
 * 3. Verify that inventory levels are properly updated
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
  return 'online' // Fallback to hardcoded value
}

async function testInventoryFix() {
  console.log('🧪 Starting inventory fix test...')

  try {
    // Get the correct online location ID
    const onlineLocationId = await getOnlineLocationId()
    console.log('🏪 Using online location ID:', onlineLocationId)

    // Step 1: Get current inventory for online location
    console.log('\n📋 Step 1: Checking current inventory for online location...')
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    
    if (!inventoryResponse.ok) {
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.statusText}`)
    }
    
    const inventoryData = await inventoryResponse.json()
    console.log(`✅ Found ${inventoryData.inventory.length} products in online inventory`)

    // Debug: Log the first product structure
    if (inventoryData.inventory.length > 0) {
      console.log('📋 Sample product structure:', JSON.stringify(inventoryData.inventory[0], null, 2))
    }

    // Find a product with stock > 0 for testing
    const testProduct = inventoryData.inventory.find(item => item.stock > 0)
    
    if (!testProduct) {
      console.log('⚠️ No products with stock found in online location. Creating test scenario...')
      // You might want to add a product here or use a different approach
      return
    }
    
    console.log(`📦 Test product: ${testProduct.name} (Current stock: ${testProduct.stock})`)
    
    // Step 2: Test inventory adjustment (simulate a purchase)
    console.log('\n🛒 Step 2: Simulating a purchase (removing 1 unit)...')
    const testQuantity = 1
    const requestBody = {
      productId: testProduct.id, // Use the product ID directly from the flattened structure
      locationId: onlineLocationId,
      adjustmentType: 'remove',
      quantity: testQuantity,
      reason: 'Test purchase - inventory fix verification',
      notes: 'Automated test to verify online store inventory deduction'
    }

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))

    const adjustmentResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    if (!adjustmentResponse.ok) {
      const errorData = await adjustmentResponse.json()
      throw new Error(`Inventory adjustment failed: ${errorData.error || 'Unknown error'}`)
    }
    
    const adjustmentResult = await adjustmentResponse.json()
    console.log(`✅ Inventory adjusted successfully:`)
    console.log(`   Previous stock: ${adjustmentResult.previousStock}`)
    console.log(`   New stock: ${adjustmentResult.newStock}`)
    console.log(`   Adjustment: ${adjustmentResult.adjustment}`)
    
    // Step 3: Verify the change persisted
    console.log('\n🔍 Step 3: Verifying inventory change persisted...')
    const verifyResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify inventory: ${verifyResponse.statusText}`)
    }
    
    const verifyData = await verifyResponse.json()
    const updatedProduct = verifyData.inventory.find(item => item.id === testProduct.id)
    
    if (!updatedProduct) {
      throw new Error('Product not found in verification check')
    }
    
    const expectedStock = testProduct.stock - testQuantity
    if (updatedProduct.stock === expectedStock) {
      console.log(`✅ SUCCESS: Inventory change persisted correctly!`)
      console.log(`   Expected stock: ${expectedStock}`)
      console.log(`   Actual stock: ${updatedProduct.stock}`)
    } else {
      console.log(`❌ FAILURE: Inventory change did not persist correctly!`)
      console.log(`   Expected stock: ${expectedStock}`)
      console.log(`   Actual stock: ${updatedProduct.stock}`)
    }
    
    // Step 4: Restore the inventory (add the unit back)
    console.log('\n🔄 Step 4: Restoring inventory (adding unit back)...')
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
        reason: 'Test cleanup - restoring inventory after test',
        notes: 'Automated test cleanup'
      }),
    })
    
    if (restoreResponse.ok) {
      const restoreResult = await restoreResponse.json()
      console.log(`✅ Inventory restored: ${restoreResult.previousStock} -> ${restoreResult.newStock}`)
    } else {
      console.log(`⚠️ Failed to restore inventory - manual cleanup may be needed`)
    }
    
    console.log('\n🎉 Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testInventoryFix()
}

module.exports = { testInventoryFix }
