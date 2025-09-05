import { LoyaltyData, LoyaltyReward, RedeemedReward, Referral } from "@/lib/types/loyalty";
import { rewardTemplates } from "@/lib/loyalty-management-data";

// DEPRECATED: All loyalty data is now managed through the database
// Use API endpoints to fetch real loyalty data
export const loyaltyData: Record<string, LoyaltyData> = {}


// DEPRECATED: All point history data is now managed through the database
// Use API endpoints to fetch real point history data
export const pointHistory: Record<string, any[]> = {}
