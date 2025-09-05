// Enhanced Loyalty Reward interface
export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  value?: number; // Monetary value for discounts
  category: string;
  type: "service" | "product" | "discount" | "experience";
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  usageLimit?: number; // Max times this reward can be redeemed
  usageCount: number; // Times this reward has been redeemed
  minTier?: string; // Minimum tier required to redeem
  image?: string;
}

// Reward Category interface
export interface RewardCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  rewardCount: number;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Redeemed Reward interface
export interface RedeemedReward {
  id: string;
  rewardId: string;
  name: string;
  redeemedAt: string;
  usedAt: string | null;
  pointsCost: number;
  status: "active" | "used" | "expired";
  expiresAt: string;
}

// Enhanced Point History interface
export interface PointHistoryItem {
  id: string;
  date: string;
  description: string;
  points: number;
  type: "earned" | "redeemed" | "adjustment" | "bonus" | "referral";
  reason?: string; // For manual adjustments
  relatedId?: string; // Related transaction, referral, etc.
}

// Loyalty Tier interface
export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  pointsMultiplier: number; // e.g., 1.5 for 50% bonus points
  isActive: boolean;
  color: string;
  icon: string;
}

// Point Earning Rules interface
export interface PointEarningRule {
  id: string;
  name: string;
  description: string;
  type: "service" | "product" | "referral" | "birthday" | "signup" | "review";
  pointsPerDollar?: number;
  fixedPoints?: number;
  isActive: boolean;
  conditions?: {
    minAmount?: number;
    serviceTypes?: string[];
    productCategories?: string[];
  };
}

// Referral Program interface
export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrerReward: number; // Points for the person making referral
  refereeReward: number; // Points for the new customer
  isActive: boolean;
  conditions: {
    minPurchaseAmount?: number;
    validityDays: number;
  };
}

// Referral interface
export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  refereeEmail: string;
  refereeName?: string;
  referralCode: string;
  status: "pending" | "completed" | "expired";
  createdAt: string;
  completedAt?: string;
  pointsAwarded: number;
}

// Promotion interface
export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "bonus_points" | "double_points" | "tier_upgrade";
  value: number; // Bonus points or multiplier
  startDate: string;
  endDate: string;
  isActive: boolean;
  conditions: {
    minAmount?: number;
    serviceTypes?: string[];
    productCategories?: string[];
    tiers?: string[];
  };
}

// Enhanced Loyalty Data interface
export interface LoyaltyData {
  points: number;
  pointsToNextReward: number;
  totalPointsEarned: number;
  memberSince: string;
  tier: string;
  nextTier: string;
  pointsToNextTier: number;
  availableRewards: LoyaltyReward[];
  redeemedRewards: RedeemedReward[];
  referralCode: string;
  referrals: Referral[];
  activePromotions: Promotion[];
}
