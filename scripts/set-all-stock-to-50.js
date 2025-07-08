#!/usr/bin/env node

/**
 * Script to set all product stock levels to 50 units across all locations
 */

const BASE_URL = 'http://localhost:3000'

async function setAllStockTo50() {
  console.log('📦 Setting all product stock levels to 50 units...')
  
  try {
    // Get all products and locations
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    const productsData = await productsResponse.json()
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    
    console.log(`📦 Found ${productsData.products.length} products`)
    console.log(`📍 Found ${locationsData.locations.length} locations`)
    
    let adjustmentCount = 0
    
    // For each product and location combination
    for (const product of productsData.products) {
      for (const location of locationsData.locations) {
        console.log(`\n🔄 Processing ${product.name} at ${location.name}...`)
        
        // Get current stock for this product at this location
        const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${location.id}`)
        const inventoryData = await inventoryResponse.json()
        
        const productInventory = inventoryData.inventory.find(inv => inv.id === product.id)
        const currentStock = productInventory ? productInventory.stock : 0
        
        console.log(`   Current stock: ${currentStock}`)
        
        if (currentStock !== 50) {
          // Calculate adjustment needed
          const adjustmentType = currentStock < 50 ? 'add' : 'remove'
          const adjustmentQuantity = Math.abs(50 - currentStock)
          
          console.log(`   Adjusting: ${adjustmentType} ${adjustmentQuantity} units`)
          
          const adjustmentPayload = {
            productId: product.id,
            locationId: location.id,
            adjustmentType: adjustmentType,
            quantity: adjustmentQuantity,
            reason: 'Set all stock to 50 units for testing',
            notes: `Standardizing stock levels - previous: ${currentStock}, target: 50`
          }
          
          const adjustmentResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adjustmentPayload),
          })
          
          if (adjustmentResponse.ok) {
            const result = await adjustmentResponse.json()
            console.log(`   ✅ Adjusted: ${result.previousStock} → ${result.newStock}`)
            adjustmentCount++
          } else {
            const errorText = await adjustmentResponse.text()
            console.log(`   ❌ Failed: ${adjustmentResponse.status} ${errorText}`)
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 50))
        } else {
          console.log(`   ✅ Already at 50 units`)
        }
      }
    }
    
    console.log(`\n🎉 Stock adjustment completed!`)
    console.log(`📊 Total adjustments made: ${adjustmentCount}`)
    
    // Verify the changes
    console.log('\n🔍 Verifying stock levels...')
    let verificationCount = 0
    let correctCount = 0
    
    for (const product of productsData.products) {
      for (const location of locationsData.locations) {
        const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${location.id}`)
        const inventoryData = await inventoryResponse.json()
        
        const productInventory = inventoryData.inventory.find(inv => inv.id === product.id)
        const currentStock = productInventory ? productInventory.stock : 0
        
        verificationCount++
        if (currentStock === 50) {
          correctCount++
        } else {
          console.log(`⚠️ ${product.name} at ${location.name}: ${currentStock} (expected 50)`)
        }
      }
    }
    
    console.log(`\n📊 Verification Results:`)
    console.log(`   Total checked: ${verificationCount}`)
    console.log(`   Correct (50 units): ${correctCount}`)
    console.log(`   Incorrect: ${verificationCount - correctCount}`)
    console.log(`   Success rate: ${((correctCount / verificationCount) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Failed to set stock levels:', error)
  }
}

// Run the script
setAllStockTo50()
