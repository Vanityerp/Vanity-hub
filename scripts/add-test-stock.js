#!/usr/bin/env node

/**
 * Script to add test stock to locations for transfer testing
 */

const BASE_URL = 'http://localhost:3000'

async function addTestStock() {
  console.log('📦 Adding test stock for transfer testing...')
  
  try {
    // Get test data
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    const productsData = await productsResponse.json()
    const testProduct = productsData.products.find(p => p.name === 'Clip-In Hair Extensions - 18 inch')
    
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    const locationsData = await locationsResponse.json()
    const dRingLocation = locationsData.locations.find(l => l.name === 'D-ring road')
    
    console.log('📦 Test product:', testProduct.name)
    console.log('📍 Test location:', dRingLocation.name)
    
    // Add 50 units to D-ring road location
    const addStockPayload = {
      productId: testProduct.id,
      locationId: dRingLocation.id,
      adjustmentType: 'add',
      quantity: 50,
      reason: 'Add test stock for transfer testing',
      notes: 'Adding stock to enable transfer functionality testing'
    }
    
    console.log('📤 Adding 50 units...')
    
    const addResponse = await fetch(`${BASE_URL}/api/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addStockPayload),
    })
    
    if (addResponse.ok) {
      const result = await addResponse.json()
      console.log(`✅ Stock added successfully: ${result.previousStock} → ${result.newStock}`)
    } else {
      const errorText = await addResponse.text()
      console.log(`❌ Failed to add stock: ${addResponse.status} ${errorText}`)
      return
    }
    
    // Verify the stock was added
    console.log('\n🔍 Verifying stock addition...')
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${dRingLocation.id}`)
    const inventoryData = await inventoryResponse.json()
    
    const productInventory = inventoryData.inventory.find(inv => inv.id === testProduct.id)
    if (productInventory) {
      console.log(`✅ Current stock at ${dRingLocation.name}: ${productInventory.stock} units`)
    }
    
    console.log('\n🎉 Test stock added successfully!')
    
  } catch (error) {
    console.error('❌ Failed to add test stock:', error)
  }
}

// Run the script
addTestStock()
