"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { useGiftCards } from "@/lib/gift-card-provider"
import { useMemberships } from "@/lib/membership-provider"
import { AccessDenied } from "@/components/access-denied"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import {
  Gift,
  Users,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  Calendar,
  TrendingUp,
  DollarSign
} from "lucide-react"
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
import { format } from "date-fns"
import { GiftCardStatus, GiftCardType } from "@/lib/gift-card-types"
import { MembershipStatus } from "@/lib/membership-types"
import { GiftCardIssueDialog } from "@/components/gift-cards/gift-card-issue-dialog"
import { MembershipEnrollmentDialog } from "@/components/memberships/membership-enrollment-dialog"
import { MembershipTierDialog } from "@/components/memberships/membership-tier-dialog"
import { GiftCardMembershipSettings } from "@/components/settings/gift-card-membership-settings"

export default function GiftCardsMembershipsPage() {
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [isGiftCardDialogOpen, setIsGiftCardDialogOpen] = useState(false)
  const [isMembershipDialogOpen, setIsMembershipDialogOpen] = useState(false)
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<any>(null)

  const {
    giftCards,
    giftCardTransactions,
    settings: giftCardSettings,
    isLoading: giftCardsLoading
  } = useGiftCards()

  const {
    memberships,
    membershipTiers,
    membershipTransactions,
    settings: membershipSettings,
    isLoading: membershipsLoading,
    createTier,
    updateTier,
    deleteTier
  } = useMemberships()

  // Check permissions
  if (!hasPermission("view_gift_cards") && !hasPermission("view_memberships")) {
    return (
      <AccessDenied
        description="You don't have permission to view gift cards and memberships."
        backButtonHref="/dashboard"
      />
    )
  }

  // Calculate overview statistics
  const giftCardStats = {
    totalSold: giftCards.length,
    totalValue: giftCards.reduce((sum, gc) => sum + gc.originalAmount, 0),
    activeBalance: giftCards
      .filter(gc => gc.status === GiftCardStatus.ACTIVE)
      .reduce((sum, gc) => sum + gc.currentBalance, 0),
    redeemedCount: giftCards.filter(gc => gc.status === GiftCardStatus.REDEEMED).length
  }

  const membershipStats = {
    totalMembers: memberships.length,
    activeMembers: memberships.filter(m => m.status === MembershipStatus.ACTIVE).length,
    totalRevenue: memberships.reduce((sum, m) => sum + m.price, 0),
    expiringCount: memberships.filter(m => {
      const endDate = new Date(m.endDate)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return m.status === MembershipStatus.ACTIVE && endDate <= thirtyDaysFromNow
    }).length
  }

  // Filter functions
  const filteredGiftCards = giftCards.filter(gc =>
    gc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gc.issuedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gc.purchaserEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMemberships = memberships.filter(m =>
    m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Tier management handlers
  const handleCreateTier = () => {
    setEditingTier(null)
    setIsTierDialogOpen(true)
  }

  const handleEditTier = (tier: any) => {
    setEditingTier(tier)
    setIsTierDialogOpen(true)
  }

  const handleDeleteTier = async (tierId: string) => {
    try {
      await deleteTier(tierId)
      toast({
        title: "Success",
        description: "Membership tier deleted successfully"
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete tier"
      })
    }
  }

  const handleToggleTierStatus = async (tier: any) => {
    try {
      await updateTier(tier.id, { isActive: !tier.isActive })
      toast({
        title: "Success",
        description: `Tier ${tier.isActive ? 'deactivated' : 'activated'} successfully`
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update tier status"
      })
    }
  }

  const handleSaveTier = async (tierData: any) => {
    try {
      if (editingTier) {
        await updateTier(editingTier.id, tierData)
        toast({
          title: "Success",
          description: "Membership tier updated successfully"
        })
      } else {
        await createTier(tierData)
        toast({
          title: "Success",
          description: "Membership tier created successfully"
        })
      }
      setIsTierDialogOpen(false)
      setEditingTier(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save tier"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gift Cards & Memberships</h2>
        <p className="text-muted-foreground">
          Manage gift cards, memberships, and customer loyalty programs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
          <TabsTrigger value="tiers">Membership Tiers</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gift Card Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gift Cards Sold</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{giftCardStats.totalSold}</div>
                <p className="text-xs text-muted-foreground">
                  <CurrencyDisplay amount={giftCardStats.totalValue} /> total value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={giftCardStats.activeBalance} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {giftCardStats.redeemedCount} fully redeemed
                </p>
              </CardContent>
            </Card>

            {/* Membership Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{membershipStats.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  of {membershipStats.totalMembers} total members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={membershipStats.totalRevenue} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {membershipStats.expiringCount} expiring soon
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Gift Card Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {giftCardTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{transaction.giftCardCode}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.type} • {format(new Date(transaction.createdAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          <CurrencyDisplay amount={transaction.amount} />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: <CurrencyDisplay amount={transaction.balanceAfter} />
                        </p>
                      </div>
                    </div>
                  ))}
                  {giftCardTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent gift card activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Membership Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {membershipTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{transaction.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.type} • {transaction.toTierName} • {format(new Date(transaction.createdAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          <CurrencyDisplay amount={transaction.amount} />
                        </p>
                      </div>
                    </div>
                  ))}
                  {membershipTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent membership activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gift Cards Tab */}
        <TabsContent value="gift-cards" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search gift cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {hasPermission("create_gift_card") && (
              <Button onClick={() => setIsGiftCardDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Issue Gift Card
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Original Amount</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued To</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGiftCards.map((giftCard) => (
                    <TableRow key={giftCard.id}>
                      <TableCell className="font-mono">{giftCard.code}</TableCell>
                      <TableCell>
                        <Badge variant={giftCard.type === GiftCardType.DIGITAL ? "default" : "secondary"}>
                          {giftCard.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CurrencyDisplay amount={giftCard.originalAmount} />
                      </TableCell>
                      <TableCell>
                        <CurrencyDisplay amount={giftCard.currentBalance} />
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            giftCard.status === GiftCardStatus.ACTIVE ? "default" :
                            giftCard.status === GiftCardStatus.REDEEMED ? "secondary" :
                            "destructive"
                          }
                        >
                          {giftCard.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{giftCard.issuedToName || "N/A"}</TableCell>
                      <TableCell>{format(new Date(giftCard.issuedDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission("edit_gift_card") && (
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredGiftCards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No gift cards found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search memberships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {hasPermission("create_membership") && (
              <Button onClick={() => setIsMembershipDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Membership
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Auto Renew</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">{membership.clientName}</TableCell>
                      <TableCell>{membership.tierName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            membership.status === MembershipStatus.ACTIVE ? "default" :
                            membership.status === MembershipStatus.EXPIRED ? "secondary" :
                            "destructive"
                          }
                        >
                          {membership.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(membership.startDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(membership.endDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <CurrencyDisplay amount={membership.price} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.autoRenew ? "default" : "secondary"}>
                          {membership.autoRenew ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission("edit_membership") && (
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMemberships.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No memberships found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Membership Tiers</h3>
              <p className="text-sm text-muted-foreground">
                Configure membership tiers, pricing, and benefits
              </p>
            </div>
            {hasPermission("manage_membership_tiers") && (
              <Button onClick={handleCreateTier}>
                <Plus className="mr-2 h-4 w-4" />
                Create Tier
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {membershipTiers
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((tier) => {
                const memberCount = memberships.filter(m => m.tierId === tier.id).length
                const activeMemberCount = memberships.filter(m => m.tierId === tier.id && m.status === 'active').length

                return (
                  <Card key={tier.id} className={!tier.isActive ? "opacity-60" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activeMemberCount} active
                          </Badge>
                          <Badge variant={tier.isActive ? "default" : "secondary"}>
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={tier.price} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium capitalize">{tier.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium">{tier.discountPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Free Services</span>
                      <span className="font-medium">{tier.freeServices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Priority</span>
                      <span className="font-medium">{tier.priorityBooking ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sort Order</span>
                      <span className="font-medium">{tier.sortOrder}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Benefits</span>
                    <ul className="text-xs space-y-1">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-current rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {hasPermission("manage_membership_tiers") && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Status</span>
                        <Switch
                          checked={tier.isActive}
                          onCheckedChange={() => handleToggleTierStatus(tier)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditTier(tier)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Membership Tier</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{tier.name}" tier? This action cannot be undone.
                                {memberships.some(m => m.tierId === tier.id) && (
                                  <span className="block mt-2 text-destructive font-medium">
                                    Warning: This tier is currently being used by active memberships.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTier(tier.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Tier
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )})}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Recent Transactions</h3>
            <p className="text-sm text-muted-foreground">
              View all gift card and membership transactions
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Combine and sort transactions */}
                  {[
                    ...giftCardTransactions.map(t => ({ ...t, category: 'gift-card' })),
                    ...membershipTransactions.map(t => ({ ...t, category: 'membership' }))
                  ]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 20)
                    .map((transaction) => (
                      <TableRow key={`${transaction.category}-${transaction.id}`}>
                        <TableCell>{format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.category === 'gift-card' ? 'Gift Card' : 'Membership'}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.clientName || 'N/A'}</TableCell>
                        <TableCell>
                          {transaction.category === 'gift-card' 
                            ? `${transaction.type} - ${(transaction as any).giftCardCode}`
                            : `${transaction.type} - ${(transaction as any).toTierName}`
                          }
                        </TableCell>
                        <TableCell>
                          <CurrencyDisplay amount={transaction.amount} />
                        </TableCell>
                        <TableCell>{transaction.staffName}</TableCell>
                      </TableRow>
                    ))}
                  {giftCardTransactions.length === 0 && membershipTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {hasPermission("manage_gift_card_settings") || hasPermission("manage_membership_settings") ? (
            <>
              <div>
                <h3 className="text-lg font-medium">Gift Cards & Memberships Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure gift card policies, membership tiers, and system settings
                </p>
              </div>

              <GiftCardMembershipSettings />
            </>
          ) : (
            <AccessDenied
              description="You don't have permission to manage gift card and membership settings."
              backButtonHref="/dashboard/gift-cards-memberships"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GiftCardIssueDialog
        open={isGiftCardDialogOpen}
        onOpenChange={setIsGiftCardDialogOpen}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Gift card issued successfully"
          })
        }}
      />

      <MembershipEnrollmentDialog
        open={isMembershipDialogOpen}
        onOpenChange={setIsMembershipDialogOpen}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Membership created successfully"
          })
        }}
      />

      <MembershipTierDialog
        open={isTierDialogOpen}
        onOpenChange={(open) => {
          setIsTierDialogOpen(open)
          if (!open) {
            setEditingTier(null)
          }
        }}
        tier={editingTier}
        onSave={handleSaveTier}
        existingTiers={membershipTiers}
      />
    </div>
  )
}
