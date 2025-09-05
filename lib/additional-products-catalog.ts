// Additional Products for Complete Beauty Salon Catalog
// This file contains the remaining product categories to complete the comprehensive catalog

import { EnhancedProduct } from "./enhanced-products-data"

// ===== ADDITIONAL SKINCARE PRODUCTS =====
export const additionalSkincareProducts: EnhancedProduct[] = [
  {
    id: "sk005",
    name: "Hydrating Day Moisturizer SPF 30",
    description: "Lightweight daily moisturizer with broad-spectrum SPF 30 protection. Hydrates skin while protecting against UV damage.",
    price: 115.00,
    cost: 57.50,
    category: "Skincare",
    type: "Moisturizer",
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 35,
    minStock: 8,
    isNew: false,
    isBestSeller: true,
    isSale: false,
    features: [
      "SPF 30 broad-spectrum protection",
      "Lightweight, non-greasy formula",
      "24-hour hydration",
      "Suitable for daily use",
      "Anti-aging benefits"
    ],
    ingredients: [
      "Zinc Oxide",
      "Titanium Dioxide",
      "Hyaluronic Acid",
      "Niacinamide",
      "Vitamin E"
    ],
    howToUse: [
      "Apply as last step in morning routine",
      "Use generous amount for face and neck",
      "Reapply every 2 hours when in sun",
      "Can be used under makeup"
    ],
    specifications: {
      "Size": "50ml",
      "SPF": "30",
      "Skin Type": "All skin types",
      "Texture": "Lightweight cream"
    },
    relatedProducts: ["sk001", "sk003", "sk006"],
    rating: 4.6,
    reviewCount: 198,
    sku: "SK-DM-001",
    barcode: "8901234560005",
    isRetail: true,
    isFeatured: true,
    brand: "Vanity Pro",
    size: "50ml"
  },

  {
    id: "sk006",
    name: "Hydrating Sheet Mask Set",
    description: "Intensive hydrating sheet masks infused with hyaluronic acid and botanical extracts. Pack of 5 masks for weekly treatments.",
    price: 95.00,
    cost: 47.50,
    category: "Skincare",
    type: "Face Mask",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 40,
    minStock: 10,
    isNew: true,
    isBestSeller: false,
    isSale: false,
    features: [
      "Pack of 5 sheet masks",
      "Hyaluronic acid infused",
      "Botanical extracts",
      "Instant hydration boost",
      "Suitable for all skin types"
    ],
    ingredients: [
      "Hyaluronic Acid",
      "Aloe Vera Extract",
      "Green Tea Extract",
      "Chamomile Extract",
      "Glycerin"
    ],
    howToUse: [
      "Cleanse face thoroughly",
      "Apply mask and smooth out air bubbles",
      "Leave on for 15-20 minutes",
      "Remove and gently pat remaining essence"
    ],
    specifications: {
      "Quantity": "5 masks",
      "Material": "Bio-cellulose",
      "Treatment Time": "15-20 minutes",
      "Skin Type": "All skin types"
    },
    relatedProducts: ["sk001", "sk004", "sk005"],
    rating: 4.7,
    reviewCount: 156,
    sku: "SK-SM-001",
    barcode: "8901234560006",
    isRetail: true,
    isNew: true,
    brand: "Vanity Pro",
    size: "5 masks"
  }
]

// ===== ADDITIONAL MAKEUP PRODUCTS =====
export const additionalMakeupProducts: EnhancedProduct[] = [
  {
    id: "mk004",
    name: "Eyeshadow Palette - Neutral Tones",
    description: "Professional 12-shade eyeshadow palette featuring versatile neutral tones. Mix of matte and shimmer finishes for day and night looks.",
    price: 135.00,
    cost: 67.50,
    category: "Makeup",
    type: "Eyeshadow",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 25,
    minStock: 5,
    isNew: false,
    isBestSeller: true,
    isSale: false,
    features: [
      "12 versatile neutral shades",
      "Mix of matte and shimmer finishes",
      "Highly pigmented formula",
      "Blendable and buildable",
      "Professional quality"
    ],
    howToUse: [
      "Use eyeshadow brush for application",
      "Build color gradually",
      "Blend edges for seamless finish",
      "Use primer for longer wear"
    ],
    specifications: {
      "Shades": "12 colors",
      "Finishes": "Matte & Shimmer",
      "Weight": "15g",
      "Palette Size": "Compact"
    },
    relatedProducts: ["mk001", "mk002", "mk005"],
    rating: 4.8,
    reviewCount: 234,
    sku: "MK-EP-001",
    barcode: "8901234570004",
    isRetail: true,
    isFeatured: true,
    brand: "Vanity Glam",
    size: "15g"
  },

  {
    id: "mk005",
    name: "Professional Makeup Brush Set",
    description: "Complete 10-piece makeup brush set with synthetic bristles. Includes brushes for face, eyes, and lips with premium handles.",
    price: 185.00,
    cost: 92.50,
    category: "Makeup",
    type: "Makeup Tools",
    image: "https://images.unsplash.com/photo-1583241800698-6ca2dcb5e0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1583241800698-6ca2dcb5e0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 15,
    minStock: 3,
    isNew: true,
    isBestSeller: false,
    isSale: false,
    features: [
      "10-piece complete set",
      "Synthetic bristles",
      "Premium wooden handles",
      "Includes storage pouch",
      "Professional quality"
    ],
    howToUse: [
      "Use appropriate brush for each product",
      "Clean brushes regularly",
      "Store in provided pouch",
      "Replace when bristles shed excessively"
    ],
    specifications: {
      "Pieces": "10 brushes",
      "Bristles": "Synthetic",
      "Handle": "Premium wood",
      "Storage": "Included pouch"
    },
    relatedProducts: ["mk001", "mk003", "mk004"],
    rating: 4.9,
    reviewCount: 167,
    sku: "MK-BS-001",
    barcode: "8901234570005",
    isRetail: true,
    isNew: true,
    brand: "Vanity Glam",
    size: "10 pieces"
  }
]

// ===== ADDITIONAL HAIR CARE PRODUCTS =====
export const additionalHairCareProducts: EnhancedProduct[] = [
  {
    id: "hc002",
    name: "Color-Protecting Conditioner",
    description: "Specially formulated conditioner for color-treated hair. Helps maintain color vibrancy while providing deep moisture and protection.",
    price: 105.00,
    cost: 52.50,
    category: "Hair Care",
    type: "Conditioner",
    image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 35,
    minStock: 8,
    isNew: false,
    isBestSeller: true,
    isSale: false,
    features: [
      "Color protection formula",
      "Deep moisturizing",
      "UV protection",
      "Sulfate-free",
      "Safe for daily use"
    ],
    ingredients: [
      "Aqua/Water",
      "Cetearyl Alcohol",
      "Behentrimonium Chloride",
      "UV Filters",
      "Color-Lock Complex"
    ],
    howToUse: [
      "Apply to clean, wet hair",
      "Focus on mid-lengths to ends",
      "Leave for 2-3 minutes",
      "Rinse thoroughly"
    ],
    specifications: {
      "Size": "300ml",
      "Hair Type": "Color-treated hair",
      "Protection": "UV & Color",
      "Sulfate": "Sulfate-free"
    },
    relatedProducts: ["hc001", "hc003", "hc004"],
    rating: 4.7,
    reviewCount: 189,
    sku: "HC-CC-001",
    barcode: "8901234590002",
    isRetail: true,
    isFeatured: true,
    brand: "Vanity Hair",
    size: "300ml"
  }
]

// ===== PERSONAL CARE PRODUCTS =====
export const personalCareProducts: EnhancedProduct[] = [
  {
    id: "pc001",
    name: "Luxury Body Wash - Vanilla & Honey",
    description: "Moisturizing body wash with natural vanilla and honey extracts. Gently cleanses while leaving skin soft and fragrant.",
    price: 65.00,
    cost: 32.50,
    category: "Personal Care",
    type: "Body Wash",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 45,
    minStock: 12,
    isNew: false,
    isBestSeller: true,
    isSale: false,
    features: [
      "Natural vanilla and honey extracts",
      "Moisturizing formula",
      "Gentle on all skin types",
      "Long-lasting fragrance",
      "Sulfate-free"
    ],
    ingredients: [
      "Aqua/Water",
      "Sodium Cocoyl Isethionate",
      "Vanilla Extract",
      "Honey Extract",
      "Glycerin"
    ],
    howToUse: [
      "Apply to wet skin",
      "Lather gently",
      "Rinse thoroughly",
      "Use daily for best results"
    ],
    specifications: {
      "Size": "400ml",
      "Fragrance": "Vanilla & Honey",
      "Skin Type": "All skin types",
      "Sulfate": "Sulfate-free"
    },
    relatedProducts: ["pc002", "pc003"],
    rating: 4.6,
    reviewCount: 145,
    sku: "PC-BW-001",
    barcode: "8901234620001",
    isRetail: true,
    isFeatured: true,
    brand: "Vanity Care",
    size: "400ml"
  }
]

// ===== SPECIALTY PRODUCTS =====
export const specialtyProducts: EnhancedProduct[] = [
  {
    id: "sp001",
    name: "Facial Cleansing Device",
    description: "Sonic facial cleansing device with multiple brush heads. Removes makeup and impurities 6x better than manual cleansing.",
    price: 385.00,
    cost: 192.50,
    category: "Specialty Products",
    type: "Beauty Device",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583241800698-6ca2dcb5e0c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    stock: 10,
    minStock: 2,
    isNew: true,
    isBestSeller: false,
    isSale: false,
    features: [
      "Sonic cleansing technology",
      "Multiple brush heads included",
      "Waterproof design",
      "Rechargeable battery",
      "6x more effective than manual cleansing"
    ],
    howToUse: [
      "Wet face and device",
      "Apply cleanser to brush head",
      "Gently move device in circular motions",
      "Rinse face and device after use"
    ],
    specifications: {
      "Technology": "Sonic vibration",
      "Battery": "Rechargeable",
      "Waterproof": "Yes",
      "Brush Heads": "3 included"
    },
    relatedProducts: ["sk001", "sk002", "sp002"],
    rating: 4.8,
    reviewCount: 89,
    sku: "SP-FCD-001",
    barcode: "8901234630001",
    isRetail: true,
    isNew: true,
    brand: "Vanity Tech",
    size: "1 device"
  }
]
