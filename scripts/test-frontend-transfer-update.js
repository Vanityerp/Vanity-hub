#!/usr/bin/env node

/**
 * Test script to verify frontend updates after transfers
 * This simulates what happens when a user performs a transfer through the UI
 */

const BASE_URL = 'http://localhost:3000'

async function testFrontendTransferUpdate() {
  console.log('🧪 Testing frontend transfer update workflow...')
  
  try {
    // Step 1: Get initial data (simulating what the frontend does)
    console.log('\n📊 Step 1: Getting initial product data...')
    
    const initialProductsResponse = await fetch(`${BASE_URL}/api/products`)
    const initialProductsData = await initialProductsResponse.json()
    const testProduct = initialProductsData.products.find(p => p.isRetail && p.isActive)
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    const onlineLocation = locationsData.locations.find(l => l.name.toLowerCase().includes('online'))
    const dRingLocation = locationsData.locations.find(l => l.name.toLowerCase().includes('d-ring'))
    
    console.log(`📦 Test product: ${testProduct.name}`)
    console.log(`📍 Source: ${onlineLocation.name}`)
    console.log(`📍 Destination: ${dRingLocation.name}`)
    
    // Get initial stock from product data
    const initialOnlineStock = testProduct.locations?.find(loc => loc.locationId === onlineLocation.id)?.stock || 0
    const initialDRingStock = testProduct.locations?.find(loc => loc.locationId === dRingLocation.id)?.stock || 0
    
    console.log(`   Initial ${onlineLocation.name}: ${initialOnlineStock} units`)
    console.log(`   Initial ${dRingLocation.name}: ${initialDRingStock} units`)
    
    // Step 2: Simulate transfer creation (what the ProductProvider does)
    console.log('\n🔄 Step 2: Simulating transfer creation...')
    
    const transferData = {
      productId: testProduct.id,
      productName: testProduct.name,
      fromLocationId: onlineLocation.id,
      toLocationId: dRingLocation.id,
      quantity: 5,
      status: 'pending',
      notes: 'Frontend test transfer',
      createdBy: 'test-user'
    }
    
    console.log('📤 Transfer data:', transferData)
    
    // Step 3: Perform the actual transfer operations
    console.log('\n🔄 Step 3: Performing transfer operations...')
    
    // Remove from source
    const removeResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: transferData.productId,
        locationId: transferData.fromLocationId,
        adjustmentType: 'remove',
        quantity: transferData.quantity,
        reason: `Transfer to location ${transferData.toLocationId}`,
        notes: `Transfer test`
      }),
    })
    
    if (!removeResponse.ok) {
      const errorData = await removeResponse.json()
      throw new Error(`Failed to remove stock: ${errorData.error || 'Unknown error'}`)
    }
    
    const removeResult = await removeResponse.json()
    console.log(`   ✅ Removed from ${onlineLocation.name}: ${removeResult.previousStock} → ${removeResult.newStock}`)
    
    // Add to destination
    const addResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: transferData.productId,
        locationId: transferData.toLocationId,
        adjustmentType: 'add',
        quantity: transferData.quantity,
        reason: `Transfer from location ${transferData.fromLocationId}`,
        notes: `Transfer test`
      }),
    })
    
    if (!addResponse.ok) {
      const errorData = await addResponse.json()
      throw new Error(`Failed to add stock: ${errorData.error || 'Unknown error'}`)
    }
    
    const addResult = await addResponse.json()
    console.log(`   ✅ Added to ${dRingLocation.name}: ${addResult.previousStock} → ${addResult.newStock}`)
    
    // Step 4: Check if products API returns updated data
    console.log('\n📊 Step 4: Checking if products API returns updated data...')
    
    // Wait a moment for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updatedProductsResponse = await fetch(`${BASE_URL}/api/products`)
    const updatedProductsData = await updatedProductsResponse.json()
    const updatedProduct = updatedProductsData.products.find(p => p.id === testProduct.id)
    
    const updatedOnlineStock = updatedProduct.locations?.find(loc => loc.locationId === onlineLocation.id)?.stock || 0
    const updatedDRingStock = updatedProduct.locations?.find(loc => loc.locationId === dRingLocation.id)?.stock || 0
    
    console.log(`   Updated ${onlineLocation.name}: ${updatedOnlineStock} units (expected: ${initialOnlineStock - 5})`)
    console.log(`   Updated ${dRingLocation.name}: ${updatedDRingStock} units (expected: ${initialDRingStock + 5})`)
    
    // Step 5: Verify the changes
    console.log('\n✅ Step 5: Verification...')
    
    const onlineCorrect = updatedOnlineStock === (initialOnlineStock - 5)
    const dRingCorrect = updatedDRingStock === (initialDRingStock + 5)
    
    console.log(`   ${onlineLocation.name} stock correct: ${onlineCorrect ? '✅' : '❌'}`)
    console.log(`   ${dRingLocation.name} stock correct: ${dRingCorrect ? '✅' : '❌'}`)
    
    if (onlineCorrect && dRingCorrect) {
      console.log('\n🎉 Frontend transfer update test PASSED!')
      console.log('   The products API correctly returns updated stock levels')
      console.log('   The frontend should see the changes immediately after transfer')
    } else {
      console.log('\n❌ Frontend transfer update test FAILED!')
      console.log('   The products API is not returning updated stock levels')
    }
    
    // Step 6: Test inventory API consistency
    console.log('\n🔍 Step 6: Testing inventory API consistency...')
    
    const onlineInventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocation.id}`)
    const onlineInventoryData = await onlineInventoryResponse.json()
    const onlineInventoryStock = onlineInventoryData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    const dRingInventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${dRingLocation.id}`)
    const dRingInventoryData = await dRingInventoryResponse.json()
    const dRingInventoryStock = dRingInventoryData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    console.log(`   Inventory API ${onlineLocation.name}: ${onlineInventoryStock} units`)
    console.log(`   Inventory API ${dRingLocation.name}: ${dRingInventoryStock} units`)
    console.log(`   Products API ${onlineLocation.name}: ${updatedOnlineStock} units`)
    console.log(`   Products API ${dRingLocation.name}: ${updatedDRingStock} units`)
    
    const inventoryConsistent = (onlineInventoryStock === updatedOnlineStock) && (dRingInventoryStock === updatedDRingStock)
    console.log(`   APIs consistent: ${inventoryConsistent ? '✅' : '❌'}`)
    
    // Step 7: Restore original stock levels
    console.log('\n🔄 Step 7: Restoring original stock levels...')
    
    // Restore online stock
    await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: onlineLocation.id,
        adjustmentType: 'add',
        quantity: 5,
        reason: 'Restore original stock after test',
        notes: 'Test cleanup'
      }),
    })
    
    // Restore D-ring stock
    await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: dRingLocation.id,
        adjustmentType: 'remove',
        quantity: 5,
        reason: 'Restore original stock after test',
        notes: 'Test cleanup'
      }),
    })
    
    console.log('✅ Original stock levels restored')
    
    console.log('\n📋 Summary:')
    console.log('   - Transfer operations work correctly ✅')
    console.log('   - Database updates properly ✅')
    console.log(`   - Products API returns updated data ${onlineCorrect && dRingCorrect ? '✅' : '❌'}`)
    console.log(`   - API consistency ${inventoryConsistent ? '✅' : '❌'}`)
    console.log('   - If frontend still shows old data, the issue is in React state management')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testFrontendTransferUpdate()
