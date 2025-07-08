import { prisma } from "@/lib/prisma"

// Comprehensive salon inventory categorization system
const comprehensiveCategories = [
  {
    name: "SKINCARE",
    types: [
      "Skincare - Cleansers",
      "Skincare - Toners & Essences", 
      "Skincare - Serums & Treatments",
      "Skincare - Moisturizers",
      "Skincare - Eye Care",
      "Skincare - Sun Protection",
      "Skincare - Masks & Exfoliants",
      "Skincare - Anti-Aging",
      "Skincare - Acne Treatment"
    ]
  },
  {
    name: "MAKEUP",
    types: [
      "Makeup - Face",
      "Makeup - Eyes", 
      "Makeup - Lips",
      "Makeup - Cheeks",
      "Makeup - Brows",
      "Makeup - Setting & Finishing",
      "Makeup - Primers",
      "Makeup - Concealers & Correctors"
    ]
  },
  {
    name: "HAIRCARE",
    types: [
      "Haircare - Cleanse & Condition",
      "Haircare - Styling",
      "Haircare - Treatments & Masks",
      "Haircare - Color Care",
      "Haircare - Heat Protection",
      "Haircare - Scalp Care",
      "Haircare - Professional Tools"
    ]
  },
  {
    name: "HAIR_EXTENSIONS",
    types: [
      "Hair Extensions - Human Hair",
      "Hair Extensions - Synthetic",
      "Hair Extensions - Clip-In",
      "Hair Extensions - Tape-In", 
      "Hair Extensions - Sew-In",
      "Hair Extensions - Fusion",
      "Hair Extensions - Accessories"
    ]
  },
  {
    name: "BODY_CARE",
    types: [
      "Body Care - Cleansers",
      "Body Care - Moisturizers & Treatments",
      "Body Care - Exfoliants",
      "Body Care - Sun Care",
      "Body Care - Hand & Foot Care",
      "Body Care - Specialty Treatments"
    ]
  },
  {
    name: "FRAGRANCE",
    types: [
      "Fragrance - Personal Fragrance",
      "Fragrance - Body Mists",
      "Fragrance - Room & Linen",
      "Fragrance - Gift Sets"
    ]
  },
  {
    name: "TOOLS",
    types: [
      "Tools & Brushes - Makeup Applicators",
      "Tools & Brushes - Hair Styling",
      "Tools & Brushes - Skincare Tools",
      "Tools & Brushes - Nail Tools",
      "Tools & Brushes - Professional Equipment",
      "Tools & Brushes - Accessories"
    ]
  }
]

export async function seedComprehensiveCategories() {
  console.log("🌱 Starting comprehensive category seeding...")

  try {
    // Get existing products to understand current categories
    const existingProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true, type: true }
    })

    console.log(`📊 Found ${existingProducts.length} existing products`)

    // Create sample products for missing categories/types
    const productsToCreate = []

    for (const categoryData of comprehensiveCategories) {
      for (const type of categoryData.types) {
        // Check if we already have a product with this category/type combination
        const existingProduct = existingProducts.find(p => 
          p.category === categoryData.name && p.type === type
        )

        if (!existingProduct) {
          // Create a sample product for this category/type
          const productName = `Sample ${type.replace(/.*- /, '')}`
          productsToCreate.push({
            name: productName,
            description: `Sample product for ${type}`,
            price: 29.99,
            cost: 15.00,
            category: categoryData.name,
            type: type,
            brand: "VanityHub",
            sku: `VH-${categoryData.name.substring(0,3)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            isRetail: true,
            isActive: true,
            isFeatured: false,
            rating: 4.5,
            reviewCount: 10,
            features: JSON.stringify([`High quality ${type.toLowerCase()}`, "Professional grade", "Salon tested"]),
            ingredients: JSON.stringify(["Premium ingredients", "Dermatologist tested"]),
            howToUse: JSON.stringify(["Apply as directed", "Use daily for best results"])
          })
        }
      }
    }

    if (productsToCreate.length > 0) {
      console.log(`🔄 Creating ${productsToCreate.length} sample products for missing categories/types...`)
      
      // Create products in batches to avoid overwhelming the database
      const batchSize = 10
      for (let i = 0; i < productsToCreate.length; i += batchSize) {
        const batch = productsToCreate.slice(i, i + batchSize)
        await prisma.product.createMany({
          data: batch,
          skipDuplicates: true
        })
        console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productsToCreate.length/batchSize)}`)
      }
    } else {
      console.log("✅ All categories and types already have products")
    }

    console.log("🎉 Comprehensive category seeding completed successfully!")
    
    // Return summary
    const finalCategories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true }
    })

    const finalTypes = await prisma.product.groupBy({
      by: ['category', 'type'],
      where: { isActive: true },
      _count: { type: true }
    })

    return {
      categoriesCount: finalCategories.length,
      typesCount: finalTypes.length,
      productsCreated: productsToCreate.length
    }

  } catch (error) {
    console.error("❌ Error seeding comprehensive categories:", error)
    throw error
  }
}
