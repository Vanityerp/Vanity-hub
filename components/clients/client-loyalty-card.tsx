"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Gift, Star, History, Award } from "lucide-react"

interface ClientLoyaltyCardProps {
  clientId: string
  clientName: string
  points: number
  pointsToNextReward: number
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  memberSince: string
  rewardHistory?: {
    id: string
    date: string
    description: string
    points: number
    redeemed: boolean
  }[]
}

export function ClientLoyaltyCard({
  clientId,
  clientName,
  points,
  pointsToNextReward,
  tier,
  memberSince,
  rewardHistory = [],
}: ClientLoyaltyCardProps) {
  const totalPointsNeeded = points + pointsToNextReward
  const progressPercentage = (points / totalPointsNeeded) * 100

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Silver":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "Gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Platinum":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loyalty Program</CardTitle>
            <CardDescription>Manage client rewards and points</CardDescription>
          </div>
          <Badge variant="outline" className={getTierColor(tier)}>
            {tier} Member
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-lg">{points} points</span>
            </div>
            <span className="text-sm text-muted-foreground">Member since {memberSince}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress to next reward</span>
              <span>{points}/{totalPointsNeeded} points</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Earn {pointsToNextReward} more points for a <CurrencyDisplay amount={25} /> reward
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" variant="outline">
            <History className="mr-2 h-4 w-4" />
            View History
          </Button>
          <Button className="flex-1" disabled={points < 500}>
            <Gift className="mr-2 h-4 w-4" />
            Redeem Points
          </Button>
        </div>

        {rewardHistory.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recent Activity</h3>
            <div className="space-y-2">
              {rewardHistory.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.redeemed ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        -{item.points}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        +{item.points}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border p-3 bg-muted/30">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Tier Benefits</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Earn 10 points for every <CurrencyDisplay amount={1} /> spent on services</li>
                <li>• Earn 5 points for every <CurrencyDisplay amount={1} /> spent on products</li>
                <li>• Birthday reward: 250 bonus points</li>
                {tier === "Silver" && <li>• 5% discount on all services</li>}
                {tier === "Gold" && (
                  <>
                    <li>• 10% discount on all services</li>
                    <li>• Free birthday service up to <CurrencyDisplay amount={50} /></li>
                  </>
                )}
                {tier === "Platinum" && (
                  <>
                    <li>• 15% discount on all services</li>
                    <li>• Free birthday service up to <CurrencyDisplay amount={100} /></li>
                    <li>• Priority booking</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
