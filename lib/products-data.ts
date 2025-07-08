// Product Category interface
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Type interface
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: string; // Category name for display purposes
  productCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Transfer interface
export interface ProductTransfer {
  id: string;
  productId: string;
  productName: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

// Shared product data model for both client portal and POS system
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  cost?: number;
  category: string;
  type: string;
  image: string;
  images?: string[];
  stock: number;
  minStock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isSale?: boolean;
  features?: string[];
  ingredients?: string[];
  howToUse?: string[];
  relatedProducts?: string[];
  reviews?: ProductReview[];
  rating?: number;
  reviewCount?: number;
  sku: string;
  barcode?: string;
  location?: string;
  isRetail: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductReview {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

// DEPRECATED: Product data is now managed through the database
// Use the /api/products endpoints to fetch product data
// This file maintains type definitions for compatibility

// All product data comes from database - no mock data
export const beautyProducts: Product[] = []
export const defaultProductCategories: ProductCategory[] = []

// DEPRECATED: Product types are now managed through the database
// This array is kept for reference only

// Comprehensive product types based on enhanced product catalog
export const defaultProductTypes: ProductType[] = [
  // Skincare Product Types
  {
    id: "type-sk-1",
    name: "Facial Cleanser",
    description: "Cleansing products for face and makeup removal",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-2",
    name: "Moisturizer",
    description: "Hydrating and nourishing facial moisturizers",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-3",
    name: "Serum",
    description: "Concentrated treatment serums for specific skin concerns",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-4",
    name: "Toner",
    description: "Balancing and refreshing facial toners",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-5",
    name: "Eye Cream",
    description: "Specialized treatments for delicate eye area",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-6",
    name: "Face Mask",
    description: "Intensive treatment masks for various skin needs",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-7",
    name: "Exfoliator",
    description: "Gentle exfoliating products for skin renewal",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-8",
    name: "Sunscreen",
    description: "UV protection and sun care products",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-9",
    name: "Anti-Aging",
    description: "Age-defying treatments and serums",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sk-10",
    name: "Acne Treatment",
    description: "Specialized products for acne-prone skin",
    categoryId: "cat-1",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Makeup Product Types
  {
    id: "type-mk-1",
    name: "Foundation",
    description: "Base makeup for even skin tone",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-2",
    name: "Concealer",
    description: "Coverage for blemishes and imperfections",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-3",
    name: "Powder",
    description: "Setting and finishing powders",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-4",
    name: "Blush",
    description: "Cheek color and contouring products",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-5",
    name: "Eyeshadow",
    description: "Eye color and eyeshadow palettes",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-6",
    name: "Eyeliner",
    description: "Eye defining and lining products",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-7",
    name: "Mascara",
    description: "Lash enhancing and volumizing products",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-8",
    name: "Lipstick",
    description: "Lip color and treatment products",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-9",
    name: "Lip Gloss",
    description: "Glossy lip treatments and colors",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-mk-10",
    name: "Brow Products",
    description: "Eyebrow shaping and coloring products",
    categoryId: "cat-2",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Hair Care Product Types
  {
    id: "type-hc-1",
    name: "Shampoo",
    description: "Hair cleansing and washing products",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-2",
    name: "Conditioner",
    description: "Hair conditioning and moisturizing products",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-3",
    name: "Hair Mask",
    description: "Deep conditioning hair treatments",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-4",
    name: "Hair Oil",
    description: "Nourishing hair oils and serums",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-5",
    name: "Styling Gel",
    description: "Hair styling and hold products",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-6",
    name: "Hair Spray",
    description: "Finishing and hold sprays",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-7",
    name: "Hair Dye",
    description: "Permanent and semi-permanent hair coloring",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-8",
    name: "Hair Toner",
    description: "Hair color toning and correction",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-9",
    name: "Leave-in Treatment",
    description: "Leave-in hair treatments and protectants",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-hc-10",
    name: "Heat Protectant",
    description: "Thermal protection for styling tools",
    categoryId: "cat-3",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Hair Extensions Product Types
  {
    id: "type-he-1",
    name: "Clip-In Extensions",
    description: "Temporary clip-in hair extensions",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-he-2",
    name: "Tape-In Extensions",
    description: "Semi-permanent tape-in hair extensions",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-he-3",
    name: "Sew-In Extensions",
    description: "Permanent sew-in hair extensions",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-he-4",
    name: "Fusion Extensions",
    description: "Keratin fusion hair extensions",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-he-5",
    name: "Micro-Link Extensions",
    description: "Micro-link and micro-bead extensions",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-he-6",
    name: "Ponytail Extensions",
    description: "Clip-in ponytail and updo pieces",
    categoryId: "cat-4",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Nail Care Product Types
  {
    id: "type-nc-1",
    name: "Nail Polish",
    description: "Regular and gel nail polish",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-nc-2",
    name: "Nail Treatment",
    description: "Nail strengthening and care treatments",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-nc-3",
    name: "Base Coat",
    description: "Nail polish base coats and primers",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-nc-4",
    name: "Top Coat",
    description: "Nail polish top coats and sealers",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-nc-5",
    name: "Cuticle Care",
    description: "Cuticle oils and treatments",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-nc-6",
    name: "Nail Tools",
    description: "Manicure and pedicure tools",
    categoryId: "cat-5",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Fragrance Product Types
  {
    id: "type-fr-1",
    name: "Eau de Parfum",
    description: "Long-lasting concentrated fragrances",
    categoryId: "cat-6",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-fr-2",
    name: "Eau de Toilette",
    description: "Light and fresh fragrances",
    categoryId: "cat-6",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-fr-3",
    name: "Body Spray",
    description: "Light body mists and sprays",
    categoryId: "cat-6",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-fr-4",
    name: "Solid Perfume",
    description: "Portable solid fragrance balms",
    categoryId: "cat-6",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Personal Care Product Types
  {
    id: "type-pc-1",
    name: "Body Wash",
    description: "Cleansing body washes and gels",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-2",
    name: "Body Lotion",
    description: "Moisturizing body lotions and creams",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-3",
    name: "Body Scrub",
    description: "Exfoliating body scrubs and treatments",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-4",
    name: "Body Oil",
    description: "Nourishing body oils and treatments",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-5",
    name: "Hand Cream",
    description: "Moisturizing hand and nail treatments",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-6",
    name: "Foot Care",
    description: "Foot creams, scrubs, and treatments",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Specialty Products Product Types
  {
    id: "type-sp-1",
    name: "Beauty Tools",
    description: "Professional beauty tools and devices",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-2",
    name: "Accessories",
    description: "Beauty accessories and applicators",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-3",
    name: "Gift Sets",
    description: "Curated beauty gift sets and bundles",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-4",
    name: "Professional Equipment",
    description: "Salon-grade equipment and devices",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-7",
    name: "Deodorant",
    description: "Antiperspirants and deodorants",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-pc-8",
    name: "Hand Cream",
    description: "Hand and foot care products",
    categoryId: "cat-7",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Specialty Products Types
  {
    id: "type-sp-6",
    name: "Beauty Device",
    description: "Electronic beauty and skincare devices",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-7",
    name: "Beauty Tools",
    description: "Manual beauty tools and accessories",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-8",
    name: "Professional Equipment",
    description: "Salon-grade professional equipment",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "type-sp-5",
    name: "Accessories",
    description: "Beauty accessories and storage",
    categoryId: "cat-8",
    productCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
