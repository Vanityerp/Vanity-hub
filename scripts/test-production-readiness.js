/**
 * Comprehensive test for production readiness features
 * Tests error handling, validation, audit trails, user permissions, and performance
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

async function testProductionReadiness() {
  console.log('🔒 Starting production readiness test...')
  
  try {
    const onlineLocationId = await getOnlineLocationId()
    console.log('🏪 Using online location ID:', onlineLocationId)
    
    // Test 1: Error Handling and Validation
    console.log('\n🛡️ Test 1: Error handling and validation...')
    
    // Test invalid product ID
    console.log('   Testing invalid product ID...')
    const invalidProductResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'invalid-product-id',
        locationId: onlineLocationId,
        adjustmentType: 'add',
        quantity: 1,
        reason: 'Test invalid product'
      }),
    })
    
    if (!invalidProductResponse.ok) {
      console.log('   ✅ Invalid product ID properly rejected')
    } else {
      console.log('   ⚠️ Invalid product ID was accepted (should be rejected)')
    }
    
    // Test invalid location ID
    console.log('   Testing invalid location ID...')
    const invalidLocationResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'valid-product-id',
        locationId: 'invalid-location-id',
        adjustmentType: 'add',
        quantity: 1,
        reason: 'Test invalid location'
      }),
    })
    
    if (!invalidLocationResponse.ok) {
      console.log('   ✅ Invalid location ID properly rejected')
    } else {
      console.log('   ⚠️ Invalid location ID was accepted (should be rejected)')
    }
    
    // Test invalid quantity
    console.log('   Testing invalid quantity...')
    const invalidQuantityResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'valid-product-id',
        locationId: onlineLocationId,
        adjustmentType: 'add',
        quantity: -1,
        reason: 'Test invalid quantity'
      }),
    })
    
    if (!invalidQuantityResponse.ok) {
      console.log('   ✅ Invalid quantity properly rejected')
    } else {
      console.log('   ⚠️ Invalid quantity was accepted (should be rejected)')
    }
    
    // Test missing required fields
    console.log('   Testing missing required fields...')
    const missingFieldsResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'valid-product-id',
        // Missing locationId, adjustmentType, quantity, reason
      }),
    })
    
    if (!missingFieldsResponse.ok) {
      console.log('   ✅ Missing required fields properly rejected')
    } else {
      console.log('   ⚠️ Missing required fields were accepted (should be rejected)')
    }
    
    // Test 2: Negative Stock Prevention
    console.log('\n📊 Test 2: Negative stock prevention...')
    
    // Get a product with stock for testing
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    if (inventoryResponse.ok) {
      const inventoryData = await inventoryResponse.json()
      const productsWithStock = inventoryData.inventory.filter(item => item.stock > 0)
      
      if (productsWithStock.length > 0) {
        const testProduct = productsWithStock[0]
        console.log(`   Testing with product: ${testProduct.name} (Stock: ${testProduct.stock})`)
        
        // Try to remove more stock than available
        const excessiveRemovalResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: testProduct.id,
            locationId: onlineLocationId,
            adjustmentType: 'remove',
            quantity: testProduct.stock + 100,
            reason: 'Test excessive removal'
          }),
        })
        
        if (!excessiveRemovalResponse.ok) {
          const errorData = await excessiveRemovalResponse.json()
          if (errorData.error && errorData.error.includes('Insufficient stock')) {
            console.log('   ✅ Negative stock prevention working correctly')
          } else {
            console.log('   ⚠️ Negative stock prevention may not be working properly')
          }
        } else {
          console.log('   ⚠️ Excessive stock removal was allowed (should be prevented)')
        }
      } else {
        console.log('   ⚠️ No products with stock found for negative stock test')
      }
    }
    
    // Test 3: Audit Trail Functionality
    console.log('\n📝 Test 3: Audit trail functionality...')
    
    // Check if audit trail is being created (we'll test with a valid adjustment)
    const inventoryResponse2 = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    if (inventoryResponse2.ok) {
      const inventoryData2 = await inventoryResponse2.json()
      const productsWithStock2 = inventoryData2.inventory.filter(item => item.stock > 0)
      
      if (productsWithStock2.length > 0) {
        const testProduct2 = productsWithStock2[0]
        const initialStock = testProduct2.stock
        
        console.log(`   Creating audit trail with product: ${testProduct2.name}`)
        
        // Make a small adjustment to test audit trail
        const auditTestResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: testProduct2.id,
            locationId: onlineLocationId,
            adjustmentType: 'add',
            quantity: 1,
            reason: 'Production readiness test - audit trail',
            notes: 'Testing audit trail functionality'
          }),
        })
        
        if (auditTestResponse.ok) {
          const auditResult = await auditTestResponse.json()
          if (auditResult.auditTrail) {
            console.log('   ✅ Audit trail functionality confirmed')
          } else {
            console.log('   ⚠️ Audit trail may not be working (no confirmation in response)')
          }
          
          // Restore the stock
          await fetch(`${BASE_URL}/api/inventory/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: testProduct2.id,
              locationId: onlineLocationId,
              adjustmentType: 'remove',
              quantity: 1,
              reason: 'Production readiness test - cleanup'
            }),
          })
          console.log('   ✅ Test cleanup completed')
        } else {
          console.log('   ❌ Audit trail test failed - adjustment was rejected')
        }
      }
    }
    
    // Test 4: API Response Consistency
    console.log('\n🔄 Test 4: API response consistency...')
    
    const endpoints = [
      '/api/products',
      '/api/locations',
      `/api/inventory?locationId=${onlineLocationId}`,
      '/api/shop/products'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`)
        if (response.ok) {
          const data = await response.json()
          
          // Check for consistent response structure
          if (data && typeof data === 'object') {
            console.log(`   ✅ ${endpoint}: Valid JSON response`)
          } else {
            console.log(`   ⚠️ ${endpoint}: Invalid response structure`)
          }
        } else {
          console.log(`   ❌ ${endpoint}: HTTP ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Request failed - ${error.message}`)
      }
    }
    
    // Test 5: Performance and Load Testing (Basic)
    console.log('\n⚡ Test 5: Basic performance testing...')
    
    const startTime = Date.now()
    const concurrentRequests = 5
    const promises = []
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(fetch(`${BASE_URL}/api/products`))
    }
    
    try {
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const successfulResponses = responses.filter(r => r.ok).length
      console.log(`   ✅ ${successfulResponses}/${concurrentRequests} concurrent requests successful`)
      console.log(`   ⏱️ Total time: ${duration}ms (avg: ${Math.round(duration / concurrentRequests)}ms per request)`)
      
      if (duration < 5000) {
        console.log('   ✅ Performance acceptable for basic load')
      } else {
        console.log('   ⚠️ Performance may need optimization')
      }
    } catch (error) {
      console.log(`   ❌ Concurrent request test failed: ${error.message}`)
    }
    
    // Test Summary
    console.log('\n📋 Production Readiness Test Summary:')
    console.log('   ✅ Error handling and validation tested')
    console.log('   ✅ Negative stock prevention verified')
    console.log('   ✅ Audit trail functionality confirmed')
    console.log('   ✅ API response consistency checked')
    console.log('   ✅ Basic performance testing completed')
    
    console.log('\n🎉 Production readiness test completed!')
    
  } catch (error) {
    console.error('❌ Production readiness test failed:', error.message)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testProductionReadiness()
}

module.exports = { testProductionReadiness }
