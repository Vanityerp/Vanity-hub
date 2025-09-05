import { NextResponse } from "next/server";
import { loyaltyData, pointHistory } from "@/lib/loyalty-data";

// Mock referrals data
const referrals: {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  friendEmail: string;
  message: string;
  status: "pending" | "registered" | "booked" | "completed";
  createdAt: string;
  completedAt: string | null;
  pointsAwarded: number;
}[] = [];

// Send a referral invitation
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.referrerId || !data.referrerEmail || !data.referrerName || !data.friendEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if this friend has already been referred by this user
    const existingReferral = referrals.find(
      r => r.referrerId === data.referrerId && r.friendEmail.toLowerCase() === data.friendEmail.toLowerCase()
    );
    
    if (existingReferral) {
      return NextResponse.json({ 
        error: "You have already referred this friend", 
        referral: existingReferral 
      }, { status: 400 });
    }
    
    // Create the new referral
    const newReferral = {
      id: `ref-${Date.now()}`,
      referrerId: data.referrerId,
      referrerName: data.referrerName,
      referrerEmail: data.referrerEmail,
      friendEmail: data.friendEmail,
      message: data.message || "",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      completedAt: null,
      pointsAwarded: 0
    };
    
    // In a real app, we would send an email to the friend here
    // For now, we'll just add it to our mock data
    referrals.push(newReferral);
    
    return NextResponse.json({
      success: true,
      referral: newReferral
    });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

// Get referrals for a client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }
    
    let filteredReferrals = referrals.filter(r => r.referrerId === clientId);
    
    if (status) {
      filteredReferrals = filteredReferrals.filter(r => r.status === status);
    }
    
    return NextResponse.json({
      referrals: filteredReferrals
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

// Complete a referral (when a friend books their first appointment)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.referralId || !data.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Find the referral
    const referralIndex = referrals.findIndex(r => r.id === data.referralId);
    
    if (referralIndex === -1) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }
    
    const referral = referrals[referralIndex];
    
    // Update the referral status
    referrals[referralIndex] = {
      ...referral,
      status: data.status,
      completedAt: data.status === "completed" ? new Date().toISOString() : referral.completedAt
    };
    
    // If the referral is completed, award points to the referrer
    if (data.status === "completed" && !referral.pointsAwarded) {
      const clientId = referral.referrerId;
      const clientLoyaltyData = loyaltyData[clientId as keyof typeof loyaltyData];
      
      if (clientLoyaltyData) {
        // Award 200 points for the referral
        const pointsToAward = 200;
        
        // Update the referral
        referrals[referralIndex].pointsAwarded = pointsToAward;
        
        // Update client's loyalty data
        clientLoyaltyData.points += pointsToAward;
        clientLoyaltyData.totalPointsEarned += pointsToAward;
        
        // Add to point history
        const clientHistoryArray = pointHistory[clientId as keyof typeof pointHistory];
        if (clientHistoryArray) {
          clientHistoryArray.unshift({
            id: `ph${clientHistoryArray.length + 1}`,
            date: new Date().toISOString(),
            description: `Referral Bonus: ${referral.friendEmail}`,
            points: pointsToAward,
            type: "earned"
          });
        }
        
        return NextResponse.json({
          success: true,
          referral: referrals[referralIndex],
          pointsAwarded: pointsToAward,
          updatedPoints: clientLoyaltyData.points
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      referral: referrals[referralIndex]
    });
  } catch (error) {
    console.error("Error updating referral:", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
