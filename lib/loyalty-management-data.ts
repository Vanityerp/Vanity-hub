import { 
  RewardCategory, 
  LoyaltyTier, 
  PointEarningRule, 
  ReferralProgram, 
  Promotion,
  LoyaltyReward 
} from "@/lib/types/loyalty";

// Reward Categories
export const rewardCategories: RewardCategory[] = [
  {
    id: "cat1",
    name: "Services",
    description: "Discounts and free services",
    isActive: true,
    rewardCount: 5,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat2", 
    name: "Products",
    description: "Free products and product discounts",
    isActive: true,
    rewardCount: 3,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat3",
    name: "Experiences",
    description: "Special experiences and VIP treatments",
    isActive: true,
    rewardCount: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  },
  {
    id: "cat4",
    name: "Discounts",
    description: "Percentage and fixed amount discounts",
    isActive: true,
    rewardCount: 4,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
];

// Loyalty Tiers
export const loyaltyTiers: LoyaltyTier[] = [
  {
    id: "tier1",
    name: "Bronze",
    description: "Welcome to our loyalty program",
    minPoints: 0,
    maxPoints: 499,
    benefits: [
      "Earn 1 point per $1 spent on services",
      "Earn 0.5 points per $1 spent on products",
      "Birthday bonus: 100 points"
    ],
    pointsMultiplier: 1.0,
    isActive: true,
    color: "bg-amber-100 text-amber-800",
    icon: "Medal"
  },
  {
    id: "tier2",
    name: "Silver",
    description: "Enhanced benefits for loyal customers",
    minPoints: 500,
    maxPoints: 999,
    benefits: [
      "Earn 1.2 points per $1 spent on services",
      "Earn 0.6 points per $1 spent on products",
      "5% discount on all services",
      "Birthday bonus: 150 points",
      "Priority booking"
    ],
    pointsMultiplier: 1.2,
    isActive: true,
    color: "bg-gray-100 text-gray-800",
    icon: "Award"
  },
  {
    id: "tier3",
    name: "Gold",
    description: "Premium benefits for our valued customers",
    minPoints: 1000,
    maxPoints: 2499,
    benefits: [
      "Earn 1.5 points per $1 spent on services",
      "Earn 0.75 points per $1 spent on products",
      "10% discount on all services",
      "5% discount on products",
      "Birthday bonus: 250 points",
      "Priority booking",
      "Complimentary refreshments"
    ],
    pointsMultiplier: 1.5,
    isActive: true,
    color: "bg-yellow-100 text-yellow-800",
    icon: "Crown"
  },
  {
    id: "tier4",
    name: "Platinum",
    description: "Exclusive benefits for our most loyal customers",
    minPoints: 2500,
    maxPoints: 4999,
    benefits: [
      "Earn 2 points per $1 spent on services",
      "Earn 1 point per $1 spent on products",
      "15% discount on all services",
      "10% discount on products",
      "Birthday bonus: 500 points",
      "Priority booking",
      "Complimentary refreshments",
      "Free parking",
      "Quarterly exclusive events"
    ],
    pointsMultiplier: 2.0,
    isActive: true,
    color: "bg-purple-100 text-purple-800",
    icon: "Gem"
  },
  {
    id: "tier5",
    name: "Diamond",
    description: "Ultimate VIP experience",
    minPoints: 5000,
    benefits: [
      "Earn 2.5 points per $1 spent on services",
      "Earn 1.25 points per $1 spent on products",
      "20% discount on all services",
      "15% discount on products",
      "Birthday bonus: 1000 points",
      "Priority booking",
      "Complimentary refreshments",
      "Free parking",
      "Monthly exclusive events",
      "Personal stylist consultation",
      "Home service priority"
    ],
    pointsMultiplier: 2.5,
    isActive: true,
    color: "bg-blue-100 text-blue-800",
    icon: "Diamond"
  }
];

// Point Earning Rules
export const pointEarningRules: PointEarningRule[] = [
  {
    id: "rule1",
    name: "Service Purchase",
    description: "Earn points for service purchases",
    type: "service",
    pointsPerDollar: 1,
    isActive: true,
    conditions: {
      minAmount: 10
    }
  },
  {
    id: "rule2",
    name: "Product Purchase", 
    description: "Earn points for product purchases",
    type: "product",
    pointsPerDollar: 0.5,
    isActive: true,
    conditions: {
      minAmount: 5
    }
  },
  {
    id: "rule3",
    name: "Referral Bonus",
    description: "Bonus points for successful referrals",
    type: "referral",
    fixedPoints: 200,
    isActive: true
  },
  {
    id: "rule4",
    name: "Birthday Bonus",
    description: "Annual birthday bonus points",
    type: "birthday",
    fixedPoints: 250,
    isActive: true
  },
  {
    id: "rule5",
    name: "Welcome Bonus",
    description: "One-time signup bonus",
    type: "signup",
    fixedPoints: 100,
    isActive: true
  },
  {
    id: "rule6",
    name: "Review Bonus",
    description: "Points for leaving reviews",
    type: "review",
    fixedPoints: 50,
    isActive: true
  }
];

// Referral Programs
export const referralPrograms: ReferralProgram[] = [
  {
    id: "ref1",
    name: "Standard Referral",
    description: "Refer a friend and both get rewarded",
    referrerReward: 200,
    refereeReward: 100,
    isActive: true,
    conditions: {
      minPurchaseAmount: 50,
      validityDays: 90
    }
  }
];

// Active Promotions
export const activePromotions: Promotion[] = [
  {
    id: "promo1",
    name: "Spring Double Points",
    description: "Earn double points on all services during spring",
    type: "double_points",
    value: 2,
    startDate: "2025-03-01T00:00:00Z",
    endDate: "2025-05-31T23:59:59Z",
    isActive: true,
    conditions: {
      serviceTypes: ["haircut", "color", "styling"]
    }
  },
  {
    id: "promo2",
    name: "New Customer Bonus",
    description: "Extra 100 points for first-time customers",
    type: "bonus_points",
    value: 100,
    startDate: "2025-01-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    isActive: true,
    conditions: {}
  }
];

// Enhanced Reward Templates
export const rewardTemplates: LoyaltyReward[] = [
  {
    id: "r1",
    name: "$25 off your next service",
    description: "Get $25 discount on any service over $50. Perfect for trying new treatments or your regular favorites.",
    pointsCost: 500,
    value: 25,
    category: "cat1",
    type: "discount",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 1000,
    usageCount: 45,
    minTier: "Bronze",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r2",
    name: "Free product (up to $15 value)",
    description: "Choose any beauty product worth up to $15 for free. Perfect for trying new skincare or makeup items.",
    pointsCost: 300,
    value: 15,
    category: "cat2",
    type: "product",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 500,
    usageCount: 23,
    minTier: "Bronze",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r3",
    name: "Complimentary Express Facial",
    description: "Enjoy a refreshing 30-minute express facial treatment on us. Perfect for a quick glow-up!",
    pointsCost: 750,
    value: 45,
    category: "cat1",
    type: "service",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 200,
    usageCount: 12,
    minTier: "Silver",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r4",
    name: "VIP Priority Booking",
    description: "Skip the wait! Get priority booking access for 3 months and book appointments before general availability.",
    pointsCost: 1000,
    category: "cat3",
    type: "experience",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 100,
    usageCount: 8,
    minTier: "Gold",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r5",
    name: "Birthday Month Special",
    description: "Celebrate your special month with 50% off any service. Valid throughout your birthday month!",
    pointsCost: 1200,
    value: 50,
    category: "cat4",
    type: "discount",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 300,
    usageCount: 15,
    minTier: "Gold",
    image: "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r6",
    name: "Luxury Product Bundle",
    description: "Take home a curated selection of premium beauty products worth $75. Includes skincare, makeup, and hair care essentials.",
    pointsCost: 1500,
    value: 75,
    category: "cat2",
    type: "product",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 50,
    usageCount: 3,
    minTier: "Platinum",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "r7",
    name: "Free add-on service",
    description: "Get a complimentary add-on service with your next appointment",
    pointsCost: 200,
    category: "cat1",
    type: "service",
    isActive: true,
    expiresAt: "2025-12-31T23:59:59Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageLimit: 300,
    usageCount: 67,
    minTier: "Bronze",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];
