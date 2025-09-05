// Test script to verify comprehensive product catalog
const { comprehensiveProductCatalog, enhancedProductCategories } = require('./lib/comprehensive-products-integration.ts')

console.log('🧪 Testing Comprehensive Product Catalog')
console.log('==========================================')

try {
  console.log(`📦 Total products in catalog: ${comprehensiveProductCatalog.length}`)
  
  // Group products by category
  const productsByCategory = {}
  comprehensiveProductCatalog.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = []
    }
    productsByCategory[product.category].push(product)
  })
  
  console.log('\n📊 Products by Category:')
  Object.keys(productsByCategory).forEach(category => {
    console.log(`  ${category}: ${productsByCategory[category].length} products`)
  })
  
  console.log('\n🏷️ Enhanced Categories:')
  enhancedProductCategories.forEach(cat => {
    console.log(`  ${cat.name}: ${cat.productCount} products - ${cat.description}`)
  })
  
  console.log('\n💰 Price Range Analysis:')
  const prices = comprehensiveProductCatalog.map(p => p.price).filter(p => p > 0)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  
  console.log(`  Min Price: ${minPrice} QAR`)
  console.log(`  Max Price: ${maxPrice} QAR`)
  console.log(`  Average Price: ${avgPrice.toFixed(2)} QAR`)
  
  console.log('\n🛍️ Retail vs Professional:')
  const retailProducts = comprehensiveProductCatalog.filter(p => p.isRetail)
  const professionalProducts = comprehensiveProductCatalog.filter(p => !p.isRetail)
  console.log(`  Retail Products: ${retailProducts.length}`)
  console.log(`  Professional Products: ${professionalProducts.length}`)
  
  console.log('\n✅ Comprehensive catalog test completed successfully!')
  
} catch (error) {
  console.error('❌ Error testing comprehensive catalog:', error)
}
