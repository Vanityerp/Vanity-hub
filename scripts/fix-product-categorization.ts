import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping from current detailed categories to main category names
const categoryToMainCategory: { [key: string]: string } = {
  // Skincare subcategories
  "Skincare - Cleansers": "SKINCARE",
  "Skincare - Exfoliators & Toners": "SKINCARE", 
  "Skincare - Treatments": "SKINCARE",
  "Skincare - Moisturizers": "SKINCARE",
  "Skincare - Eye & Lip Care": "SKINCARE",
  "Skincare - Masks": "SKINCARE",
  "Skincare - Sun Care": "SKINCARE",
  
  // Makeup subcategories
  "Makeup - Face": "MAKEUP",
  "Makeup - Eyes": "MAKEUP", 
  "Makeup - Lips": "MAKEUP",
  
  // Haircare subcategories
  "Haircare - Cleanse & Condition": "HAIR_CARE",
  "Haircare - Styling": "HAIR_CARE",
  "Haircare - Treatments": "HAIR_CARE",
  
  // Hair Extensions subcategories
  "Hair Extensions - Human Hair": "HAIR_EXTENSIONS",
  "Hair Extensions - Synthetic Hair": "HAIR_EXTENSIONS",
  
  // Body Care subcategories
  "Body Care - Bath & Shower": "PERSONAL_CARE",
  "Body Care - Moisturizers & Treatments": "PERSONAL_CARE",
  "Body Care - Specialized Care": "PERSONAL_CARE",
  
  // Fragrance subcategories
  "Fragrance - Personal Fragrance": "FRAGRANCE",
  
  // Tools & Brushes subcategories
  "Tools & Brushes - Makeup Applicators": "TOOLS",
  "Tools & Brushes - Beauty Tools": "TOOLS",
  "Tools & Brushes - Hair Tools": "TOOLS"
}

// Mapping from current main category names to detailed type names
const mainCategoryToDetailedType: { [key: string]: string } = {
  "SKINCARE": "Skincare Products",
  "MAKEUP": "Makeup Products",
  "HAIR_CARE": "Hair Care Products",
  "HAIR_EXTENSIONS": "Hair Extension Products",
  "NAIL_CARE": "Nail Care Products",
  "FRAGRANCE": "Fragrance Products",
  "PERSONAL_CARE": "Personal Care Products",
  "SPECIALTY": "Specialty Products",
  "TOOLS": "Tools & Equipment",
  "ACCESSORIES": "Beauty Accessories",
  "OTHER": "Other Products"
}

async function fixProductCategorization() {
  console.log('🔧 Starting Product Categorization Fix...')
  console.log('This will correct the type and category field mapping:\n')
  
  console.log('📋 Current Issue:')
  console.log('   • type field contains: SKINCARE, MAKEUP, etc. (should be detailed types)')
  console.log('   • category field contains: "Skincare - Cleansers", etc. (should be main categories)')
  console.log('')
  
  console.log('🎯 After Fix:')
  console.log('   • type field will contain: detailed subcategories like "Skincare - Cleansers"')
  console.log('   • category field will contain: main categories like "SKINCARE", "MAKEUP"')
  console.log('')

  try {
    // Get all products
    const products = await prisma.product.findMany()
    console.log(`📦 Found ${products.length} products to update`)
    
    if (products.length === 0) {
      console.log('❌ No products found. Please run the product seeding first.')
      return
    }

    let updatedCount = 0
    let errorCount = 0

    // Process each product
    for (const product of products) {
      try {
        // Current values
        const currentType = product.type // This contains the main category (SKINCARE, MAKEUP, etc.)
        const currentCategory = product.category // This contains the detailed subcategory
        
        // New values (swapped)
        const newType = currentCategory // Move detailed subcategory to type field
        const newCategory = categoryToMainCategory[currentCategory] || currentType // Map to main category
        
        // Update the product
        await prisma.product.update({
          where: { id: product.id },
          data: {
            type: newType as any, // Now contains detailed subcategory
            category: newCategory // Now contains main category
          }
        })
        
        console.log(`✅ Updated: ${product.name}`)
        console.log(`   Old: type="${currentType}", category="${currentCategory}"`)
        console.log(`   New: type="${newType}", category="${newCategory}"`)
        console.log('')
        
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Error updating product ${product.name}:`, error)
        errorCount++
      }
    }

    // Summary
    console.log('🎉 PRODUCT CATEGORIZATION FIX COMPLETED! 🎉')
    console.log('=' .repeat(50))
    console.log(`📊 SUMMARY:`)
    console.log(`   Products Updated: ${updatedCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`   Total Products: ${products.length}`)
    console.log('')

    // Show new category breakdown
    const newCategoryBreakdown = await getNewCategoryBreakdown()
    console.log('📋 NEW CATEGORY BREAKDOWN (category field):')
    for (const [category, count] of Object.entries(newCategoryBreakdown)) {
      console.log(`   • ${category}: ${count} products`)
    }
    console.log('')

    // Show new type breakdown (first few examples)
    const newTypeBreakdown = await getNewTypeBreakdown()
    console.log('🏷️ NEW TYPE BREAKDOWN (type field - showing first 10):')
    const typeEntries = Object.entries(newTypeBreakdown).slice(0, 10)
    for (const [type, count] of typeEntries) {
      console.log(`   • ${type}: ${count} products`)
    }
    if (Object.keys(newTypeBreakdown).length > 10) {
      console.log(`   ... and ${Object.keys(newTypeBreakdown).length - 10} more types`)
    }
    console.log('')

    console.log('✨ Product categorization has been corrected!')
    console.log('🎯 Now:')
    console.log('   • category field contains main categories (SKINCARE, MAKEUP, etc.)')
    console.log('   • type field contains detailed subcategories (Skincare - Cleansers, etc.)')
    console.log('')
    console.log('🔄 You may need to update your frontend components to use the corrected field mapping.')

  } catch (error) {
    console.error('❌ Product categorization fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function getNewCategoryBreakdown() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  })
  
  const breakdown: Record<string, number> = {}
  categories.forEach(cat => {
    breakdown[cat.category] = cat._count.id
  })
  
  return breakdown
}

async function getNewTypeBreakdown() {
  const types = await prisma.product.groupBy({
    by: ['type'],
    _count: {
      id: true
    }
  })
  
  const breakdown: Record<string, number> = {}
  types.forEach(type => {
    breakdown[type.type] = type._count.id
  })
  
  return breakdown
}

// Run the fix function
if (require.main === module) {
  fixProductCategorization()
    .then(() => {
      console.log('🏁 Product categorization fix completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Product categorization fix failed:', error)
      process.exit(1)
    })
}

export { fixProductCategorization }
