// Test script to check API response
async function testApiResponse() {
  try {
    console.log('🔍 Testing API response...')
    
    const response = await fetch('http://localhost:3000/api/products')
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('📊 API Response Summary:')
    console.log(`   Total products: ${data.products?.length || 0}`)
    
    if (data.products && data.products.length > 0) {
      console.log('\n📋 Product Details:')
      data.products.forEach((product: any, index: number) => {
        console.log(`   ${index + 1}. ${product.name}`)
        console.log(`      isRetail: ${product.isRetail} (${typeof product.isRetail})`)
        console.log(`      isActive: ${product.isActive} (${typeof product.isActive})`)
        console.log(`      locations: ${product.locations?.length || 0}`)
        if (product.locations && product.locations.length > 0) {
          const totalStock = product.locations.reduce((sum: number, loc: any) => sum + loc.stock, 0)
          console.log(`      totalStock: ${totalStock}`)
        }
        console.log('')
      })
      
      // Filter simulation
      const retailProducts = data.products.filter((p: any) => p.isRetail === true)
      const professionalProducts = data.products.filter((p: any) => p.isRetail === false)
      
      console.log(`🛒 Retail products (isRetail === true): ${retailProducts.length}`)
      console.log(`🔧 Professional products (isRetail === false): ${professionalProducts.length}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error)
  }
}

testApiResponse()
