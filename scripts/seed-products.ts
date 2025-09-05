import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Product categories mapping to string values
const categoryTypeMapping: { [key: string]: string } = {
  'Skincare': 'SKINCARE',
  'Makeup': 'MAKEUP',
  'Hair Care': 'HAIR_CARE',
  'Hair Extensions': 'HAIR_EXTENSIONS',
  'Nail Care': 'NAIL_CARE',
  'Fragrance': 'FRAGRANCE',
  'Personal Care': 'PERSONAL_CARE',
  'Specialty': 'SPECIALTY',
  'Tools': 'TOOLS',
  'Accessories': 'ACCESSORIES'
}

// Comprehensive product catalog based on the provided categories
const productCatalog = [
  // ============================================================================
  // SKINCARE PRODUCTS
  // ============================================================================

  // Cleansers
  {
    name: "Gentle Gel Cleanser",
    description: "A refreshing gel cleanser that removes impurities without stripping the skin.",
    price: 85,
    cost: 42.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-GC-001",
    barcode: "8901234560001",
    isRetail: true,
    isFeatured: true,
    features: ["Gentle formula", "Deep cleansing", "Suitable for all skin types"],
    ingredients: ["Glycerin", "Sodium Cocoyl Glutamate", "Aloe Vera Extract"]
  },
  {
    name: "Luxurious Foam Cleanser",
    description: "Rich foaming cleanser that creates a luxurious lather for deep cleansing.",
    price: 95,
    cost: 47.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-FC-002",
    barcode: "8901234560002",
    isRetail: true,
    features: ["Rich foam", "Deep cleansing", "Removes makeup"],
    ingredients: ["Coconut Oil", "Glycerin", "Chamomile Extract"]
  },
  {
    name: "Nourishing Cream Cleanser",
    description: "Creamy cleanser that nourishes while cleansing, perfect for dry skin.",
    price: 105,
    cost: 52.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-CC-003",
    barcode: "8901234560003",
    isRetail: true,
    features: ["Nourishing", "Moisturizing", "For dry skin"],
    ingredients: ["Shea Butter", "Ceramides", "Hyaluronic Acid"]
  },
  {
    name: "Purifying Oil Cleanser",
    description: "Oil-based cleanser that dissolves makeup and impurities effortlessly.",
    price: 115,
    cost: 57.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-OC-004",
    barcode: "8901234560004",
    isRetail: true,
    features: ["Dissolves makeup", "Oil-based", "Deep cleansing"],
    ingredients: ["Jojoba Oil", "Vitamin E", "Rosehip Oil"]
  },
  {
    name: "Cleansing Balm",
    description: "Solid balm that melts into oil for gentle yet effective cleansing.",
    price: 125,
    cost: 62.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-CB-005",
    barcode: "8901234560005",
    isRetail: true,
    features: ["Melts into oil", "Gentle", "Removes waterproof makeup"],
    ingredients: ["Coconut Oil", "Beeswax", "Vitamin E"]
  },
  {
    name: "Micellar Water",
    description: "Gentle micellar water that removes makeup and cleanses in one step.",
    price: 75,
    cost: 37.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-MW-006",
    barcode: "8901234560006",
    isRetail: true,
    features: ["No rinse required", "Gentle", "All-in-one"],
    ingredients: ["Micelles", "Glycerin", "Rose Water"]
  },
  {
    name: "Makeup Remover",
    description: "Effective makeup remover that gently dissolves even waterproof makeup.",
    price: 85,
    cost: 42.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-MR-007",
    barcode: "8901234560007",
    isRetail: true,
    features: ["Waterproof formula", "Gentle", "Quick removal"],
    ingredients: ["Mineral Oil", "Vitamin E", "Chamomile"]
  },
  {
    name: "Powder Cleanser",
    description: "Innovative powder cleanser that activates with water for gentle exfoliation.",
    price: 135,
    cost: 67.5,
    category: "Skincare - Cleansers",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-PC-008",
    barcode: "8901234560008",
    isRetail: true,
    features: ["Powder to foam", "Gentle exfoliation", "Travel-friendly"],
    ingredients: ["Rice Powder", "Papaya Enzyme", "Oat Extract"]
  },
  {
    name: "Vitamin C Brightening Serum",
    description: "Powerful antioxidant serum with 20% Vitamin C to brighten skin and reduce dark spots.",
    price: 120,
    cost: 60,
    category: "Skincare",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-VC-002",
    barcode: "8901234560002",
    isRetail: true,
    isBestSeller: true,
    features: ["20% Vitamin C", "Brightening", "Anti-aging"],
    ingredients: ["L-Ascorbic Acid", "Vitamin E", "Ferulic Acid"]
  },
  {
    name: "Hyaluronic Acid Moisturizer",
    description: "Intensive hydrating moisturizer with multiple types of hyaluronic acid for all-day moisture.",
    price: 95,
    cost: 47.5,
    category: "Skincare",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-HA-003",
    barcode: "8901234560003",
    isRetail: true,
    features: ["Multi-molecular hyaluronic acid", "24-hour hydration", "Non-comedogenic"],
    ingredients: ["Hyaluronic Acid", "Ceramides", "Niacinamide"]
  },
  {
    name: "Retinol Night Treatment",
    description: "Advanced retinol treatment for anti-aging and skin renewal while you sleep.",
    price: 150,
    cost: 75,
    category: "Skincare",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-RT-004",
    barcode: "8901234560004",
    isRetail: true,
    features: ["0.5% Retinol", "Anti-aging", "Skin renewal"],
    ingredients: ["Retinol", "Squalane", "Vitamin E"]
  },
  {
    name: "Clay Purifying Mask",
    description: "Deep cleansing clay mask that draws out impurities and minimizes pores.",
    price: 65,
    cost: 32.5,
    category: "Skincare",
    type: 'SKINCARE',
    brand: "VanityHub Pro",
    sku: "SK-CM-005",
    barcode: "8901234560005",
    isRetail: true,
    features: ["Deep cleansing", "Pore minimizing", "Oil control"],
    ingredients: ["Bentonite Clay", "Kaolin", "Tea Tree Oil"]
  },

  // Makeup Products
  {
    name: "Full Coverage Foundation",
    description: "Long-wearing, full coverage foundation with SPF 30 protection.",
    price: 110,
    cost: 55,
    category: "Makeup",
    type: 'MAKEUP',
    brand: "VanityHub Cosmetics",
    sku: "MK-FD-001",
    barcode: "8901234570001",
    isRetail: true,
    isFeatured: true,
    features: ["Full coverage", "SPF 30", "24-hour wear"],
    ingredients: ["Titanium Dioxide", "Iron Oxides", "Hyaluronic Acid"]
  },
  {
    name: "Waterproof Mascara",
    description: "Volumizing and lengthening waterproof mascara for dramatic lashes.",
    price: 45,
    cost: 22.5,
    category: "Makeup",
    type: 'MAKEUP',
    brand: "VanityHub Cosmetics",
    sku: "MK-MS-002",
    barcode: "8901234570002",
    isRetail: true,
    isBestSeller: true,
    features: ["Waterproof", "Volumizing", "Lengthening"],
    ingredients: ["Beeswax", "Carnauba Wax", "Iron Oxides"]
  },
  {
    name: "Matte Liquid Lipstick",
    description: "Long-lasting matte liquid lipstick with comfortable wear.",
    price: 35,
    cost: 17.5,
    category: "Makeup",
    type: 'MAKEUP',
    brand: "VanityHub Cosmetics",
    sku: "MK-LL-003",
    barcode: "8901234570003",
    isRetail: true,
    features: ["Matte finish", "Long-lasting", "Comfortable wear"],
    ingredients: ["Dimethicone", "Isododecane", "Vitamin E"]
  },

  // Hair Care Products
  {
    name: "Sulfate-Free Shampoo",
    description: "Gentle sulfate-free shampoo for all hair types, preserves color and moisture.",
    price: 55,
    cost: 27.5,
    category: "Hair Care",
    type: 'HAIR_CARE',
    brand: "VanityHub Hair",
    sku: "HC-SH-001",
    barcode: "8901234580001",
    isRetail: true,
    features: ["Sulfate-free", "Color-safe", "Moisturizing"],
    ingredients: ["Sodium Cocoyl Isethionate", "Argan Oil", "Keratin"]
  },
  {
    name: "Deep Conditioning Mask",
    description: "Intensive repair mask for damaged and chemically treated hair.",
    price: 75,
    cost: 37.5,
    category: "Hair Care",
    type: 'HAIR_CARE',
    brand: "VanityHub Hair",
    sku: "HC-CM-002",
    barcode: "8901234580002",
    isRetail: true,
    isFeatured: true,
    features: ["Deep conditioning", "Repair formula", "Protein treatment"],
    ingredients: ["Hydrolyzed Keratin", "Coconut Oil", "Shea Butter"]
  },

  // Hair Extensions
  {
    name: "Clip-In Hair Extensions - 18 inch",
    description: "Premium human hair clip-in extensions, 18 inches, natural black.",
    price: 280,
    cost: 140,
    category: "Hair Extensions",
    type: 'HAIR_EXTENSIONS',
    brand: "VanityHub Extensions",
    sku: "HE-CI-001",
    barcode: "8901234590001",
    isRetail: true,
    isFeatured: true,
    features: ["100% human hair", "18 inches", "Clip-in application"],
    ingredients: ["Human Hair", "Metal Clips", "Silicone Coating"]
  },
  {
    name: "Tape-In Extensions - 20 inch",
    description: "Seamless tape-in extensions, 20 inches, medium brown color.",
    price: 350,
    cost: 175,
    category: "Hair Extensions",
    type: 'HAIR_EXTENSIONS',
    brand: "VanityHub Extensions",
    sku: "HE-TI-002",
    barcode: "8901234590002",
    isRetail: true,
    features: ["Tape-in method", "20 inches", "Seamless blend"],
    ingredients: ["Human Hair", "Medical Grade Tape", "Keratin Treatment"]
  },

  // Nail Care Products
  {
    name: "Gel Nail Polish - Classic Red",
    description: "Long-lasting gel nail polish with high-shine finish.",
    price: 25,
    cost: 12.5,
    category: "Nail Care",
    type: 'NAIL_CARE',
    brand: "VanityHub Nails",
    sku: "NC-GP-001",
    barcode: "8901234600001",
    isRetail: true,
    features: ["Gel formula", "High-shine", "Chip-resistant"],
    ingredients: ["Acrylates Copolymer", "Photoinitiators", "Pigments"]
  },
  {
    name: "Cuticle Oil Treatment",
    description: "Nourishing cuticle oil with vitamin E and jojoba oil.",
    price: 18,
    cost: 9,
    category: "Nail Care",
    type: 'NAIL_CARE',
    brand: "VanityHub Nails",
    sku: "NC-CO-002",
    barcode: "8901234600002",
    isRetail: true,
    features: ["Vitamin E", "Jojoba oil", "Nourishing"],
    ingredients: ["Jojoba Oil", "Vitamin E", "Sweet Almond Oil"]
  },

  // Fragrance Products
  {
    name: "Signature Eau de Parfum",
    description: "Luxurious signature fragrance with floral and woody notes.",
    price: 180,
    cost: 90,
    category: "Fragrance",
    type: 'FRAGRANCE',
    brand: "VanityHub Fragrance",
    sku: "FR-EP-001",
    barcode: "8901234610001",
    isRetail: true,
    isFeatured: true,
    features: ["Long-lasting", "Floral notes", "Woody base"],
    ingredients: ["Alcohol Denat", "Fragrance", "Benzyl Salicylate"]
  },

  // Personal Care Products
  {
    name: "Luxury Body Lotion",
    description: "Rich moisturizing body lotion with shea butter and vitamin E.",
    price: 45,
    cost: 22.5,
    category: "Personal Care",
    type: 'PERSONAL_CARE',
    brand: "VanityHub Care",
    sku: "PC-BL-001",
    barcode: "8901234620001",
    isRetail: true,
    features: ["Shea butter", "Vitamin E", "24-hour moisture"],
    ingredients: ["Shea Butter", "Vitamin E", "Glycerin"]
  },

  // Specialty Products
  {
    name: "Acne Treatment Spot Gel",
    description: "Targeted acne treatment with salicylic acid and tea tree oil.",
    price: 32,
    cost: 16,
    category: "Specialty",
    type: 'SPECIALTY',
    brand: "VanityHub Treatment",
    sku: "SP-AT-001",
    barcode: "8901234630001",
    isRetail: true,
    features: ["Salicylic acid", "Tea tree oil", "Spot treatment"],
    ingredients: ["Salicylic Acid", "Tea Tree Oil", "Niacinamide"]
  }
]

async function seedProducts() {
  console.log('🌱 Starting product seeding...')

  try {
    // Clear existing products
    await prisma.productLocation.deleteMany()
    await prisma.product.deleteMany()
    console.log('🗑️ Cleared existing products')

    // Get all locations for product-location associations
    const locations = await prisma.location.findMany()
    console.log(`📍 Found ${locations.length} locations`)

    // Create products
    for (const productData of productCatalog) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          features: JSON.stringify(productData.features || []), // Convert array to JSON string
          ingredients: JSON.stringify(productData.ingredients || []), // Convert array to JSON string
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rating 3.0-5.0
          reviewCount: Math.floor(Math.random() * 50), // Random review count 0-49
          isNew: Math.random() > 0.8, // 20% chance of being new
        }
      })

      // Create product-location associations with random stock
      for (const location of locations) {
        await prisma.productLocation.create({
          data: {
            productId: product.id,
            locationId: location.id,
            stock: Math.floor(Math.random() * 50) + 10, // Random stock 10-59
            price: null // Use default product price
          }
        })
      }

      console.log(`✅ Created product: ${product.name}`)
    }

    console.log(`🎉 Successfully seeded ${productCatalog.length} products!`)
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✅ Product seeding completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Product seeding failed:', error)
      process.exit(1)
    })
}

export { seedProducts }
