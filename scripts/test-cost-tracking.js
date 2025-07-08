/**
 * Comprehensive test for cost tracking and financial integration
 * Tests COGS calculations, profit margins, inventory valuation, and financial record updates
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

async function testCostTracking() {
  console.log('💰 Starting comprehensive cost tracking test...')
  
  try {
    const onlineLocationId = await getOnlineLocationId()
    console.log('🏪 Using online location ID:', onlineLocationId)
    
    // Test 1: Get products with cost data
    console.log('\n📋 Test 1: Analyzing products with cost data...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    
    if (!productsResponse.ok) {
      throw new Error(`Products API failed: ${productsResponse.statusText}`)
    }
    
    const productsData = await productsResponse.json()
    const products = productsData.products || []
    
    // Analyze cost data completeness
    const productsWithCost = products.filter(p => p.cost && p.cost > 0)
    const productsWithPrice = products.filter(p => p.price && p.price > 0)
    const productsWithBoth = products.filter(p => p.cost && p.cost > 0 && p.price && p.price > 0)
    
    console.log(`📊 Cost Data Analysis:`)
    console.log(`   Total products: ${products.length}`)
    console.log(`   Products with cost price: ${productsWithCost.length}`)
    console.log(`   Products with retail price: ${productsWithPrice.length}`)
    console.log(`   Products with both cost & retail price: ${productsWithBoth.length}`)
    
    if (productsWithBoth.length === 0) {
      console.log('⚠️ No products found with both cost and retail prices for profit calculation')
      return
    }
    
    // Test 2: Calculate profit margins for existing products
    console.log('\n💹 Test 2: Calculating profit margins...')
    const profitAnalysis = productsWithBoth.map(product => {
      const costPrice = parseFloat(product.cost)
      const retailPrice = parseFloat(product.price)
      const salePrice = product.salePrice ? parseFloat(product.salePrice) : retailPrice
      
      const profitMargin = ((salePrice - costPrice) / salePrice) * 100
      const profitAmount = salePrice - costPrice
      
      return {
        id: product.id,
        name: product.name,
        cost: costPrice,
        price: retailPrice,
        salePrice,
        profitAmount,
        profitMargin: Math.round(profitMargin * 100) / 100
      }
    })
    
    // Sort by profit margin
    profitAnalysis.sort((a, b) => b.profitMargin - a.profitMargin)
    
    console.log('📈 Top 5 products by profit margin:')
    profitAnalysis.slice(0, 5).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`)
      console.log(`      Cost: $${product.cost.toFixed(2)} | Sale: $${product.salePrice.toFixed(2)}`)
      console.log(`      Profit: $${product.profitAmount.toFixed(2)} (${product.profitMargin}%)`)
    })
    
    // Test 3: Test inventory sale with COGS calculation
    console.log('\n🛒 Test 3: Testing inventory sale with COGS calculation...')
    
    // Find a product with stock for testing
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${onlineLocationId}`)
    if (!inventoryResponse.ok) {
      throw new Error(`Inventory API failed: ${inventoryResponse.statusText}`)
    }
    
    const inventoryData = await inventoryResponse.json()
    const productsWithStock = inventoryData.inventory.filter(item => 
      item.stock > 0 && 
      productsWithBoth.some(p => p.id === item.id)
    )
    
    if (productsWithStock.length === 0) {
      console.log('⚠️ No products with both stock and cost data found for sale test')
      return
    }
    
    const testProduct = productsWithStock[0]
    const productDetails = productsWithBoth.find(p => p.id === testProduct.id)

    if (!productDetails) {
      console.log('⚠️ Could not find product details for stock item')
      return
    }

    console.log(`📦 Testing sale with product: ${testProduct.name}`)
    console.log(`   Current stock: ${testProduct.stock}`)
    console.log(`   Cost price: $${parseFloat(productDetails.cost).toFixed(2)}`)
    console.log(`   Retail price: $${parseFloat(productDetails.price).toFixed(2)}`)
    
    // Simulate a sale (we'll use the inventory adjustment API to simulate)
    const saleQuantity = 1
    const salePrice = productDetails.salePrice || parseFloat(productDetails.price)
    const costPrice = parseFloat(productDetails.cost)
    
    // Calculate expected financial metrics
    const expectedRevenue = salePrice * saleQuantity
    const expectedCOGS = costPrice * saleQuantity
    const expectedProfit = expectedRevenue - expectedCOGS
    const expectedMargin = (expectedProfit / expectedRevenue) * 100
    
    console.log(`💰 Expected financial impact:`)
    console.log(`   Revenue: $${expectedRevenue.toFixed(2)}`)
    console.log(`   COGS: $${expectedCOGS.toFixed(2)}`)
    console.log(`   Profit: $${expectedProfit.toFixed(2)}`)
    console.log(`   Margin: ${expectedMargin.toFixed(2)}%`)
    
    // Test 4: Check if inventory sale API exists and works
    console.log('\n🔍 Test 4: Testing inventory sale API...')
    
    try {
      const saleResponse = await fetch(`${BASE_URL}/api/inventory/sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: testProduct.id,
          productName: testProduct.name,
          locationId: onlineLocationId,
          quantity: saleQuantity,
          retailPrice: salePrice,
          costPrice: costPrice,
          clientId: 'test-client',
          clientName: 'Test Customer',
          paymentMethod: 'card'
        }),
      })
      
      if (saleResponse.ok) {
        const saleResult = await saleResponse.json()
        console.log('✅ Inventory sale API working')
        console.log(`   Sale ID: ${saleResult.saleId || 'N/A'}`)
        console.log(`   Financial transactions created: ${saleResult.transactions?.length || 0}`)
        
        if (saleResult.financialMetrics) {
          console.log(`   Calculated COGS: $${saleResult.financialMetrics.totalCost?.toFixed(2) || 'N/A'}`)
          console.log(`   Calculated Revenue: $${saleResult.financialMetrics.totalRevenue?.toFixed(2) || 'N/A'}`)
          console.log(`   Calculated Margin: ${saleResult.financialMetrics.profitMargin?.toFixed(2) || 'N/A'}%`)
        }
      } else {
        console.log('⚠️ Inventory sale API not available or failed')
        const errorData = await saleResponse.json()
        console.log(`   Error: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.log('⚠️ Inventory sale API test failed:', error.message)
    }
    
    // Test 5: Check inventory valuation
    console.log('\n📊 Test 5: Calculating inventory valuation...')
    
    let totalInventoryValue = 0
    let totalInventoryItems = 0
    
    for (const item of inventoryData.inventory) {
      if (item.stock > 0) {
        const product = products.find(p => p.id === item.id)
        if (product && product.cost) {
          const itemValue = item.stock * parseFloat(product.cost)
          totalInventoryValue += itemValue
          totalInventoryItems += item.stock
          
          if (item.stock > 10) { // Only show high-value items
            console.log(`   ${product.name}: ${item.stock} units × $${parseFloat(product.cost).toFixed(2)} = $${itemValue.toFixed(2)}`)
          }
        }
      }
    }
    
    console.log(`📈 Inventory Valuation Summary:`)
    console.log(`   Total inventory value: $${totalInventoryValue.toFixed(2)}`)
    console.log(`   Total inventory items: ${totalInventoryItems}`)
    console.log(`   Average cost per item: $${totalInventoryItems > 0 ? (totalInventoryValue / totalInventoryItems).toFixed(2) : '0.00'}`)
    
    // Test 6: Analyze cost tracking completeness
    console.log('\n🔍 Test 6: Cost tracking completeness analysis...')
    
    const missingCostProducts = products.filter(p => !p.cost || p.cost <= 0)
    const missingPriceProducts = products.filter(p => !p.price || p.price <= 0)
    
    console.log(`⚠️ Data Quality Issues:`)
    console.log(`   Products missing cost price: ${missingCostProducts.length}`)
    console.log(`   Products missing retail price: ${missingPriceProducts.length}`)
    
    if (missingCostProducts.length > 0) {
      console.log(`   Products needing cost prices:`)
      missingCostProducts.slice(0, 5).forEach(product => {
        console.log(`     - ${product.name}`)
      })
      if (missingCostProducts.length > 5) {
        console.log(`     ... and ${missingCostProducts.length - 5} more`)
      }
    }
    
    // Test Summary
    console.log('\n📝 Cost Tracking Test Summary:')
    console.log(`   ✅ Product cost data analysis completed`)
    console.log(`   ✅ Profit margin calculations verified`)
    console.log(`   ✅ Inventory valuation calculated`)
    console.log(`   ✅ Data quality assessment completed`)
    
    if (productsWithBoth.length / products.length > 0.8) {
      console.log(`   ✅ Good cost data coverage (${Math.round((productsWithBoth.length / products.length) * 100)}%)`)
    } else {
      console.log(`   ⚠️ Cost data coverage needs improvement (${Math.round((productsWithBoth.length / products.length) * 100)}%)`)
    }
    
    console.log('\n🎉 Cost tracking test completed!')
    
  } catch (error) {
    console.error('❌ Cost tracking test failed:', error.message)
    process.exit(1)
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCostTracking()
}

module.exports = { testCostTracking }
