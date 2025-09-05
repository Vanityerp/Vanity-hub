import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Product data with corrected field mapping
// category = main category (SKINCARE, MAKEUP, etc.)
// type = detailed subcategory (Skincare - Cleansers, etc.)
const products = [
  // SKINCARE PRODUCTS
  // Cleansers
  {
    name: "Gentle Gel Cleanser",
    description: "A mild, soap-free gel cleanser that removes impurities without stripping the skin.",
    price: 28.99,
    cost: 14.50,
    category: "SKINCARE", // Main category
    type: "Skincare - Cleansers", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-GGC-001",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    rating: 4.5,
    reviewCount: 23,
    features: JSON.stringify(["Soap-free formula", "Gentle on sensitive skin", "Removes makeup"]),
    ingredients: JSON.stringify(["Aqua", "Sodium Cocoyl Glutamate", "Glycerin", "Chamomile Extract"]),
    howToUse: JSON.stringify(["Apply to damp skin", "Massage gently", "Rinse with lukewarm water"])
  },
  {
    name: "Foaming Face Cleanser",
    description: "Rich foaming cleanser that deeply cleanses pores and removes excess oil.",
    price: 32.99,
    cost: 16.50,
    category: "SKINCARE",
    type: "Skincare - Cleansers",
    brand: "VanityHub",
    sku: "VH-FFC-002",
    isRetail: true,
    isActive: true,
    rating: 4.3,
    reviewCount: 18,
    features: JSON.stringify(["Deep pore cleansing", "Oil control", "Rich foam texture"]),
    ingredients: JSON.stringify(["Aqua", "Sodium Lauryl Sulfate", "Glycerin", "Salicylic Acid"]),
    howToUse: JSON.stringify(["Wet face", "Apply small amount", "Work into lather", "Rinse thoroughly"])
  },
  {
    name: "Cream Cleanser",
    description: "Nourishing cream cleanser perfect for dry and mature skin types.",
    price: 35.99,
    cost: 18.00,
    category: "SKINCARE",
    type: "Skincare - Cleansers",
    brand: "VanityHub",
    sku: "VH-CC-003",
    isRetail: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 31,
    features: JSON.stringify(["Nourishing formula", "For dry skin", "Anti-aging benefits"]),
    ingredients: JSON.stringify(["Aqua", "Cetyl Alcohol", "Glycerin", "Shea Butter", "Vitamin E"]),
    howToUse: JSON.stringify(["Apply to dry skin", "Massage in circular motions", "Remove with warm cloth"])
  },

  // MAKEUP PRODUCTS
  // Face
  {
    name: "Flawless Foundation",
    description: "Full coverage liquid foundation with 24-hour wear and natural finish.",
    price: 42.99,
    cost: 21.50,
    category: "MAKEUP", // Main category
    type: "Makeup - Face", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-FF-101",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    rating: 4.6,
    reviewCount: 45,
    features: JSON.stringify(["Full coverage", "24-hour wear", "Natural finish", "Buildable"]),
    ingredients: JSON.stringify(["Aqua", "Cyclopentasiloxane", "Titanium Dioxide", "Iron Oxides"]),
    howToUse: JSON.stringify(["Apply with brush or sponge", "Blend outward from center", "Build coverage as needed"])
  },
  {
    name: "Perfect Concealer",
    description: "High-coverage concealer that hides imperfections and brightens under eyes.",
    price: 24.99,
    cost: 12.50,
    category: "MAKEUP",
    type: "Makeup - Face",
    brand: "VanityHub",
    sku: "VH-PC-102",
    isRetail: true,
    isActive: true,
    rating: 4.4,
    reviewCount: 28,
    features: JSON.stringify(["High coverage", "Under-eye brightening", "Long-lasting"]),
    ingredients: JSON.stringify(["Aqua", "Dimethicone", "Titanium Dioxide", "Vitamin C"]),
    howToUse: JSON.stringify(["Apply to blemishes", "Blend edges", "Set with powder"])
  },

  // Eyes
  {
    name: "Eyeshadow Palette - Neutral",
    description: "12-shade neutral eyeshadow palette with matte and shimmer finishes.",
    price: 38.99,
    cost: 19.50,
    category: "MAKEUP",
    type: "Makeup - Eyes",
    brand: "VanityHub",
    sku: "VH-EP-201",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 52,
    features: JSON.stringify(["12 shades", "Matte & shimmer", "Highly pigmented", "Blendable"]),
    ingredients: JSON.stringify(["Talc", "Mica", "Magnesium Stearate", "Iron Oxides"]),
    howToUse: JSON.stringify(["Apply with brush", "Blend colors", "Build intensity"])
  },

  // HAIR CARE PRODUCTS
  {
    name: "Moisturizing Shampoo",
    description: "Sulfate-free shampoo that gently cleanses while adding moisture.",
    price: 26.99,
    cost: 13.50,
    category: "HAIR_CARE", // Main category
    type: "Haircare - Cleanse & Condition", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-MS-301",
    isRetail: true,
    isActive: true,
    rating: 4.5,
    reviewCount: 34,
    features: JSON.stringify(["Sulfate-free", "Moisturizing", "Color-safe", "For all hair types"]),
    ingredients: JSON.stringify(["Aqua", "Sodium Cocoyl Isethionate", "Argan Oil", "Keratin"]),
    howToUse: JSON.stringify(["Wet hair", "Apply to scalp", "Massage and lather", "Rinse thoroughly"])
  },

  // HAIR EXTENSIONS
  {
    name: "Clip-In Hair Extensions - 18 inch",
    description: "100% human hair clip-in extensions for instant length and volume.",
    price: 89.99,
    cost: 45.00,
    category: "HAIR_EXTENSIONS", // Main category
    type: "Hair Extensions - Human Hair", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-CHE-401",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    rating: 4.7,
    reviewCount: 19,
    features: JSON.stringify(["100% human hair", "18 inch length", "Easy clip-in", "Heat styleable"]),
    ingredients: JSON.stringify(["Human Hair", "Metal Clips", "Silicone Coating"]),
    howToUse: JSON.stringify(["Section hair", "Clip in extensions", "Blend with natural hair", "Style as desired"])
  },

  // PERSONAL CARE (Body Care)
  {
    name: "Luxurious Body Lotion",
    description: "Rich, moisturizing body lotion with shea butter and vitamin E.",
    price: 22.99,
    cost: 11.50,
    category: "PERSONAL_CARE", // Main category
    type: "Body Care - Moisturizers & Treatments", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-LBL-501",
    isRetail: true,
    isActive: true,
    rating: 4.6,
    reviewCount: 27,
    features: JSON.stringify(["Rich moisturizing", "Shea butter", "Vitamin E", "Non-greasy"]),
    ingredients: JSON.stringify(["Aqua", "Shea Butter", "Vitamin E", "Glycerin", "Fragrance"]),
    howToUse: JSON.stringify(["Apply to clean skin", "Massage until absorbed", "Use daily"])
  },

  // FRAGRANCE
  {
    name: "Signature Eau de Parfum",
    description: "Elegant floral fragrance with notes of jasmine, rose, and vanilla.",
    price: 65.99,
    cost: 33.00,
    category: "FRAGRANCE", // Main category
    type: "Fragrance - Personal Fragrance", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-SEP-601",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    rating: 4.4,
    reviewCount: 15,
    features: JSON.stringify(["Long-lasting", "Floral scent", "Elegant bottle", "50ml size"]),
    ingredients: JSON.stringify(["Alcohol", "Fragrance", "Aqua", "Jasmine Extract", "Rose Extract"]),
    howToUse: JSON.stringify(["Spray on pulse points", "Apply to wrists and neck", "Reapply as needed"])
  },

  // TOOLS
  {
    name: "Professional Makeup Brush Set",
    description: "Complete 12-piece makeup brush set with synthetic bristles.",
    price: 49.99,
    cost: 25.00,
    category: "TOOLS", // Main category
    type: "Tools & Brushes - Makeup Applicators", // Detailed subcategory
    brand: "VanityHub",
    sku: "VH-MBS-701",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 41,
    features: JSON.stringify(["12-piece set", "Synthetic bristles", "Professional quality", "Travel case included"]),
    ingredients: JSON.stringify(["Synthetic Bristles", "Aluminum Ferrule", "Wood Handle"]),
    howToUse: JSON.stringify(["Use appropriate brush for each product", "Clean regularly", "Store in case"])
  }
]

async function seedCorrectedProducts() {
  console.log('🌱 Starting Corrected Product Seeding...')
  console.log('This will populate the database with products using the correct field mapping:\n')
  
  console.log('✅ Correct Field Mapping:')
  console.log('   • category field = main categories (SKINCARE, MAKEUP, HAIR_CARE, etc.)')
  console.log('   • type field = detailed subcategories (Skincare - Cleansers, Makeup - Face, etc.)')
  console.log('')

  try {
    // Clear existing products first
    console.log('🧹 Clearing existing products...')
    await prisma.productLocation.deleteMany()
    await prisma.product.deleteMany()
    console.log('✅ Existing products cleared')
    console.log('')

    // Get all locations for inventory seeding
    const locations = await prisma.location.findMany()
    console.log(`📍 Found ${locations.length} locations for inventory distribution`)
    
    if (locations.length === 0) {
      console.log('❌ No locations found. Please seed locations first.')
      return
    }

    let createdCount = 0
    let errorCount = 0

    // Create each product
    for (const productData of products) {
      try {
        // Create the product
        const product = await prisma.product.create({
          data: productData
        })

        console.log(`✅ Created: ${product.name}`)
        console.log(`   Category: ${product.category} | Type: ${product.type}`)
        
        // Create inventory for each location
        for (const location of locations) {
          const stockLevel = Math.floor(Math.random() * 50) + 10 // 10-59 units
          
          await prisma.productLocation.create({
            data: {
              productId: product.id,
              locationId: location.id,
              stock: stockLevel
            }
          })
        }
        
        console.log(`   📦 Inventory created for ${locations.length} locations`)
        console.log('')
        
        createdCount++
        
      } catch (error) {
        console.error(`❌ Error creating product ${productData.name}:`, error)
        errorCount++
      }
    }

    // Summary
    console.log('🎉 CORRECTED PRODUCT SEEDING COMPLETED! 🎉')
    console.log('=' .repeat(50))
    console.log(`📊 SUMMARY:`)
    console.log(`   Products Created: ${createdCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`   Total Inventory Records: ${createdCount * locations.length}`)
    console.log('')

    // Show category breakdown
    const categoryBreakdown = await getCategoryBreakdown()
    console.log('📋 CATEGORY BREAKDOWN (category field):')
    for (const [category, count] of Object.entries(categoryBreakdown)) {
      console.log(`   • ${category}: ${count} products`)
    }
    console.log('')

    // Show type breakdown
    const typeBreakdown = await getTypeBreakdown()
    console.log('🏷️ TYPE BREAKDOWN (type field):')
    for (const [type, count] of Object.entries(typeBreakdown)) {
      console.log(`   • ${type}: ${count} products`)
    }
    console.log('')

    console.log('✨ Products are now correctly categorized!')
    console.log('🎯 Field mapping:')
    console.log('   • category = main categories (for filtering)')
    console.log('   • type = detailed subcategories (for organization)')

  } catch (error) {
    console.error('❌ Product seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function getCategoryBreakdown() {
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

async function getTypeBreakdown() {
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

// Run the seeding function
if (require.main === module) {
  seedCorrectedProducts()
    .then(() => {
      console.log('🏁 Corrected product seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Corrected product seeding failed:', error)
      process.exit(1)
    })
}

export { seedCorrectedProducts }
