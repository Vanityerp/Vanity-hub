#!/usr/bin/env node

/**
 * Script to fix negative stock issues in the inventory
 */

const BASE_URL = 'http://localhost:3000'

async function fixNegativeStock() {
  console.log('🔧 Starting negative stock fix...')
  
  try {
    // Step 1: Get all products and their stock levels
    console.log('\n📋 Step 1: Analyzing current stock levels...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    const productsData = await productsResponse.json()
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    
    console.log(`📦 Found ${productsData.products.length} products`)
    console.log(`📍 Found ${locationsData.locations.length} locations`)
    
    // Step 2: Check for negative stock across all locations
    console.log('\n🔍 Step 2: Identifying negative stock issues...')
    const negativeStockIssues = []
    
    for (const product of productsData.products) {
      for (const location of locationsData.locations) {
        // Get inventory for this product at this location
        const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${location.id}`)
        const inventoryData = await inventoryResponse.json()
        
        const productInventory = inventoryData.inventory.find(inv => inv.id === product.id)
        if (productInventory && productInventory.stock < 0) {
          negativeStockIssues.push({
            productId: product.id,
            productName: product.name,
            locationId: location.id,
            locationName: location.name,
            currentStock: productInventory.stock
          })
        }
      }
    }
    
    console.log(`⚠️ Found ${negativeStockIssues.length} negative stock issues:`)
    negativeStockIssues.forEach(issue => {
      console.log(`   📦 ${issue.productName} at ${issue.locationName}: ${issue.currentStock} units`)
    })
    
    if (negativeStockIssues.length === 0) {
      console.log('✅ No negative stock issues found!')
      return
    }
    
    // Step 3: Fix negative stock issues
    console.log('\n🔧 Step 3: Fixing negative stock issues...')
    
    for (const issue of negativeStockIssues) {
      console.log(`\n🔄 Fixing ${issue.productName} at ${issue.locationName}...`)
      console.log(`   Current stock: ${issue.currentStock}`)
      
      // Calculate how much to add to bring stock to 0
      const adjustmentQuantity = Math.abs(issue.currentStock)
      console.log(`   Adding ${adjustmentQuantity} units to bring stock to 0`)
      
      const adjustmentPayload = {
        productId: issue.productId,
        locationId: issue.locationId,
        adjustmentType: 'add',
        quantity: adjustmentQuantity,
        reason: 'Fix negative stock - inventory correction',
        notes: `Correcting negative stock from ${issue.currentStock} to 0`
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
        console.log(`   ✅ Fixed: ${result.previousStock} → ${result.newStock}`)
      } else {
        const errorText = await adjustmentResponse.text()
        console.log(`   ❌ Failed to fix: ${adjustmentResponse.status} ${errorText}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Step 4: Verify fixes
    console.log('\n🔍 Step 4: Verifying fixes...')
    
    for (const issue of negativeStockIssues) {
      const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${issue.locationId}`)
      const inventoryData = await inventoryResponse.json()
      
      const productInventory = inventoryData.inventory.find(inv => inv.id === issue.productId)
      if (productInventory) {
        if (productInventory.stock >= 0) {
          console.log(`   ✅ ${issue.productName} at ${issue.locationName}: ${productInventory.stock} units`)
        } else {
          console.log(`   ❌ ${issue.productName} at ${issue.locationName}: Still negative (${productInventory.stock} units)`)
        }
      }
    }
    
    console.log('\n🎉 Negative stock fix completed!')
    
  } catch (error) {
    console.error('❌ Fix failed with error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
  }
}

// Run the fix
fixNegativeStock()
