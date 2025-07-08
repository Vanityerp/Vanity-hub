#!/usr/bin/env node

/**
 * Debug script to isolate the "Failed to fetch" error in product transfers
 */

const BASE_URL = 'http://localhost:3000'

async function debugTransferError() {
  console.log('🔍 Debugging transfer "Failed to fetch" error...')
  
  try {
    // Step 1: Test basic API connectivity
    console.log('\n📡 Step 1: Testing basic API connectivity...')
    const healthResponse = await fetch(`${BASE_URL}/api/inventory/adjust`)
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ API health check passed:', healthData.message)
    } else {
      console.log('❌ API health check failed:', healthResponse.status)
      return
    }

    // Step 2: Get test data
    console.log('\n📋 Step 2: Getting test data...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    const productsData = await productsResponse.json()
    const testProduct = productsData.products.find(p => p.isActive && p.isRetail)
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    const sourceLocation = locationsData.locations[0]
    const destLocation = locationsData.locations[1]
    
    console.log('📦 Test product:', testProduct.name)
    console.log('📍 Source location:', sourceLocation.name)
    console.log('📍 Destination location:', destLocation.name)

    // Step 3: Test single inventory adjustment
    console.log('\n🧪 Step 3: Testing single inventory adjustment...')
    const singleAdjustPayload = {
      productId: testProduct.id,
      locationId: sourceLocation.id,
      adjustmentType: 'remove',
      quantity: 1,
      reason: 'Debug test - single adjustment',
      notes: 'Testing single API call'
    }
    
    console.log('📤 Single adjustment payload:', singleAdjustPayload)
    
    const singleResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(singleAdjustPayload),
    })
    
    if (singleResponse.ok) {
      const singleResult = await singleResponse.json()
      console.log('✅ Single adjustment successful:', singleResult.message)
    } else {
      const errorText = await singleResponse.text()
      console.log('❌ Single adjustment failed:', singleResponse.status, errorText)
      return
    }

    // Step 4: Test sequential adjustments (like in transfer)
    console.log('\n🔄 Step 4: Testing sequential adjustments (simulating transfer)...')
    
    // First adjustment - remove from source
    const removePayload = {
      productId: testProduct.id,
      locationId: sourceLocation.id,
      adjustmentType: 'remove',
      quantity: 1,
      reason: `Debug transfer to ${destLocation.name}`,
      notes: 'Debug test - remove from source'
    }
    
    console.log('📤 Remove payload:', removePayload)
    
    const removeResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(removePayload),
    })
    
    if (!removeResponse.ok) {
      const errorText = await removeResponse.text()
      console.log('❌ Remove adjustment failed:', removeResponse.status, errorText)
      return
    }
    
    const removeResult = await removeResponse.json()
    console.log('✅ Remove adjustment successful:', removeResult.message)
    
    // Small delay to simulate real-world timing
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Second adjustment - add to destination
    const addPayload = {
      productId: testProduct.id,
      locationId: destLocation.id,
      adjustmentType: 'add',
      quantity: 1,
      reason: `Debug transfer from ${sourceLocation.name}`,
      notes: 'Debug test - add to destination'
    }
    
    console.log('📤 Add payload:', addPayload)
    
    const addResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addPayload),
    })
    
    if (!addResponse.ok) {
      const errorText = await addResponse.text()
      console.log('❌ Add adjustment failed:', addResponse.status, errorText)
      return
    }
    
    const addResult = await addResponse.json()
    console.log('✅ Add adjustment successful:', addResult.message)
    
    // Step 5: Test rapid sequential calls
    console.log('\n⚡ Step 5: Testing rapid sequential calls...')
    
    const rapidCalls = []
    for (let i = 0; i < 3; i++) {
      const payload = {
        productId: testProduct.id,
        locationId: sourceLocation.id,
        adjustmentType: 'add',
        quantity: 1,
        reason: `Rapid test ${i + 1}`,
        notes: 'Testing rapid sequential calls'
      }
      
      rapidCalls.push(
        fetch(`${BASE_URL}/api/inventory/adjust`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      )
    }
    
    const rapidResults = await Promise.allSettled(rapidCalls)
    rapidResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.ok) {
        console.log(`✅ Rapid call ${index + 1} successful`)
      } else {
        console.log(`❌ Rapid call ${index + 1} failed:`, result.reason || result.value.status)
      }
    })
    
    // Step 6: Cleanup - restore original state
    console.log('\n🧹 Step 6: Cleanup...')
    const cleanupPayload = {
      productId: testProduct.id,
      locationId: sourceLocation.id,
      adjustmentType: 'remove',
      quantity: 2, // Remove the extra units we added
      reason: 'Debug cleanup',
      notes: 'Restoring original state'
    }
    
    const cleanupResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanupPayload),
    })
    
    if (cleanupResponse.ok) {
      console.log('✅ Cleanup successful')
    } else {
      console.log('⚠️ Cleanup failed - manual intervention may be needed')
    }
    
    console.log('\n🎉 Debug test completed!')
    
  } catch (error) {
    console.error('❌ Debug test failed with error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  }
}

// Run the debug test
debugTransferError()
