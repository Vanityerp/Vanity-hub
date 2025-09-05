import { NextResponse } from "next/server";
import { loyaltyData, pointHistory } from "@/lib/loyalty-data";
import { LoyaltyReward, PointHistoryItem } from "@/lib/types/loyalty";

// Get loyalty data for a client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const clientLoyalty = loyaltyData[clientId as keyof typeof loyaltyData];

    if (!clientLoyalty) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientHistory = pointHistory[clientId as keyof typeof pointHistory] || [];

    return NextResponse.json({
      loyalty: clientLoyalty,
      history: clientHistory
    });
  } catch (error) {
    console.error("Error fetching loyalty data:", error);
    return NextResponse.json({ error: "Failed to fetch loyalty data" }, { status: 500 });
  }
}

// Redeem a reward
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.rewardId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const clientLoyalty = loyaltyData[data.clientId as keyof typeof loyaltyData];

    if (!clientLoyalty) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Find the reward
    const reward = clientLoyalty.availableRewards.find(r => r.id === data.rewardId);

    if (!reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // Enhanced validation
    if (clientLoyalty.points < reward.pointsCost) {
      return NextResponse.json({
        error: "Insufficient points",
        pointsNeeded: reward.pointsCost - clientLoyalty.points
      }, { status: 400 });
    }

    // Check reward availability
    if (reward.usageLimit && reward.usageCount >= reward.usageLimit) {
      return NextResponse.json({
        error: "Reward is no longer available",
        message: "This reward has reached its usage limit"
      }, { status: 400 });
    }

    // Check tier requirements
    if (reward.minTier && clientLoyalty.tier) {
      const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
      const userTierIndex = tierOrder.indexOf(clientLoyalty.tier)
      const requiredTierIndex = tierOrder.indexOf(reward.minTier)

      if (userTierIndex < requiredTierIndex) {
        return NextResponse.json({
          error: "Tier requirement not met",
          message: `This reward requires ${reward.minTier} tier or higher. You are currently ${clientLoyalty.tier}.`
        }, { status: 400 });
      }
    }

    // Redeem the reward
    const redeemedReward = {
      id: `rr${clientLoyalty.redeemedRewards.length + 1}`,
      rewardId: reward.id,
      name: reward.name,
      redeemedAt: new Date().toISOString(),
      usedAt: null,
      pointsCost: reward.pointsCost
    };

    // Update client's loyalty data
    clientLoyalty.points -= reward.pointsCost;
    clientLoyalty.redeemedRewards.push(redeemedReward);

    // Update reward usage count
    if (reward.usageLimit) {
      reward.usageCount = (reward.usageCount || 0) + 1;
    }

    // Add to point history
    const clientHistoryArray = pointHistory[data.clientId as keyof typeof pointHistory];
    if (clientHistoryArray) {
      clientHistoryArray.unshift({
        id: `ph${clientHistoryArray.length + 1}`,
        date: new Date().toISOString(),
        description: `Reward Redemption: ${reward.name}`,
        points: -reward.pointsCost,
        type: "redeemed"
      });
    }

    return NextResponse.json({
      success: true,
      redeemedReward,
      updatedPoints: clientLoyalty.points
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 });
  }
}

// Add points (from purchase, referral, etc.)
export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.points || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const clientLoyalty = loyaltyData[data.clientId as keyof typeof loyaltyData];

    if (!clientLoyalty) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Add points to client's balance
    clientLoyalty.points += data.points;
    clientLoyalty.totalPointsEarned += data.points;

    // Add to point history
    const clientHistoryArray = pointHistory[data.clientId as keyof typeof pointHistory];
    if (clientHistoryArray) {
      clientHistoryArray.unshift({
        id: `ph${clientHistoryArray.length + 1}`,
        date: new Date().toISOString(),
        description: data.description,
        points: data.points,
        type: "earned"
      });
    }

    // Check if client has reached a new tier
    let tierUpdated = false;
    if (clientLoyalty.tier === "Bronze" && clientLoyalty.totalPointsEarned >= 500) {
      clientLoyalty.tier = "Silver";
      clientLoyalty.nextTier = "Gold";
      clientLoyalty.pointsToNextTier = 1000 - clientLoyalty.totalPointsEarned;
      tierUpdated = true;
    } else if (clientLoyalty.tier === "Silver" && clientLoyalty.totalPointsEarned >= 1000) {
      clientLoyalty.tier = "Gold";
      clientLoyalty.nextTier = "Platinum";
      clientLoyalty.pointsToNextTier = 2000 - clientLoyalty.totalPointsEarned;
      tierUpdated = true;
    } else if (clientLoyalty.tier === "Gold" && clientLoyalty.totalPointsEarned >= 2000) {
      clientLoyalty.tier = "Platinum";
      clientLoyalty.nextTier = "Diamond";
      clientLoyalty.pointsToNextTier = 5000 - clientLoyalty.totalPointsEarned;
      tierUpdated = true;
    }

    return NextResponse.json({
      success: true,
      updatedPoints: clientLoyalty.points,
      tierUpdated,
      newTier: tierUpdated ? clientLoyalty.tier : null
    });
  } catch (error) {
    console.error("Error adding points:", error);
    return NextResponse.json({ error: "Failed to add points" }, { status: 500 });
  }
}

// Create or update a reward
export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.reward || !data.action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { reward, action } = data;

    if (action === "create") {
      // Add new reward to all clients (global reward)
      Object.keys(loyaltyData).forEach(clientId => {
        loyaltyData[clientId].availableRewards.push(reward);
      });

      return NextResponse.json({
        success: true,
        message: "Reward created successfully",
        reward
      });
    } else if (action === "update") {
      // Update existing reward for all clients
      Object.keys(loyaltyData).forEach(clientId => {
        const rewardIndex = loyaltyData[clientId].availableRewards.findIndex(r => r.id === reward.id);
        if (rewardIndex !== -1) {
          loyaltyData[clientId].availableRewards[rewardIndex] = reward;
        }
      });

      return NextResponse.json({
        success: true,
        message: "Reward updated successfully",
        reward
      });
    } else if (action === "delete") {
      // Remove reward from all clients
      Object.keys(loyaltyData).forEach(clientId => {
        loyaltyData[clientId].availableRewards = loyaltyData[clientId].availableRewards.filter(r => r.id !== reward.id);
      });

      return NextResponse.json({
        success: true,
        message: "Reward deleted successfully"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing reward:", error);
    return NextResponse.json({ error: "Failed to manage reward" }, { status: 500 });
  }
}

// Handle point adjustments and referrals
export async function DELETE(request: Request) {
  try {
    const data = await request.json();

    if (data.action === "adjust_points") {
      // Manual point adjustment
      const { clientId, points, description, reason } = data;

      if (!clientId || points === undefined || !description || !reason) {
        return NextResponse.json({ error: "Missing required fields for point adjustment" }, { status: 400 });
      }

      const clientLoyalty = loyaltyData[clientId as keyof typeof loyaltyData];
      if (!clientLoyalty) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      // Update points
      clientLoyalty.points += points;
      if (points > 0) {
        clientLoyalty.totalPointsEarned += points;
      }

      // Add to point history
      const clientHistoryArray = pointHistory[clientId as keyof typeof pointHistory];
      if (clientHistoryArray) {
        clientHistoryArray.unshift({
          id: `adj${Date.now()}`,
          date: new Date().toISOString(),
          description,
          points,
          type: "adjustment",
          reason
        });
      }

      return NextResponse.json({
        success: true,
        updatedPoints: clientLoyalty.points,
        message: "Points adjusted successfully"
      });
    } else if (data.action === "send_referral") {
      // Send referral invitation
      const { clientId, refereeEmail } = data;

      if (!clientId || !refereeEmail) {
        return NextResponse.json({ error: "Missing required fields for referral" }, { status: 400 });
      }

      const clientLoyalty = loyaltyData[clientId as keyof typeof loyaltyData];
      if (!clientLoyalty) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      // Create new referral
      const newReferral = {
        id: `ref${Date.now()}`,
        referrerId: clientId,
        referrerName: "Client", // This would come from client data in real implementation
        refereeEmail,
        referralCode: clientLoyalty.referralCode,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        pointsAwarded: 0
      };

      clientLoyalty.referrals.push(newReferral);

      return NextResponse.json({
        success: true,
        referral: newReferral,
        message: "Referral sent successfully"
      });
    } else if (data.action === "generate_referral_code") {
      // Generate new referral code
      const { clientId } = data;

      if (!clientId) {
        return NextResponse.json({ error: "Client ID required" }, { status: 400 });
      }

      const clientLoyalty = loyaltyData[clientId as keyof typeof loyaltyData];
      if (!clientLoyalty) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      // Generate new code
      const newCode = `USER${Date.now().toString().slice(-4)}`;
      clientLoyalty.referralCode = newCode;

      return NextResponse.json({
        success: true,
        referralCode: newCode,
        message: "New referral code generated"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
