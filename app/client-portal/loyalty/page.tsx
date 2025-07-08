"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Star, Gift, Award, Share2, History, ChevronRight, Calendar, ShoppingBag, Scissors, Plus, Minus, Edit } from "lucide-react"
import { useClients } from "@/lib/client-provider"
import { useSpecialOffers } from "@/lib/special-offers-storage"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { LoyaltyData, LoyaltyReward, PointHistoryItem, Referral } from "@/lib/types/loyalty"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ReferralManagement } from "@/components/loyalty/referral-management"



export default function LoyaltyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clients, getClient } = useClients()
  const { formatCurrency } = useCurrency()
  const { activeOffers } = useSpecialOffers()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false)
  const [referralEmail, setReferralEmail] = useState("")
  const [referralMessage, setReferralMessage] = useState("")
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false)
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>([])

  useEffect(() => {
    const clientEmail = localStorage.getItem("client_email")
    const clientAuthToken = localStorage.getItem("client_auth_token")

    if (!clientEmail || !clientAuthToken) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your loyalty program",
        variant: "destructive",
      })
      router.push("/client-portal")
      return
    }

    const foundClient = getClient(clientEmail)

    if (foundClient) {
      setClient(foundClient)
    } else {
      // If client not found, create a mock client for demo purposes
      setClient({
        id: "client123",
        name: "Jane Smith",
        email: clientEmail,
        avatar: "JS",
        memberSince: "January 2025"
      })
    }

    // Fetch loyalty data from the API
    const fetchLoyaltyData = async () => {
      try {
        const clientId = foundClient?.id || "client123"

        const response = await fetch(`/api/client-portal/loyalty?clientId=${clientId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch loyalty data")
        }

        setLoyaltyData(data.loyalty)
        setPointsHistory(data.history)
      } catch (error) {
        console.error("Error fetching loyalty data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch loyalty data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLoyaltyData()
  }, [clients, getClient, router, toast])



  const handleSendReferral = (email: string) => {
    const newReferral: Referral = {
      id: `ref${Date.now()}`,
      referrerId: client?.id || 'client123',
      referrerName: client?.name || 'Jane Smith',
      refereeEmail: email,
      referralCode: loyaltyData?.referralCode || 'JANE2025',
      status: 'pending',
      createdAt: new Date().toISOString(),
      pointsAwarded: 0
    }

    setLoyaltyData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        referrals: [...prev.referrals, newReferral]
      }
    })
  }

  const handleGenerateNewReferralCode = () => {
    const newCode = `${client?.name?.split(' ')[0]?.toUpperCase() || 'USER'}${Date.now().toString().slice(-4)}`
    setLoyaltyData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        referralCode: newCode
      }
    })
  }

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!referralEmail) {
      toast({
        title: "Email required",
        description: "Please enter your friend's email address.",
        variant: "destructive",
      })
      return
    }

    try {
      // Call the API to send the referral
      const response = await fetch('/api/client-portal/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerId: client?.id || 'client123',
          referrerName: client?.name || 'Jane Smith',
          referrerEmail: client?.email || 'jane@example.com',
          friendEmail: referralEmail,
          message: referralMessage
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send referral')
      }

      toast({
        title: "Referral sent!",
        description: "Your friend has been invited to join Vanity Hub. You'll earn 200 points when they book their first appointment.",
      })

      setReferralEmail("")
      setReferralMessage("")
      setIsReferralDialogOpen(false)
    } catch (error) {
      console.error('Error sending referral:', error)
      toast({
        title: "Failed to send referral",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const handleRedeemReward = async () => {
    if (!selectedReward || !loyaltyData) return

    // Enhanced validation
    if (loyaltyData.points < selectedReward.pointsCost) {
      toast({
        title: "Insufficient points",
        description: `You need ${selectedReward.pointsCost - loyaltyData.points} more points to redeem this reward.`,
        variant: "destructive",
      })
      return
    }

    // Check reward availability
    if (selectedReward.usageLimit && selectedReward.usageCount >= selectedReward.usageLimit) {
      toast({
        title: "Reward unavailable",
        description: "This reward has reached its usage limit and is no longer available.",
        variant: "destructive",
      })
      return
    }

    // Check tier requirements
    if (selectedReward.minTier && loyaltyData.tier) {
      const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
      const userTierIndex = tierOrder.indexOf(loyaltyData.tier)
      const requiredTierIndex = tierOrder.indexOf(selectedReward.minTier)

      if (userTierIndex < requiredTierIndex) {
        toast({
          title: "Tier requirement not met",
          description: `This reward requires ${selectedReward.minTier} tier or higher. You are currently ${loyaltyData.tier}.`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      // Call the API to redeem the reward
      const response = await fetch('/api/client-portal/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'redeem',
          clientId: client?.id || 'client123',
          rewardId: selectedReward.id,
          pointsCost: selectedReward.pointsCost,
          rewardName: selectedReward.name
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward')
      }

      // Enhanced success feedback
      toast({
        title: "🎉 Reward redeemed successfully!",
        description: `${selectedReward.name} has been added to your account. Your new points balance is ${data.updatedPoints}.`,
      })

      // Update the local state with the new points balance and add to redeemed rewards
      setLoyaltyData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          points: data.updatedPoints,
          redeemedRewards: [
            ...prev.redeemedRewards,
            {
              ...selectedReward,
              redeemedAt: new Date().toISOString(),
              status: 'active'
            }
          ]
        };
      })

      // Add to points history
      const newHistoryItem = {
        id: `redeem_${Date.now()}`,
        type: 'redeemed' as const,
        points: -selectedReward.pointsCost,
        description: `Redeemed: ${selectedReward.name}`,
        date: new Date().toISOString(),
        reason: 'reward_redemption'
      }
      setPointsHistory(prev => [newHistoryItem, ...prev])

      setIsRedeemDialogOpen(false)
      setSelectedReward(null)

      // Refresh the page after a short delay to show updated points
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast({
        title: "Failed to redeem reward",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
    )
  }

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
    <ClientPortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Loyalty Program</h1>
            <p className="text-gray-600">Earn points, get rewards, and enjoy exclusive benefits</p>
          </div>
          <Button
            className="bg-pink-600 hover:bg-pink-700"
            onClick={() => setIsReferralDialogOpen(true)}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Refer a Friend
          </Button>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Loyalty Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-white/80 text-sm">Vanity Hub</p>
                      <h3 className="font-bold text-xl">Rewards Card</h3>
                    </div>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                      {loyaltyData?.tier || "Gold"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-white/80 text-sm mb-1">Member Name</p>
                      <p className="font-medium">{client?.name || "Jane Smith"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm mb-1">Member Since</p>
                      <p className="font-medium">{loyaltyData?.memberSince || "Jan 15, 2025"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-white text-white mr-2" />
                      <span className="font-bold text-xl">{loyaltyData?.points || 0} points</span>
                    </div>
                    <p className="text-sm text-white/80">
                      ID: {client?.id || "client123"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Points Progress</CardTitle>
                <CardDescription>Track your progress towards rewards and tier upgrades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Next Reward</span>
                    <span>{loyaltyData?.points || 0}/{(loyaltyData?.points || 0) + (loyaltyData?.pointsToNextReward || 50)} points</span>
                  </div>
                  <Progress
                    value={((loyaltyData?.points || 0) / ((loyaltyData?.points || 0) + (loyaltyData?.pointsToNextReward || 50))) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    Earn {loyaltyData?.pointsToNextReward || 50} more points for a <CurrencyDisplay amount={25} /> reward
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Next Tier: {loyaltyData?.nextTier || "Platinum"}</span>
                    <span>{loyaltyData?.points || 0}/{(loyaltyData?.points || 0) + (loyaltyData?.pointsToNextTier || 250)} points</span>
                  </div>
                  <Progress
                    value={((loyaltyData?.points || 0) / ((loyaltyData?.points || 0) + (loyaltyData?.pointsToNextTier || 250))) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    Earn {loyaltyData?.pointsToNextTier || 250} more points to reach {loyaltyData?.nextTier || "Platinum"} status
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tier Benefits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Your {loyaltyData?.tier || "Gold"} Benefits</CardTitle>
                <CardDescription>Exclusive perks for your loyalty tier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Earn 10 points for every <CurrencyDisplay amount={1} /> spent on services</li>
                      <li>• Earn 5 points for every <CurrencyDisplay amount={1} /> spent on products</li>
                      <li>• Birthday reward: 250 bonus points</li>
                      {(loyaltyData?.tier === "Silver" || (!loyaltyData && "Silver")) && <li>• 5% discount on all services</li>}
                      {(loyaltyData?.tier === "Gold" || (!loyaltyData?.tier && "Gold")) && (
                        <>
                          <li>• 10% discount on all services</li>
                          <li>• Free birthday service up to <CurrencyDisplay amount={50} /></li>
                        </>
                      )}
                      {(loyaltyData?.tier === "Platinum") && (
                        <>
                          <li>• 15% discount on all services</li>
                          <li>• Free birthday service up to <CurrencyDisplay amount={100} /></li>
                          <li>• Priority booking</li>
                        </>
                      )}
                      {(loyaltyData?.tier === "Diamond") && (
                        <>
                          <li>• 20% discount on all services</li>
                          <li>• Free birthday service up to <CurrencyDisplay amount={150} /></li>
                          <li>• Priority booking</li>
                          <li>• Exclusive VIP events</li>
                          <li>• Complimentary add-on with every service</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Special Offers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>🌟 Special Offers</CardTitle>
                <CardDescription>Limited-time promotions and seasonal deals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeOffers.length > 0 ? (
                  activeOffers.slice(0, 3).map((offer) => (
                    <Card
                      key={offer.id}
                      className={`border-2 ${
                        offer.type === 'seasonal' ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50' :
                        offer.type === 'loyalty' ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' :
                        'border-green-200 bg-gradient-to-r from-green-50 to-pink-50'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{offer.title}</h3>
                              {offer.badge && (
                                <Badge className={`${offer.badgeColor || 'bg-pink-500'} text-white`}>
                                  {offer.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {offer.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Valid until: {offer.validTo.toLocaleDateString()}</span>
                              {offer.conditions?.minAmount && (
                                <span>• Minimum spend: <CurrencyDisplay amount={offer.conditions.minAmount} /></span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <Button
                              size="sm"
                              className={`${
                                offer.type === 'seasonal' ? 'bg-orange-600 hover:bg-orange-700' :
                                offer.type === 'loyalty' ? 'bg-purple-600 hover:bg-purple-700' :
                                'bg-green-600 hover:bg-green-700'
                              }`}
                              asChild
                            >
                              <Link href={offer.ctaLink || "/client-portal/appointments/book"}>
                                {offer.ctaText || "Book Now"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No special offers available at the moment.</p>
                    <p className="text-sm text-gray-400 mt-2">Check back soon for exciting deals!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ways to Earn */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Ways to Earn Points</CardTitle>
                <CardDescription>Boost your points balance with these activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/client-portal/appointments/book">
                    <Card className="border-dashed hover:border-pink-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="pt-6">
                        <Scissors className="h-8 w-8 text-pink-600 mb-2" />
                        <h3 className="font-medium mb-1">Book Services</h3>
                        <p className="text-sm text-gray-600">
                          Earn 10 points for every <CurrencyDisplay amount={1} /> spent on salon services
                        </p>
                        <div className="mt-3 text-xs text-pink-600 flex items-center">
                          <span>Book now</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/client-portal/shop">
                    <Card className="border-dashed hover:border-pink-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="pt-6">
                        <ShoppingBag className="h-8 w-8 text-pink-600 mb-2" />
                        <h3 className="font-medium mb-1">Buy Products</h3>
                        <p className="text-sm text-gray-600">
                          Earn 5 points for every <CurrencyDisplay amount={1} /> spent on beauty products
                        </p>
                        <div className="mt-3 text-xs text-pink-600 flex items-center">
                          <span>Shop now</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card
                    className="border-dashed hover:border-pink-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setIsReferralDialogOpen(true)}
                  >
                    <CardContent className="pt-6">
                      <Share2 className="h-8 w-8 text-pink-600 mb-2" />
                      <h3 className="font-medium mb-1">Refer Friends</h3>
                      <p className="text-sm text-gray-600">
                        Earn 200 points for each friend who books their first appointment
                      </p>
                      <div className="mt-3 text-xs text-pink-600 flex items-center">
                        <span>Refer now</span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client-portal/appointments/book">
                    Book an Appointment
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            {/* Reward Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {['All', 'Beauty Services', 'Product Discounts', 'Exclusive Perks'].map((category) => (
                <Button
                  key={category}
                  variant={category === 'All' ? 'default' : 'outline'}
                  className={category === 'All' ? 'bg-pink-600 hover:bg-pink-700' : ''}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Available Rewards</CardTitle>
                <CardDescription>Redeem your points for these exclusive rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(loyaltyData?.availableRewards || []).map((reward) => {
                  const isAvailable = (loyaltyData?.points || 0) >= reward.pointsCost
                  const isInStock = !reward.usageLimit || reward.usageCount < reward.usageLimit
                  const meetsRequirements = !reward.minTier ||
                    (loyaltyData?.tier && ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(loyaltyData.tier) >=
                     ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(reward.minTier))

                  return (
                    <Card key={reward.id} className={`overflow-hidden transition-all ${
                      isAvailable && isInStock && meetsRequirements
                        ? 'border-pink-200 hover:shadow-md'
                        : 'opacity-75 border-gray-200'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {reward.id === "r1" ? (
                                  <>
                                    <CurrencyDisplay amount={25} /> off your next service
                                  </>
                                ) : reward.id === "r2" ? (
                                  <>
                                    Free product (up to <CurrencyDisplay amount={15} /> value)
                                  </>
                                ) : (
                                  reward.name
                                )}
                              </h3>
                              <div className="flex gap-1">
                                {!isInStock && (
                                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                )}
                                {!meetsRequirements && reward.minTier && (
                                  <Badge variant="secondary" className="text-xs">{reward.minTier}+ Required</Badge>
                                )}
                                {isAvailable && isInStock && meetsRequirements && (
                                  <Badge variant="default" className="text-xs bg-green-600">Available</Badge>
                                )}
                              </div>
                            </div>

                            {reward.description && (
                              <p className="text-sm text-gray-600">{reward.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Expires: {format(parseISO(reward.expiresAt), "MMM d, yyyy")}</span>
                              {reward.usageLimit && (
                                <span>{reward.usageLimit - reward.usageCount} remaining</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <p className="font-bold text-lg">{reward.pointsCost} points</p>
                            <Button
                              size="sm"
                              className="mt-2 bg-pink-600 hover:bg-pink-700"
                              disabled={!isAvailable || !isInStock || !meetsRequirements}
                              onClick={() => {
                                setSelectedReward(reward)
                                setIsRedeemDialogOpen(true)
                              }}
                            >
                              {!isAvailable ? 'Insufficient Points' :
                               !isInStock ? 'Out of Stock' :
                               !meetsRequirements ? 'Tier Required' : 'Redeem'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>More exciting rewards are on the way</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="border-dashed bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="font-medium">Exclusive VIP Event Access</h3>
                        <p className="text-sm text-gray-500">
                          Coming in June 2025
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">750 points</p>
                        <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="font-medium">Partner Spa Day Pass</h3>
                        <p className="text-sm text-gray-500">
                          Coming in July 2025
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">1000 points</p>
                        <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Points History</CardTitle>
                <CardDescription>Track your points earned and redeemed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(pointsHistory || []).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {item.description.includes("25 off service") ? (
                            item.description.replace("25 off service", "").trim() + " "
                          ) : (
                            item.description
                          )}
                          {item.description.includes("25 off service") && (
                            <>
                              <CurrencyDisplay amount={25} /> off service
                            </>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(item.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className={`font-bold ${item.type === 'earned' ? 'text-green-600' : 'text-red-500'}`}>
                        {item.type === 'earned' ? '+' : ''}{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline">
                  View All History
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Points Overview Tab */}
          <TabsContent value="points" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Points Overview</h3>
                <p className="text-sm text-gray-600">View your points balance and activity</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Points</p>
                      <p className="text-3xl font-bold text-pink-600">{loyaltyData?.points || 0}</p>
                    </div>
                    <Star className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Earned</p>
                      <p className="text-3xl font-bold text-green-600">{loyaltyData?.totalPointsEarned || 0}</p>
                    </div>
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Tier</p>
                      <p className="text-2xl font-bold">{loyaltyData?.tier || "Gold"}</p>
                    </div>
                    <Gift className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Point Activities</CardTitle>
                <CardDescription>Latest point transactions and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pointsHistory.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span>{format(parseISO(item.date), "MMM dd, yyyy")}</span>
                          {item.reason && <span>• {item.reason}</span>}
                        </div>
                      </div>
                      <div className={`font-bold ${item.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {item.points > 0 ? '+' : ''}{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <ReferralManagement
              clientId={client?.id || 'client123'}
              clientName={client?.name || 'Jane Smith'}
              referralCode={loyaltyData?.referralCode || 'JANE2025'}
              referrals={loyaltyData?.referrals || []}
              onSendReferral={handleSendReferral}
              onGenerateNewCode={handleGenerateNewReferralCode}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleReferralSubmit}>
            <DialogHeader>
              <DialogTitle>Refer a Friend</DialogTitle>
              <DialogDescription>
                Invite your friends to Vanity Hub and earn 200 points for each friend who books their first appointment.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Friend's Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Hey! I thought you might like this salon..."
                  value={referralMessage}
                  onChange={(e) => setReferralMessage(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReferralDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700"
              >
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Confirm that you want to redeem this reward using your points.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="py-6 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        {selectedReward.id === "r1" ? (
                          <>
                            <CurrencyDisplay amount={25} /> off your next service
                          </>
                        ) : selectedReward.id === "r2" ? (
                          <>
                            Free product (up to <CurrencyDisplay amount={15} /> value)
                          </>
                        ) : (
                          selectedReward.name
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Expires: {format(parseISO(selectedReward.expiresAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <p className="font-bold">{selectedReward.pointsCost} points</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your current points:</span>
                  <span>{loyaltyData?.points || 0} points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Points to be deducted:</span>
                  <span className="text-red-500">-{selectedReward.pointsCost} points</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Remaining points:</span>
                  <span>{(loyaltyData?.points || 0) - selectedReward.pointsCost} points</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Once redeemed, this reward will be available in your account and can be used during your next visit or purchase.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRedeemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-pink-600 hover:bg-pink-700"
              onClick={handleRedeemReward}
            >
              Confirm Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </ClientPortalLayout>
  )
}
