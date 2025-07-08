import { prisma } from "@/lib/prisma"

// Comprehensive beauty product categorization and seeding system
interface ProductData {
  name: string
  description: string
  price: number
  cost?: number
  category: string
  type: string
  brand?: string
  sku: string
  image?: string
  isRetail: boolean
  isActive: boolean
  isFeatured?: boolean
  isNew?: boolean
  isBestSeller?: boolean
  features?: string[]
  ingredients?: string[]
  howToUse?: string[]
}

// Comprehensive product categories with subcategories and sample products
const comprehensiveProductData: ProductData[] = [
  // ============================================================================
  // 1. SKIN CARE CATEGORY
  // ============================================================================
  
  // Cleansers Subcategory
  {
    name: "Gentle Foaming Cleanser",
    description: "A mild, sulfate-free foaming cleanser suitable for all skin types. Removes makeup and impurities without stripping the skin.",
    price: 28.00,
    cost: 14.00,
    category: "Skin Care",
    type: "Cleansers - Foaming Cleansers",
    brand: "SalonPro",
    sku: "SP-FC-001",
    isRetail: true,
    isActive: true,
    isNew: true,
    features: ["Sulfate-free", "Gentle formula", "Removes makeup"],
    ingredients: ["Glycerin", "Coconut-derived surfactants", "Chamomile extract"],
    howToUse: ["Apply to damp skin", "Massage gently", "Rinse with lukewarm water"]
  },
  {
    name: "Hydrating Cream Cleanser",
    description: "Rich, creamy cleanser that nourishes while cleansing. Perfect for dry and sensitive skin types.",
    price: 32.00,
    cost: 16.00,
    category: "Skin Care",
    type: "Cleansers - Cream Cleansers",
    brand: "BeautyLux",
    sku: "BL-CC-002",
    isRetail: true,
    isActive: true,
    features: ["Hydrating formula", "For dry skin", "Non-stripping"],
    ingredients: ["Shea butter", "Ceramides", "Hyaluronic acid"],
    howToUse: ["Apply to dry skin", "Massage in circular motions", "Remove with warm cloth"]
  },
  {
    name: "Purifying Gel Cleanser",
    description: "Deep-cleansing gel formula that removes excess oil and unclogs pores. Ideal for oily and acne-prone skin.",
    price: 26.00,
    cost: 13.00,
    category: "Skin Care",
    type: "Cleansers - Gel Cleansers",
    brand: "ClearSkin",
    sku: "CS-GC-003",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Oil control", "Pore cleansing", "Acne-fighting"],
    ingredients: ["Salicylic acid", "Tea tree oil", "Niacinamide"],
    howToUse: ["Apply to wet skin", "Work into lather", "Rinse thoroughly"]
  },
  {
    name: "Nourishing Oil Cleanser",
    description: "Luxurious oil cleanser that melts away makeup and sunscreen while nourishing the skin barrier.",
    price: 38.00,
    cost: 19.00,
    category: "Skin Care",
    type: "Cleansers - Oil Cleansers",
    brand: "GlowEssentials",
    sku: "GE-OC-004",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Makeup removal", "Nourishing oils", "Double cleanse"],
    ingredients: ["Jojoba oil", "Vitamin E", "Rosehip oil"],
    howToUse: ["Apply to dry skin", "Massage for 1 minute", "Emulsify with water and rinse"]
  },
  {
    name: "Micellar Cleansing Water",
    description: "Gentle, no-rinse micellar water that removes makeup and cleanses skin in one step. Perfect for sensitive skin.",
    price: 22.00,
    cost: 11.00,
    category: "Skin Care",
    type: "Cleansers - Micellar Water",
    brand: "PureMicellar",
    sku: "PM-MW-005",
    isRetail: true,
    isActive: true,
    features: ["No-rinse formula", "Sensitive skin", "Makeup removal"],
    ingredients: ["Micelles", "Glycerin", "Cucumber extract"],
    howToUse: ["Soak cotton pad", "Gently wipe face", "No rinsing required"]
  },

  // Exfoliators & Peels Subcategory
  {
    name: "Gentle Face Scrub",
    description: "Physical exfoliant with fine particles that buff away dead skin cells for smoother, brighter skin.",
    price: 24.00,
    cost: 12.00,
    category: "Skin Care",
    type: "Exfoliators & Peels - Face Scrubs",
    brand: "SmoothSkin",
    sku: "SS-FS-006",
    isRetail: true,
    isActive: true,
    features: ["Physical exfoliation", "Brightening", "Smooth texture"],
    ingredients: ["Jojoba beads", "Vitamin C", "Aloe vera"],
    howToUse: ["Apply to damp skin", "Massage gently", "Rinse with warm water"]
  },
  {
    name: "AHA Exfoliating Serum",
    description: "Chemical exfoliant with alpha hydroxy acids that gently dissolve dead skin cells and improve skin texture.",
    price: 42.00,
    cost: 21.00,
    category: "Skin Care",
    type: "Exfoliators & Peels - Chemical Exfoliants",
    brand: "AcidWorks",
    sku: "AW-AHA-007",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Chemical exfoliation", "Texture improvement", "Brightening"],
    ingredients: ["Glycolic acid", "Lactic acid", "Hyaluronic acid"],
    howToUse: ["Apply to clean skin", "Use 2-3 times per week", "Follow with moisturizer"]
  },

  // Toners & Essences Subcategory
  {
    name: "Hydrating Rose Toner",
    description: "Alcohol-free toner that hydrates and balances skin pH while providing a refreshing rose scent.",
    price: 29.00,
    cost: 14.50,
    category: "Skin Care",
    type: "Toners & Essences - Hydrating Toners",
    brand: "RoseGlow",
    sku: "RG-HT-008",
    isRetail: true,
    isActive: true,
    features: ["Alcohol-free", "pH balancing", "Hydrating"],
    ingredients: ["Rose water", "Hyaluronic acid", "Glycerin"],
    howToUse: ["Apply with cotton pad", "Pat into skin", "Follow with serum"]
  },
  {
    name: "Clarifying Witch Hazel Toner",
    description: "Astringent toner that minimizes pores and controls oil production. Ideal for oily and combination skin.",
    price: 25.00,
    cost: 12.50,
    category: "Skin Care",
    type: "Toners & Essences - Clarifying Toners",
    brand: "ClearPore",
    sku: "CP-CT-009",
    isRetail: true,
    isActive: true,
    features: ["Pore minimizing", "Oil control", "Astringent"],
    ingredients: ["Witch hazel", "Salicylic acid", "Tea tree oil"],
    howToUse: ["Apply with cotton pad", "Avoid eye area", "Use morning and evening"]
  },

  // Serums & Treatments Subcategory
  {
    name: "Vitamin C Brightening Serum",
    description: "Potent antioxidant serum that brightens skin, fades dark spots, and protects against environmental damage.",
    price: 48.00,
    cost: 24.00,
    category: "Skin Care",
    type: "Serums & Treatments - Brightening Serums",
    brand: "VitaGlow",
    sku: "VG-VCS-010",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    features: ["Brightening", "Antioxidant protection", "Dark spot fading"],
    ingredients: ["Vitamin C", "Vitamin E", "Ferulic acid"],
    howToUse: ["Apply to clean skin", "Use in morning", "Follow with SPF"]
  },
  {
    name: "Hyaluronic Acid Hydrating Serum",
    description: "Intensive hydrating serum that plumps skin and provides long-lasting moisture for all skin types.",
    price: 36.00,
    cost: 18.00,
    category: "Skin Care",
    type: "Serums & Treatments - Hydrating Serums",
    brand: "HydraBoost",
    sku: "HB-HAS-011",
    isRetail: true,
    isActive: true,
    isNew: true,
    features: ["Deep hydration", "Plumping effect", "All skin types"],
    ingredients: ["Hyaluronic acid", "Sodium hyaluronate", "Glycerin"],
    howToUse: ["Apply to damp skin", "Pat gently", "Follow with moisturizer"]
  },
  {
    name: "Retinol Anti-Aging Serum",
    description: "Advanced anti-aging serum with retinol that reduces fine lines, wrinkles, and improves skin texture.",
    price: 52.00,
    cost: 26.00,
    category: "Skin Care",
    type: "Serums & Treatments - Anti-Aging Serums",
    brand: "YouthRenew",
    sku: "YR-RAS-012",
    isRetail: true,
    isActive: true,
    features: ["Anti-aging", "Wrinkle reduction", "Texture improvement"],
    ingredients: ["Retinol", "Peptides", "Squalane"],
    howToUse: ["Use at night only", "Start 2x per week", "Always follow with SPF next day"]
  },
  {
    name: "Niacinamide Pore Refining Serum",
    description: "Multi-benefit serum that minimizes pores, controls oil, and improves overall skin texture and tone.",
    price: 34.00,
    cost: 17.00,
    category: "Skin Care",
    type: "Serums & Treatments - Niacinamide Serums",
    brand: "PoreControl",
    sku: "PC-NRS-013",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Pore minimizing", "Oil control", "Texture improvement"],
    ingredients: ["Niacinamide", "Zinc", "Hyaluronic acid"],
    howToUse: ["Apply to clean skin", "Use morning and evening", "Layer under moisturizer"]
  },

  // Moisturizers Subcategory
  {
    name: "Daily Hydrating Day Cream",
    description: "Lightweight day moisturizer with SPF 30 that hydrates and protects skin from UV damage.",
    price: 35.00,
    cost: 17.50,
    category: "Skin Care",
    type: "Moisturizers - Day Creams",
    brand: "DayGlow",
    sku: "DG-DHC-014",
    isRetail: true,
    isActive: true,
    features: ["SPF 30 protection", "Lightweight", "Daily use"],
    ingredients: ["Zinc oxide", "Hyaluronic acid", "Vitamin E"],
    howToUse: ["Apply as last step", "Use every morning", "Reapply as needed"]
  },
  {
    name: "Intensive Night Repair Cream",
    description: "Rich, nourishing night cream that repairs and regenerates skin while you sleep.",
    price: 45.00,
    cost: 22.50,
    category: "Skin Care",
    type: "Moisturizers - Night Creams",
    brand: "NightRenew",
    sku: "NR-IRC-015",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Overnight repair", "Rich formula", "Anti-aging"],
    ingredients: ["Peptides", "Ceramides", "Retinyl palmitate"],
    howToUse: ["Apply to clean skin", "Use every night", "Massage gently"]
  },

  // ============================================================================
  // 2. MAKEUP CATEGORY
  // ============================================================================

  // Face Subcategory
  {
    name: "Illuminating Face Primer",
    description: "Lightweight primer that creates a smooth base for makeup while adding a subtle glow.",
    price: 32.00,
    cost: 16.00,
    category: "Makeup",
    type: "Face - Primer",
    brand: "GlowBase",
    sku: "GB-IFP-016",
    isRetail: true,
    isActive: true,
    isNew: true,
    features: ["Illuminating", "Smooth base", "Long-lasting"],
    ingredients: ["Silicones", "Light-reflecting particles", "Vitamin E"],
    howToUse: ["Apply after skincare", "Blend evenly", "Wait before foundation"]
  },
  {
    name: "Full Coverage Foundation",
    description: "Long-wearing liquid foundation that provides full coverage with a natural finish.",
    price: 42.00,
    cost: 21.00,
    category: "Makeup",
    type: "Face - Foundation",
    brand: "FlawlessFinish",
    sku: "FF-FCF-017",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Full coverage", "Long-wearing", "Natural finish"],
    ingredients: ["Titanium dioxide", "Iron oxides", "Hyaluronic acid"],
    howToUse: ["Apply with brush or sponge", "Blend outward", "Build coverage as needed"]
  },
  {
    name: "Color Correcting Concealer",
    description: "High-coverage concealer that corrects dark circles and blemishes for a flawless complexion.",
    price: 28.00,
    cost: 14.00,
    category: "Makeup",
    type: "Face - Concealer",
    brand: "CoverPerfect",
    sku: "CP-CCC-018",
    isRetail: true,
    isActive: true,
    features: ["High coverage", "Color correcting", "Long-lasting"],
    ingredients: ["Kaolin clay", "Vitamin C", "Peptides"],
    howToUse: ["Apply to problem areas", "Blend edges", "Set with powder"]
  },
  {
    name: "Radiant Blush Duo",
    description: "Silky powder blush duo with complementary shades for a natural, healthy glow.",
    price: 26.00,
    cost: 13.00,
    category: "Makeup",
    type: "Face - Blush",
    brand: "BlushBeauty",
    sku: "BB-RBD-019",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Dual shades", "Silky texture", "Natural glow"],
    ingredients: ["Mica", "Talc", "Natural pigments"],
    howToUse: ["Apply with brush", "Blend upward", "Build color gradually"]
  },
  {
    name: "Contour & Highlight Palette",
    description: "Professional contour and highlight palette with 6 shades for sculpting and defining facial features.",
    price: 38.00,
    cost: 19.00,
    category: "Makeup",
    type: "Face - Contour Kits",
    brand: "SculptPro",
    sku: "SP-CHP-020",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["6 shades", "Professional quality", "Sculpting"],
    ingredients: ["Pressed powders", "Mica", "Silica"],
    howToUse: ["Use darker shades to contour", "Use lighter shades to highlight", "Blend well"]
  },

  // Eyes Subcategory
  {
    name: "Neutral Eyeshadow Palette",
    description: "12-shade eyeshadow palette with versatile neutral tones for everyday and evening looks.",
    price: 45.00,
    cost: 22.50,
    category: "Makeup",
    type: "Eyes - Eyeshadow Palettes",
    brand: "EyeArt",
    sku: "EA-NEP-021",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["12 shades", "Neutral tones", "Versatile"],
    ingredients: ["Talc", "Mica", "Dimethicone"],
    howToUse: ["Apply with brush", "Blend colors", "Build intensity"]
  },
  {
    name: "Waterproof Mascara",
    description: "Long-lasting waterproof mascara that lengthens and volumizes lashes without smudging.",
    price: 24.00,
    cost: 12.00,
    category: "Makeup",
    type: "Eyes - Mascara",
    brand: "LashPerfect",
    sku: "LP-WM-022",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Waterproof", "Lengthening", "Volumizing"],
    ingredients: ["Waxes", "Polymers", "Iron oxides"],
    howToUse: ["Apply from root to tip", "Wiggle brush", "Layer for volume"]
  },
  {
    name: "Precision Liquid Eyeliner",
    description: "Ultra-fine tip liquid eyeliner for precise application and long-lasting wear.",
    price: 22.00,
    cost: 11.00,
    category: "Makeup",
    type: "Eyes - Eyeliner",
    brand: "LinePerfect",
    sku: "LP-PLE-023",
    isRetail: true,
    isActive: true,
    features: ["Precision tip", "Long-lasting", "Intense color"],
    ingredients: ["Acrylates copolymer", "Carbon black", "Glycerin"],
    howToUse: ["Start from inner corner", "Draw thin line", "Connect to outer corner"]
  },

  // Lips Subcategory
  {
    name: "Matte Liquid Lipstick",
    description: "Long-wearing liquid lipstick with intense color payoff and comfortable matte finish.",
    price: 26.00,
    cost: 13.00,
    category: "Makeup",
    type: "Lips - Liquid Lipstick",
    brand: "LipLux",
    sku: "LL-MLL-024",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Matte finish", "Long-wearing", "Intense color"],
    ingredients: ["Dimethicone", "Kaolin", "Vitamin E"],
    howToUse: ["Apply from center outward", "Allow to dry", "Avoid eating/drinking"]
  },
  {
    name: "Hydrating Lip Gloss",
    description: "Non-sticky lip gloss that provides shine and hydration with a hint of color.",
    price: 18.00,
    cost: 9.00,
    category: "Makeup",
    type: "Lips - Lip Gloss",
    brand: "GlossyLips",
    sku: "GL-HLG-025",
    isRetail: true,
    isActive: true,
    features: ["Hydrating", "Non-sticky", "Shiny finish"],
    ingredients: ["Hyaluronic acid", "Jojoba oil", "Vitamin E"],
    howToUse: ["Apply to clean lips", "Reapply as needed", "Layer over lipstick"]
  },

  // ============================================================================
  // 3. HAIR CARE CATEGORY
  // ============================================================================

  // Shampoo & Conditioner Subcategory
  {
    name: "Moisturizing Shampoo",
    description: "Gentle, sulfate-free shampoo that cleanses while maintaining hair's natural moisture balance.",
    price: 28.00,
    cost: 14.00,
    category: "Hair Care",
    type: "Shampoo & Conditioner - Shampoo",
    brand: "HairLux",
    sku: "HL-MS-026",
    isRetail: true,
    isActive: true,
    isNew: true,
    features: ["Sulfate-free", "Moisturizing", "Color-safe"],
    ingredients: ["Coconut surfactants", "Argan oil", "Keratin"],
    howToUse: ["Wet hair thoroughly", "Massage into scalp", "Rinse completely"]
  },
  {
    name: "Repair Conditioner",
    description: "Deep conditioning treatment that repairs damaged hair and restores shine and softness.",
    price: 32.00,
    cost: 16.00,
    category: "Hair Care",
    type: "Shampoo & Conditioner - Conditioner",
    brand: "RepairPro",
    sku: "RP-RC-027",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Repairing", "Shine-enhancing", "Softening"],
    ingredients: ["Hydrolyzed proteins", "Ceramides", "Panthenol"],
    howToUse: ["Apply to damp hair", "Focus on mid-lengths to ends", "Leave for 2-3 minutes"]
  },

  // Treatments Subcategory
  {
    name: "Intensive Hair Mask",
    description: "Weekly deep treatment mask that nourishes and strengthens damaged or chemically-treated hair.",
    price: 35.00,
    cost: 17.50,
    category: "Hair Care",
    type: "Treatments - Hair Masks",
    brand: "DeepCare",
    sku: "DC-IHM-028",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Deep nourishment", "Strengthening", "Weekly treatment"],
    ingredients: ["Shea butter", "Quinoa protein", "Vitamin E"],
    howToUse: ["Apply to clean, damp hair", "Leave for 10-15 minutes", "Rinse thoroughly"]
  },
  {
    name: "Heat Protection Spray",
    description: "Lightweight spray that protects hair from heat damage while adding shine and reducing frizz.",
    price: 24.00,
    cost: 12.00,
    category: "Hair Care",
    type: "Treatments - Heat Protectant",
    brand: "HeatShield",
    sku: "HS-HPS-029",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Heat protection", "Frizz control", "Shine-enhancing"],
    ingredients: ["Silicones", "Panthenol", "UV filters"],
    howToUse: ["Spray on damp hair", "Comb through evenly", "Style as usual"]
  },

  // ============================================================================
  // 4. NAIL CARE CATEGORY
  // ============================================================================

  // Nail Polish & Color Subcategory
  {
    name: "Classic Red Nail Polish",
    description: "Timeless red nail polish with high-gloss finish and long-lasting wear.",
    price: 15.00,
    cost: 7.50,
    category: "Nail Care",
    type: "Nail Polish & Color - Traditional Nail Polish",
    brand: "NailPerfect",
    sku: "NP-CRN-030",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["High-gloss finish", "Long-lasting", "Classic color"],
    ingredients: ["Nitrocellulose", "Plasticizers", "Pigments"],
    howToUse: ["Apply base coat", "Apply 2 thin coats", "Finish with top coat"]
  },
  {
    name: "Gel Polish Starter Kit",
    description: "Complete gel polish kit with base coat, color, and top coat for salon-quality manicures at home.",
    price: 45.00,
    cost: 22.50,
    category: "Nail Care",
    type: "Nail Polish & Color - Gel Nail Polish",
    brand: "GelPro",
    sku: "GP-GSK-031",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Complete kit", "Salon-quality", "Long-lasting"],
    ingredients: ["UV-curable polymers", "Photoinitiators", "Pigments"],
    howToUse: ["Prep nails", "Apply thin coats", "Cure under UV/LED lamp"]
  },

  // Nail Treatments Subcategory
  {
    name: "Cuticle Oil Treatment",
    description: "Nourishing cuticle oil that softens and conditions cuticles for healthy nail growth.",
    price: 12.00,
    cost: 6.00,
    category: "Nail Care",
    type: "Nail Treatments - Cuticle Oil",
    brand: "CuticleCore",
    sku: "CC-COT-032",
    isRetail: true,
    isActive: true,
    features: ["Nourishing", "Softening", "Healthy growth"],
    ingredients: ["Jojoba oil", "Vitamin E", "Sweet almond oil"],
    howToUse: ["Apply to cuticles", "Massage gently", "Use daily"]
  },
  {
    name: "Nail Strengthener",
    description: "Fortifying treatment that strengthens weak, brittle nails and prevents breakage.",
    price: 18.00,
    cost: 9.00,
    category: "Nail Care",
    type: "Nail Treatments - Nail Strengthener",
    brand: "StrongNails",
    sku: "SN-NS-033",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Strengthening", "Prevents breakage", "Fortifying"],
    ingredients: ["Calcium", "Protein", "Keratin"],
    howToUse: ["Apply to clean nails", "Use as base coat", "Apply 2-3 times weekly"]
  },

  // ============================================================================
  // 5. FRAGRANCE CATEGORY
  // ============================================================================

  // Women's Fragrance Subcategory
  {
    name: "Floral Bouquet Eau de Parfum",
    description: "Elegant floral fragrance with notes of rose, jasmine, and white musk for a feminine and romantic scent.",
    price: 65.00,
    cost: 32.50,
    category: "Fragrance",
    type: "Women's Fragrance - Eau de Parfum",
    brand: "FloralLux",
    sku: "FL-FBE-034",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Floral scent", "Long-lasting", "Elegant"],
    ingredients: ["Rose extract", "Jasmine", "White musk"],
    howToUse: ["Spray on pulse points", "Apply to wrists and neck", "Reapply as desired"]
  },
  {
    name: "Fresh Citrus Body Mist",
    description: "Light, refreshing body mist with energizing citrus notes perfect for daily wear.",
    price: 22.00,
    cost: 11.00,
    category: "Fragrance",
    type: "Women's Fragrance - Body Mist",
    brand: "CitrusFresh",
    sku: "CF-FCB-035",
    isRetail: true,
    isActive: true,
    isNew: true,
    features: ["Light fragrance", "Refreshing", "Daily wear"],
    ingredients: ["Citrus oils", "Bergamot", "Lemon verbena"],
    howToUse: ["Spray all over body", "Reapply throughout day", "Layer with other products"]
  },

  // ============================================================================
  // 6. TOOLS & BRUSHES CATEGORY
  // ============================================================================

  // Makeup Brushes & Sponges Subcategory
  {
    name: "Professional Makeup Brush Set",
    description: "Complete 12-piece makeup brush set with synthetic bristles for flawless application.",
    price: 55.00,
    cost: 27.50,
    category: "Tools & Brushes",
    type: "Makeup Brushes & Sponges - Makeup Brush Sets",
    brand: "BrushPro",
    sku: "BP-PMB-036",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    features: ["12-piece set", "Synthetic bristles", "Professional quality"],
    ingredients: ["Synthetic fibers", "Aluminum ferrule", "Wood handle"],
    howToUse: ["Use appropriate brush for each product", "Clean regularly", "Store properly"]
  },
  {
    name: "Beauty Blending Sponge",
    description: "Latex-free makeup sponge that blends foundation and concealer for a flawless finish.",
    price: 8.00,
    cost: 4.00,
    category: "Tools & Brushes",
    type: "Makeup Brushes & Sponges - Blending Sponges",
    brand: "BlendPerfect",
    sku: "BP-BBS-037",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Latex-free", "Flawless blending", "Reusable"],
    ingredients: ["Non-latex foam", "Hydrophilic material"],
    howToUse: ["Dampen before use", "Bounce to blend", "Clean after each use"]
  },

  // Hair Tools Subcategory
  {
    name: "Ceramic Hair Straightener",
    description: "Professional ceramic flat iron with adjustable temperature settings for all hair types.",
    price: 85.00,
    cost: 42.50,
    category: "Tools & Brushes",
    type: "Hair Tools - Straighteners",
    brand: "StraightPro",
    sku: "SP-CHS-038",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Ceramic plates", "Adjustable temperature", "Professional quality"],
    ingredients: ["Ceramic coating", "Tourmaline", "Ionic technology"],
    howToUse: ["Use on dry hair", "Apply heat protectant", "Work in small sections"]
  },
  {
    name: "Detangling Hair Brush",
    description: "Gentle detangling brush with flexible bristles that glide through wet or dry hair without pulling.",
    price: 18.00,
    cost: 9.00,
    category: "Tools & Brushes",
    type: "Hair Tools - Hair Brushes",
    brand: "GentleBrush",
    sku: "GB-DHB-039",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Gentle detangling", "Flexible bristles", "Wet/dry use"],
    ingredients: ["Flexible nylon bristles", "Ergonomic handle"],
    howToUse: ["Start from ends", "Work upward", "Use on wet or dry hair"]
  },

  // ============================================================================
  // 7. BATH & BODY CATEGORY
  // ============================================================================

  // Body Cleansers Subcategory
  {
    name: "Moisturizing Body Wash",
    description: "Gentle, moisturizing body wash that cleanses without stripping skin's natural oils.",
    price: 16.00,
    cost: 8.00,
    category: "Bath & Body",
    type: "Body Cleansers - Body Wash",
    brand: "SoftSkin",
    sku: "SS-MBW-040",
    isRetail: true,
    isActive: true,
    features: ["Moisturizing", "Gentle formula", "Non-stripping"],
    ingredients: ["Coconut surfactants", "Glycerin", "Shea butter"],
    howToUse: ["Apply to wet skin", "Lather gently", "Rinse thoroughly"]
  },
  {
    name: "Exfoliating Body Scrub",
    description: "Invigorating body scrub with natural exfoliants that smooth and soften skin.",
    price: 24.00,
    cost: 12.00,
    category: "Bath & Body",
    type: "Body Cleansers - Body Scrub",
    brand: "SmoothBody",
    sku: "SB-EBS-041",
    isRetail: true,
    isActive: true,
    isBestSeller: true,
    features: ["Natural exfoliants", "Smoothing", "Softening"],
    ingredients: ["Sugar crystals", "Coconut oil", "Vitamin E"],
    howToUse: ["Apply to damp skin", "Massage in circular motions", "Rinse with warm water"]
  },

  // Body Moisturizers Subcategory
  {
    name: "Hydrating Body Lotion",
    description: "Fast-absorbing body lotion that provides 24-hour hydration for soft, smooth skin.",
    price: 20.00,
    cost: 10.00,
    category: "Bath & Body",
    type: "Body Moisturizers - Body Lotion",
    brand: "HydraBody",
    sku: "HB-HBL-042",
    isRetail: true,
    isActive: true,
    features: ["24-hour hydration", "Fast-absorbing", "Non-greasy"],
    ingredients: ["Hyaluronic acid", "Ceramides", "Glycerin"],
    howToUse: ["Apply to clean skin", "Massage until absorbed", "Use daily"]
  },

  // ============================================================================
  // 8. GIFT SETS & KITS CATEGORY
  // ============================================================================

  {
    name: "Skincare Starter Kit",
    description: "Complete skincare routine kit with cleanser, toner, serum, and moisturizer for beginners.",
    price: 85.00,
    cost: 42.50,
    category: "Gift Sets & Kits",
    type: "Skincare Starter Kits",
    brand: "SkinStart",
    sku: "SS-SSK-043",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    isNew: true,
    features: ["Complete routine", "Beginner-friendly", "Travel sizes"],
    ingredients: ["Various skincare actives", "Gentle formulations"],
    howToUse: ["Follow included routine guide", "Start with patch test", "Use consistently"]
  },
  {
    name: "Makeup Essentials Kit",
    description: "Must-have makeup kit with foundation, mascara, lipstick, and brushes for everyday looks.",
    price: 75.00,
    cost: 37.50,
    category: "Gift Sets & Kits",
    type: "Makeup Sets",
    brand: "MakeupEssentials",
    sku: "ME-MEK-044",
    isRetail: true,
    isActive: true,
    isFeatured: true,
    features: ["Essential products", "Everyday looks", "Complete kit"],
    ingredients: ["Various makeup formulations", "High-quality pigments"],
    howToUse: ["Follow included guide", "Build looks gradually", "Blend well"]
  }
]

export async function seedComprehensiveBeautyProducts() {
  console.log('🌱 Starting comprehensive beauty product seeding...')
  
  try {
    // Clear existing products (optional - comment out to preserve existing data)
    // await prisma.product.deleteMany({})
    // console.log('🗑️ Cleared existing products')

    let createdCount = 0
    let skippedCount = 0

    for (const productData of comprehensiveProductData) {
      try {
        // Check if product already exists by SKU
        const existingProduct = await prisma.product.findUnique({
          where: { sku: productData.sku }
        })

        if (existingProduct) {
          console.log(`⏭️ Skipping existing product: ${productData.name}`)
          skippedCount++
          continue
        }

        // Create the product
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            cost: productData.cost || productData.price * 0.5,
            category: productData.category,
            type: productData.type,
            brand: productData.brand,
            sku: productData.sku,
            image: productData.image || getPlaceholderImage(productData.category, productData.type),
            images: JSON.stringify([productData.image || getPlaceholderImage(productData.category, productData.type)]),
            isRetail: productData.isRetail,
            isActive: productData.isActive,
            isFeatured: productData.isFeatured || false,
            isNew: productData.isNew || false,
            isBestSeller: productData.isBestSeller || false,
            features: JSON.stringify(productData.features || []),
            ingredients: JSON.stringify(productData.ingredients || []),
            howToUse: JSON.stringify(productData.howToUse || [])
          }
        })

        console.log(`✅ Created product: ${product.name} (${product.category} - ${product.type})`)
        createdCount++
      } catch (error) {
        console.error(`❌ Error creating product ${productData.name}:`, error)
      }
    }

    console.log(`🎉 Product seeding completed!`)
    console.log(`📊 Created: ${createdCount} products`)
    console.log(`⏭️ Skipped: ${skippedCount} existing products`)

    return {
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: comprehensiveProductData.length
    }
  } catch (error) {
    console.error('❌ Error during product seeding:', error)
    throw error
  }
}

// Helper function to get placeholder images based on category and type
function getPlaceholderImage(category: string, type: string): string {
  const categoryLower = category.toLowerCase()
  const typeLower = type.toLowerCase()

  if (categoryLower.includes('skin')) {
    if (typeLower.includes('cleanser')) {
      return '/images/products/skincare-cleanser-placeholder.jpg'
    } else if (typeLower.includes('serum')) {
      return '/images/products/skincare-serum-placeholder.jpg'
    } else if (typeLower.includes('moisturizer')) {
      return '/images/products/skincare-moisturizer-placeholder.jpg'
    } else if (typeLower.includes('toner')) {
      return '/images/products/skincare-toner-placeholder.jpg'
    }
    return '/images/products/skincare-placeholder.jpg'
  } else if (categoryLower.includes('makeup')) {
    return '/images/products/makeup-placeholder.jpg'
  } else if (categoryLower.includes('hair')) {
    return '/images/products/haircare-placeholder.jpg'
  } else if (categoryLower.includes('nail')) {
    return '/images/products/nailcare-placeholder.jpg'
  } else if (categoryLower.includes('fragrance')) {
    return '/images/products/fragrance-placeholder.jpg'
  }
  
  return '/images/products/beauty-placeholder.jpg'
}
