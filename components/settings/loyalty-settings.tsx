"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Star, Gift, Award, Plus, Edit, Trash2, Users, TrendingUp, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LoyaltyData, LoyaltyReward, PointHistoryItem, LoyaltyTier } from "@/lib/types/loyalty"
import { format, parseISO } from "date-fns"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { RewardManagementDialog } from "@/components/loyalty/reward-management-dialog"
import { PointAdjustmentDialog } from "@/components/loyalty/point-adjustment-dialog"
import { TierManagementDialog } from "@/components/loyalty/tier-management-dialog"
import { rewardTemplates, loyaltyTiers } from "@/lib/loyalty-management-data"
import { useAuth } from "@/lib/auth-provider"
import { AccessDenied } from "@/components/access-denied"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LoyaltySettings() {
  const { hasPermission, user } = useAuth()
  const { toast } = useToast()
  const { currency, formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("rewards")

  // Check if user has permission to manage loyalty program
  if (!user || user.role !== "super_admin") {
    return (
      <AccessDenied
        description="Only super administrators can manage the loyalty program."
        backButtonHref="/dashboard/settings"
      />
    )
  }

  // Management dialog states
  const [isRewardManagementOpen, setIsRewardManagementOpen] = useState(false)
  const [isPointAdjustmentOpen, setIsPointAdjustmentOpen] = useState(false)
  const [isTierManagementOpen, setIsTierManagementOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)

  // Data states
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [tiers, setTiers] = useState<LoyaltyTier[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("client123")

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/client-portal/loyalty?clientId=${selectedClient}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch loyalty data")
      }

      setRewards(data.loyalty.availableRewards)
      setTiers(loyaltyTiers)
    } catch (error) {
      console.error("Error fetching loyalty data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch loyalty data. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveReward = async (rewardData: Partial<LoyaltyReward>) => {
    try {
      if (editingReward) {
        // Update existing reward
        const updatedRewards = rewards.map(reward =>
          reward.id === editingReward.id
            ? { ...reward, ...rewardData }
            : reward
        )
        setRewards(updatedRewards)
        toast({
          title: "Reward updated",
          description: "The reward has been updated successfully.",
        })
      } else {
        // Create new reward
        const newReward: LoyaltyReward = {
          id: `reward_${Date.now()}`,
          name: rewardData.name || "",
          description: rewardData.description || "",
          pointsCost: rewardData.pointsCost || 0,
          type: rewardData.type || "discount",
          value: rewardData.value || 0,
          category: rewardData.category || "services",
          isActive: rewardData.isActive ?? true,
          expiryDate: rewardData.expiryDate,
          usageLimit: rewardData.usageLimit,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setRewards([...rewards, newReward])
        toast({
          title: "Reward created",
          description: "The new reward has been created successfully.",
        })
      }
    } catch (error) {
      console.error("Error saving reward:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save reward. Please try again.",
      })
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    try {
      const updatedRewards = rewards.filter(reward => reward.id !== rewardId)
      setRewards(updatedRewards)
      toast({
        title: "Reward deleted",
        description: "The reward has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting reward:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete reward. Please try again.",
      })
    }
  }

  const handleSaveTier = async (tierData: Partial<LoyaltyTier>) => {
    try {
      if (editingTier) {
        // Update existing tier
        const updatedTiers = tiers.map(tier =>
          tier.id === editingTier.id
            ? { ...tier, ...tierData }
            : tier
        )
        setTiers(updatedTiers)
        toast({
          title: "Tier updated",
          description: "The tier has been updated successfully.",
        })
      } else {
        // Create new tier
        const newTier: LoyaltyTier = {
          id: `tier_${Date.now()}`,
          name: tierData.name || "",
          description: tierData.description || "",
          minPoints: tierData.minPoints || 0,
          maxPoints: tierData.maxPoints,
          benefits: tierData.benefits || [],
          pointsMultiplier: tierData.pointsMultiplier || 1.0,
          isActive: tierData.isActive ?? true,
          color: tierData.color || "bg-gray-100 text-gray-800",
          icon: tierData.icon || "Medal",
        }
        setTiers([...tiers, newTier])
        toast({
          title: "Tier created",
          description: "The new tier has been created successfully.",
        })
      }
    } catch (error) {
      console.error("Error saving tier:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save tier. Please try again.",
      })
    }
  }

  const handleDeleteTier = async (tierId: string) => {
    try {
      const updatedTiers = tiers.filter(tier => tier.id !== tierId)
      setTiers(updatedTiers)
      toast({
        title: "Tier deleted",
        description: "The tier has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting tier:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete tier. Please try again.",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program Management</CardTitle>
          <CardDescription>Loading loyalty program settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loyalty Program Management</CardTitle>
        <CardDescription>Manage rewards, tiers, and customer loyalty programs</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rewards" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="offers">Special Offers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
          </TabsList>

          {/* Rewards Management Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Reward Management</h3>
                <p className="text-sm text-gray-600">Create and manage loyalty rewards</p>
              </div>
              <Button
                onClick={() => {
                  setEditingReward(null)
                  setIsRewardManagementOpen(true)
                }}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Reward
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <Card key={reward.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={reward.isActive ? "default" : "secondary"}>
                          {reward.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingReward(reward)
                              setIsRewardManagementOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Reward</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this reward? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReward(reward.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-lg">{reward.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Points Cost:</span>
                          <span className="font-medium">{reward.pointsCost}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Value:</span>
                          <span className="font-medium">
                            {reward.type === "percentage" ? `${reward.value}%` :
                             reward.type === "fixed_amount" ? <CurrencyDisplay amount={reward.value} /> :
                             reward.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Category:</span>
                          <Badge variant="outline">{reward.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tiers Management Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Tier Management</h3>
                <p className="text-sm text-gray-600">Configure loyalty tiers and benefits</p>
              </div>
              <Button
                onClick={() => {
                  setEditingTier(null)
                  setIsTierManagementOpen(true)
                }}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Tier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <Card key={tier.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className={tier.color}>
                          {tier.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTier(tier)
                            setIsTierManagementOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">{tier.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Points Range:</span>
                          <span className="font-medium">
                            {tier.minPoints} - {tier.maxPoints || "∞"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Multiplier:</span>
                          <span className="font-medium">{tier.pointsMultiplier}x</span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Benefits:</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {tier.benefits.slice(0, 3).map((benefit, index) => (
                            <li key={index}>• {benefit}</li>
                          ))}
                          {tier.benefits.length > 3 && (
                            <li className="text-gray-400">+ {tier.benefits.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Special Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Special Offers Management</h3>
                <p className="text-sm text-gray-600">Create and manage promotional offers for the loyalty program</p>
              </div>
              <Button
                onClick={() => {
                  // Add new offer functionality
                }}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Offer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summer Special Offer */}
              <Card className="border-2 border-orange-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Summer Glow Special</h4>
                        <Badge className="bg-orange-500 text-white">25% OFF</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      Beat the heat in style! Book any styling service and receive 25% off your next visit.
                    </p>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>Seasonal Campaign</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid:</span>
                        <span>Jun 1 - Aug 31, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min. Spend:</span>
                        <span>QAR 50</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Double Points Weekend */}
              <Card className="border-2 border-purple-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">Double Points Weekend</h4>
                        <Badge className="bg-purple-500 text-white">2X POINTS</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      Earn double loyalty points on all services booked this weekend.
                    </p>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>Loyalty Promotion</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid:</span>
                        <span>This Weekend</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Applies to:</span>
                        <span>All Services</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Offer Templates</CardTitle>
                <CardDescription>Quick-start templates for common promotional offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-dashed border-2 hover:border-pink-300 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-3">
                        <Sun className="h-6 w-6" />
                      </div>
                      <h5 className="font-medium mb-2">Summer Special</h5>
                      <p className="text-sm text-gray-600">Seasonal discount offer</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2 hover:border-pink-300 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-3">
                        <Star className="h-6 w-6" />
                      </div>
                      <h5 className="font-medium mb-2">Double Points</h5>
                      <p className="text-sm text-gray-600">Bonus points promotion</p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2 hover:border-pink-300 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mx-auto mb-3">
                        <Gift className="h-6 w-6" />
                      </div>
                      <h5 className="font-medium mb-2">Holiday Special</h5>
                      <p className="text-sm text-gray-600">Holiday-themed offer</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Loyalty Analytics</h3>
              <p className="text-sm text-gray-600">Track loyalty program performance and metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">1,234</p>
                      <p className="text-sm text-gray-600">Active Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">45,678</p>
                      <p className="text-sm text-gray-600">Points Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-sm text-gray-600">Rewards Redeemed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">23%</p>
                      <p className="text-sm text-gray-600">Engagement Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Program Performance</CardTitle>
                <CardDescription>Overview of loyalty program metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Detailed analytics charts would be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Management Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Client Point Management</h3>
                <p className="text-sm text-gray-600">Manage individual client points and adjustments</p>
              </div>
              <Button
                onClick={() => setIsPointAdjustmentOpen(true)}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Star className="mr-2 h-4 w-4" />
                Adjust Points
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Client Selection</CardTitle>
                <CardDescription>Select a client to manage their loyalty points</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Client management interface would go here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Management Dialogs */}
        <RewardManagementDialog
          open={isRewardManagementOpen}
          onOpenChange={setIsRewardManagementOpen}
          reward={editingReward}
          onSave={handleSaveReward}
        />

        <PointAdjustmentDialog
          open={isPointAdjustmentOpen}
          onOpenChange={setIsPointAdjustmentOpen}
          clientId={selectedClient}
          clientName="Selected Client"
          currentPoints={450}
          onAdjustment={(adjustment) => {
            toast({
              title: "Points adjusted",
              description: "Client points have been updated successfully.",
            })
          }}
        />

        <TierManagementDialog
          open={isTierManagementOpen}
          onOpenChange={setIsTierManagementOpen}
          tier={editingTier}
          onSave={handleSaveTier}
          existingTiers={tiers}
        />
      </CardContent>
    </Card>
  )
}
