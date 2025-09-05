const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Revert product types back to original category-based types
const productTypeReverts = [
  // Skincare products - revert to SKINCARE
  { name: "Gentle Foaming Cleanser", originalType: "SKINCARE" },
  { name: "Vitamin C Brightening Serum", originalType: "SKINCARE" },
  { name: "Hyaluronic Acid Moisturizer", originalType: "SKINCARE" },
  { name: "Retinol Night Treatment", originalType: "SKINCARE" },
  { name: "Clay Purifying Mask", originalType: "SKINCARE" },

  // Makeup products - revert to MAKEUP
  { name: "Full Coverage Foundation", originalType: "MAKEUP" },
  { name: "Waterproof Mascara", originalType: "MAKEUP" },
  { name: "Matte Liquid Lipstick", originalType: "MAKEUP" },

  // Hair Care products - revert to HAIR_CARE
  { name: "Sulfate-Free Shampoo", originalType: "HAIR_CARE" },
  { name: "Deep Conditioning Mask", originalType: "HAIR_CARE" },

  // Hair Extensions - revert to HAIR_EXTENSIONS
  { name: "Clip-In Hair Extensions - 18 inch", originalType: "HAIR_EXTENSIONS" },
  { name: "Tape-In Extensions - 20 inch", originalType: "HAIR_EXTENSIONS" },

  // Nail Care products - revert to NAIL_CARE
  { name: "Gel Nail Polish - Classic Red", originalType: "NAIL_CARE" },
  { name: "Cuticle Oil Treatment", originalType: "NAIL_CARE" },

  // Fragrance products - revert to FRAGRANCE
  { name: "Signature Eau de Parfum", originalType: "FRAGRANCE" },

  // Personal Care products - revert to PERSONAL_CARE
  { name: "Luxury Body Lotion", originalType: "PERSONAL_CARE" },

  // Specialty products - revert to SPECIALTY
  { name: "Acne Treatment Spot Gel", originalType: "SPECIALTY" },

  // Tools - revert to TOOLS
  { name: "Professional Makeup Brush Set", originalType: "TOOLS" },
  { name: "Hair Styling Tools Set", originalType: "TOOLS" }
];

async function revertProductTypes() {
  console.log('🔄 Reverting product types to original values...');

  try {
    for (const revert of productTypeReverts) {
      const result = await prisma.product.updateMany({
        where: { name: revert.name },
        data: { type: revert.originalType }
      });
      
      if (result.count > 0) {
        console.log(`✅ Reverted "${revert.name}" type to "${revert.originalType}"`);
      } else {
        console.log(`⚠️ Product "${revert.name}" not found`);
      }
    }

    console.log('\n🎉 Product type reversion completed!');
    
    // Show the reverted types
    console.log('\n=== REVERTED PRODUCT TYPES ===');
    const products = await prisma.product.findMany({
      select: { category: true, type: true, name: true }
    });
    
    const typesByCategory = {};
    products.forEach(p => {
      if (!typesByCategory[p.category]) {
        typesByCategory[p.category] = new Set();
      }
      typesByCategory[p.category].add(p.type);
    });
    
    Object.entries(typesByCategory).forEach(([category, types]) => {
      console.log(`${category}:`);
      Array.from(types).forEach(type => console.log(`  - ${type}`));
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error reverting product types:', error);
    await prisma.$disconnect();
  }
}

revertProductTypes();
