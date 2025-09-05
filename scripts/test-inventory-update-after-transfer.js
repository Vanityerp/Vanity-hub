#!/usr/bin/env node

/**
 * Test script to verify inventory updates after transfers
 */

const BASE_URL = 'http://localhost:3000'

async function testInventoryUpdateAfterTransfer() {
  console.log('🧪 Testing inventory update after transfer...')
  
  try {
    // Get test data
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    const productsData = await productsResponse.json()
    const testProduct = productsData.products.find(p => p.isRetail && p.isActive)
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    const onlineLocation = locationsData.locations.find(l => l.name.toLowerCase().includes('online'))
    const dRingLocation = locationsData.locations.find(l => l.name.toLowerCase().includes('d-ring'))
    
    console.log(`📦 Test product: ${testProduct.name}`)
    console.log(`📍 Source location: ${onlineLocation.name}`)
    console.log(`📍 Destination location: ${dRingLocation.name}`)
    
    // Step 1: Check initial stock levels
    console.log('\n📊 Step 1: Checking initial stock levels...')
    
    const initialOnlineInventory = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocation.id}`)
    const initialOnlineData = await initialOnlineInventory.json()
    const initialOnlineStock = initialOnlineData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    const initialDRingInventory = await fetch(`${BASE_URL}/api/inventory?locationId=${dRingLocation.id}`)
    const initialDRingData = await initialDRingInventory.json()
    const initialDRingStock = initialDRingData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    console.log(`   ${onlineLocation.name}: ${initialOnlineStock} units`)
    console.log(`   ${dRingLocation.name}: ${initialDRingStock} units`)
    
    // Step 2: Perform transfer (10 units from online to D-ring)
    console.log('\n🔄 Step 2: Performing transfer (10 units)...')
    
    // Remove from source
    const removeResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: onlineLocation.id,
        adjustmentType: 'remove',
        quantity: 10,
        reason: `Transfer to ${dRingLocation.name}`,
        notes: 'Test transfer - inventory update verification'
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
        productId: testProduct.id,
        locationId: dRingLocation.id,
        adjustmentType: 'add',
        quantity: 10,
        reason: `Transfer from ${onlineLocation.name}`,
        notes: 'Test transfer - inventory update verification'
      }),
    })
    
    if (!addResponse.ok) {
      const errorData = await addResponse.json()
      throw new Error(`Failed to add stock: ${errorData.error || 'Unknown error'}`)
    }
    
    const addResult = await addResponse.json()
    console.log(`   ✅ Added to ${dRingLocation.name}: ${addResult.previousStock} → ${addResult.newStock}`)
    
    // Step 3: Check updated stock levels via inventory API
    console.log('\n📊 Step 3: Checking updated stock levels via inventory API...')
    
    const updatedOnlineInventory = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocation.id}`)
    const updatedOnlineData = await updatedOnlineInventory.json()
    const updatedOnlineStock = updatedOnlineData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    const updatedDRingInventory = await fetch(`${BASE_URL}/api/inventory?locationId=${dRingLocation.id}`)
    const updatedDRingData = await updatedDRingInventory.json()
    const updatedDRingStock = updatedDRingData.inventory.find(inv => inv.id === testProduct.id)?.stock || 0
    
    console.log(`   ${onlineLocation.name}: ${updatedOnlineStock} units (expected: ${initialOnlineStock - 10})`)
    console.log(`   ${dRingLocation.name}: ${updatedDRingStock} units (expected: ${initialDRingStock + 10})`)
    
    // Step 4: Check updated stock levels via products API
    console.log('\n📊 Step 4: Checking updated stock levels via products API...')
    
    const updatedProductsResponse = await fetch(`${BASE_URL}/api/products`)
    const updatedProductsData = await updatedProductsResponse.json()
    const updatedProduct = updatedProductsData.products.find(p => p.id === testProduct.id)
    
    console.log(`   Product data includes locations: ${updatedProduct.locations ? 'Yes' : 'No'}`)
    
    if (updatedProduct.locations) {
      const onlineLocationData = updatedProduct.locations.find(loc => loc.locationId === onlineLocation.id)
      const dRingLocationData = updatedProduct.locations.find(loc => loc.locationId === dRingLocation.id)
      
      console.log(`   ${onlineLocation.name} in product data: ${onlineLocationData?.stock || 'Not found'} units`)
      console.log(`   ${dRingLocation.name} in product data: ${dRingLocationData?.stock || 'Not found'} units`)
    }
    
    // Step 5: Verify the changes are correct
    console.log('\n✅ Step 5: Verification...')
    
    const onlineCorrect = updatedOnlineStock === (initialOnlineStock - 10)
    const dRingCorrect = updatedDRingStock === (initialDRingStock + 10)
    
    console.log(`   ${onlineLocation.name} stock correct: ${onlineCorrect ? '✅' : '❌'}`)
    console.log(`   ${dRingLocation.name} stock correct: ${dRingCorrect ? '✅' : '❌'}`)
    
    if (onlineCorrect && dRingCorrect) {
      console.log('\n🎉 Transfer and inventory update test PASSED!')
    } else {
      console.log('\n❌ Transfer and inventory update test FAILED!')
    }
    
    // Step 6: Restore original stock levels
    console.log('\n🔄 Step 6: Restoring original stock levels...')
    
    // Restore online stock
    const restoreOnlineResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: onlineLocation.id,
        adjustmentType: 'add',
        quantity: 10,
        reason: 'Restore original stock after test',
        notes: 'Test cleanup'
      }),
    })
    
    // Restore D-ring stock
    const restoreDRingResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: testProduct.id,
        locationId: dRingLocation.id,
        adjustmentType: 'remove',
        quantity: 10,
        reason: 'Restore original stock after test',
        notes: 'Test cleanup'
      }),
    })
    
    if (restoreOnlineResponse.ok && restoreDRingResponse.ok) {
      console.log('✅ Original stock levels restored')
    } else {
      console.log('⚠️ Failed to restore original stock levels')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testInventoryUpdateAfterTransfer()
