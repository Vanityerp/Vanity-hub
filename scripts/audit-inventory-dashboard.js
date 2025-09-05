/**
 * Comprehensive audit script for the inventory dashboard tab functionality
 * Tests all tabs, filtering, stock display, and product actions
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

async function auditInventoryDashboard() {
  console.log('🔍 Starting comprehensive inventory dashboard audit...')
  
  try {
    const onlineLocationId = await getOnlineLocationId()
    console.log('🏪 Using online location ID:', onlineLocationId)
    
    // Test 1: Verify products API is working
    console.log('\n📋 Test 1: Verifying products API...')
    const productsResponse = await fetch(`${BASE_URL}/api/products`)
    
    if (!productsResponse.ok) {
      throw new Error(`Products API failed: ${productsResponse.statusText}`)
    }
    
    const productsData = await productsResponse.json()
    const products = productsData.products || []
    console.log(`✅ Products API working - Found ${products.length} products`)
    
    if (products.length === 0) {
      console.log('⚠️ No products found - dashboard tabs may appear empty')
      return
    }
    
    // Test 2: Analyze product distribution by type
    console.log('\n📊 Test 2: Analyzing product distribution...')
    const retailProducts = products.filter(p => p.isRetail)
    const professionalProducts = products.filter(p => !p.isRetail)
    const activeProducts = products.filter(p => p.isActive)
    const inactiveProducts = products.filter(p => !p.isActive)
    
    console.log(`   📦 Total products: ${products.length}`)
    console.log(`   🛒 Retail products: ${retailProducts.length}`)
    console.log(`   🔧 Professional products: ${professionalProducts.length}`)
    console.log(`   ✅ Active products: ${activeProducts.length}`)
    console.log(`   ❌ Inactive products: ${inactiveProducts.length}`)
    
    // Test 3: Check inventory data for each location
    console.log('\n📍 Test 3: Checking inventory data by location...')
    const locationsResponse = await fetch(`${BASE_URL}/api/locations`)
    
    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json()
      const locations = locationsData.locations || []
      
      for (const location of locations) {
        const inventoryResponse = await fetch(`${BASE_URL}/api/inventory?locationId=${location.id}`)
        
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json()
          const inventory = inventoryData.inventory || []
          console.log(`   📍 ${location.name}: ${inventory.length} products with stock data`)
          
          // Check for products with stock
          const productsWithStock = inventory.filter(item => item.stock > 0)
          const lowStockProducts = inventory.filter(item => item.stock > 0 && item.stock < 5) // Assuming min stock of 5
          const outOfStockProducts = inventory.filter(item => item.stock === 0)
          
          console.log(`      📦 Products with stock: ${productsWithStock.length}`)
          console.log(`      ⚠️ Low stock products: ${lowStockProducts.length}`)
          console.log(`      ❌ Out of stock products: ${outOfStockProducts.length}`)
        } else {
          console.log(`   ❌ Failed to fetch inventory for ${location.name}`)
        }
      }
    }
    
    // Test 4: Verify shop products API (for retail tab)
    console.log('\n🛒 Test 4: Verifying shop products API...')
    const shopResponse = await fetch(`${BASE_URL}/api/shop/products`)
    
    if (shopResponse.ok) {
      const shopData = await shopResponse.json()
      const shopProducts = shopData.products || []
      console.log(`✅ Shop API working - Found ${shopProducts.length} retail products`)
      
      // Check if shop products match retail products from main API
      const retailFromMain = products.filter(p => p.isRetail && p.isActive)
      if (shopProducts.length !== retailFromMain.length) {
        console.log(`⚠️ Mismatch: Shop has ${shopProducts.length} products, but main API shows ${retailFromMain.length} active retail products`)
      } else {
        console.log(`✅ Shop products count matches active retail products`)
      }
    } else {
      console.log(`❌ Shop API failed: ${shopResponse.statusText}`)
    }
    
    // Test 5: Check for missing required fields
    console.log('\n🔍 Test 5: Checking for missing required fields...')
    const issues = []
    
    products.forEach((product, index) => {
      if (!product.id) issues.push(`Product ${index}: Missing ID`)
      if (!product.name) issues.push(`Product ${index}: Missing name`)
      if (product.price === undefined || product.price === null) issues.push(`Product ${product.name || index}: Missing price`)
      if (product.isRetail === undefined) issues.push(`Product ${product.name || index}: Missing isRetail flag`)
      if (product.isActive === undefined) issues.push(`Product ${product.name || index}: Missing isActive flag`)
      if (!product.category) issues.push(`Product ${product.name || index}: Missing category`)
      
      // Check location data
      if (!product.locations || product.locations.length === 0) {
        issues.push(`Product ${product.name || index}: Missing location data`)
      }
    })
    
    if (issues.length > 0) {
      console.log(`❌ Found ${issues.length} data issues:`)
      issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`))
      if (issues.length > 10) {
        console.log(`   ... and ${issues.length - 10} more issues`)
      }
    } else {
      console.log(`✅ No data integrity issues found`)
    }
    
    // Test 6: Test stock calculation logic
    console.log('\n📊 Test 6: Testing stock calculation logic...')
    const sampleProduct = products.find(p => p.locations && p.locations.length > 0)
    
    if (sampleProduct) {
      console.log(`   Testing with product: ${sampleProduct.name}`)
      
      // Test total stock calculation (for "all" location)
      const totalStock = sampleProduct.locations.reduce((total, loc) => total + loc.stock, 0)
      console.log(`   📦 Total stock across all locations: ${totalStock}`)
      
      // Test individual location stock
      sampleProduct.locations.forEach(loc => {
        console.log(`   📍 Stock at location ${loc.locationId}: ${loc.stock}`)
      })
      
      // Test online store stock (for retail tab)
      if (sampleProduct.isRetail) {
        const onlineStock = sampleProduct.locations.find(loc => 
          loc.locationId === onlineLocationId ||
          loc.locationId === "online"
        )
        if (onlineStock) {
          console.log(`   🛒 Online store stock: ${onlineStock.stock}`)
        } else {
          console.log(`   ⚠️ No online store stock data found for retail product`)
        }
      }
    } else {
      console.log(`   ⚠️ No products with location data found for testing`)
    }
    
    // Test 7: Summary and recommendations
    console.log('\n📝 Test 7: Summary and recommendations...')
    
    const summary = {
      totalProducts: products.length,
      retailProducts: retailProducts.length,
      professionalProducts: professionalProducts.length,
      activeProducts: activeProducts.length,
      dataIssues: issues.length,
      hasLocationData: products.filter(p => p.locations && p.locations.length > 0).length
    }
    
    console.log('📊 Dashboard Audit Summary:')
    console.log(`   ✅ Total products: ${summary.totalProducts}`)
    console.log(`   🛒 Retail products (for Retail tab): ${summary.retailProducts}`)
    console.log(`   🔧 Professional products (for Professional tab): ${summary.professionalProducts}`)
    console.log(`   📍 Products with location data: ${summary.hasLocationData}`)
    console.log(`   ⚠️ Data integrity issues: ${summary.dataIssues}`)
    
    // Recommendations
    console.log('\n💡 Recommendations:')
    
    if (summary.retailProducts === 0) {
      console.log('   - Add retail products to populate the Retail & Shop tab')
    }
    
    if (summary.professionalProducts === 0) {
      console.log('   - Add professional products to populate the Professional Use tab')
    }
    
    if (summary.hasLocationData < summary.totalProducts) {
      console.log('   - Ensure all products have location-specific stock data')
    }
    
    if (summary.dataIssues > 0) {
      console.log('   - Fix data integrity issues to ensure proper tab functionality')
    }
    
    console.log('\n🎉 Inventory dashboard audit completed!')
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message)
    process.exit(1)
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  auditInventoryDashboard()
}

module.exports = { auditInventoryDashboard }
