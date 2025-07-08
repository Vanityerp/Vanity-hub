"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useMemberships } from "@/lib/membership-provider"
import { useAuth } from "@/lib/auth-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import {
  Users,
  Star,
  Calendar,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Zap
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { MembershipStatus as Status, isMembershipActive, isMembershipExpiringSoon } from "@/lib/membership-types"
import { MembershipPlanSelectionDialog } from "./membership-plan-selection-dialog"

interface MembershipStatusProps {
  clientId?: string
}

export function MembershipStatus({ clientId }: MembershipStatusProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    memberships,
    membershipTiers,
    membershipTransactions,
    getActiveMembership,
    checkMembershipBenefits
  } = useMemberships()

  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [selectedTierForDialog, setSelectedTierForDialog] = useState<string | undefined>(undefined)

  const currentClientId = clientId || user?.id
  const activeMembership = currentClientId ? getActiveMembership(currentClientId) : null
  const membershipBenefits = currentClientId ? checkMembershipBenefits(currentClientId) : { hasActiveMembership: false }
  
  const clientMemberships = currentClientId 
    ? memberships.filter(m => m.clientId === currentClientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  const clientTransactions = currentClientId
    ? membershipTransactions.filter(t => t.clientId === currentClientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  if (!currentClientId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p>Please log in to view your membership status</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!membershipBenefits.hasActiveMembership) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membership Status
            </CardTitle>
            <CardDescription>
              Join our membership program for exclusive benefits and savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Membership</h3>
              <p className="text-muted-foreground mb-6">
                Unlock exclusive benefits, discounts, and priority booking with our membership program
              </p>
              <Button
                onClick={() => {
                  setSelectedTierForDialog(undefined)
                  setShowPlanDialog(true)
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Star className="mr-2 h-4 w-4" />
                Explore Membership Plans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Membership Tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Membership Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membershipTiers
                .filter(tier => tier.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((tier) => (
                  <Card key={tier.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <Badge variant="outline">{tier.discountPercentage}% OFF</Badge>
                      </div>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          <CurrencyDisplay amount={tier.price} />
                        </div>
                        <div className="text-sm text-muted-foreground">per {tier.duration}</div>
                      </div>
                      <ul className="space-y-1 text-sm">
                        {tier.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        size="sm"
                        onClick={() => {
                          setSelectedTierForDialog(tier.id)
                          setShowPlanDialog(true)
                        }}
                      >
                        Choose Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Membership History */}
        {clientMemberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membership History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientMemberships.slice(0, 5).map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">{membership.tierName}</TableCell>
                      <TableCell>
                        {format(new Date(membership.startDate), 'MMM d, yyyy')} - {format(new Date(membership.endDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            membership.status === Status.ACTIVE ? "default" :
                            membership.status === Status.EXPIRED ? "secondary" :
                            "destructive"
                          }
                        >
                          {membership.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CurrencyDisplay amount={membership.price} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection Dialog */}
        <MembershipPlanSelectionDialog
          open={showPlanDialog}
          onOpenChange={(open) => {
            setShowPlanDialog(open)
            if (!open) {
              setSelectedTierForDialog(undefined)
            }
          }}
          currentMembership={activeMembership}
          preSelectedTierId={selectedTierForDialog}
          onSuccess={() => {
            toast({
              title: "Membership Updated!",
              description: "Your membership has been successfully updated."
            })
            setSelectedTierForDialog(undefined)
          }}
        />
      </div>
    )
  }

  const tier = membershipBenefits.tier!
  const membership = membershipBenefits.membership!
  const daysUntilExpiry = differenceInDays(new Date(membership.endDate), new Date())
  const isExpiringSoon = isMembershipExpiringSoon(membership)
  const usagePercentage = (membership.usedFreeServices / membership.totalFreeServices) * 100

  return (
    <div className="space-y-6">
      {/* Active Membership Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                {tier.name} Member
              </CardTitle>
              <CardDescription>
                Active membership with exclusive benefits
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-purple-600">
              {tier.discountPercentage}% Discount
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {membership.totalFreeServices - membership.usedFreeServices}
              </div>
              <div className="text-xs text-muted-foreground">Free Services Left</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tier.discountPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Discount Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {daysUntilExpiry}
              </div>
              <div className="text-xs text-muted-foreground">Days Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                <CurrencyDisplay amount={membership.price} />
              </div>
              <div className="text-xs text-muted-foreground">Monthly Fee</div>
            </div>
          </div>

          {/* Free Services Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Free Services Used</span>
              <span>{membership.usedFreeServices} of {membership.totalFreeServices}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {/* Expiration Warning */}
          {isExpiringSoon && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div className="text-sm">
                <span className="font-medium text-orange-800">Membership expires soon!</span>
                <span className="text-orange-600 ml-1">
                  Expires on {format(new Date(membership.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Auto-Renewal Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Auto-Renewal</span>
            </div>
            <Badge variant={membership.autoRenew ? "default" : "secondary"}>
              {membership.autoRenew ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Membership Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Your Membership Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-3">Included Benefits</h4>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Membership Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span>{format(new Date(membership.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renewal Date:</span>
                  <span>{format(new Date(membership.endDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Fee:</span>
                  <span><CurrencyDisplay amount={membership.price} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority Booking:</span>
                  <span>{tier.priorityBooking ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Membership Activity */}
      {clientTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientTransactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.toTierName}</TableCell>
                    <TableCell>
                      <CurrencyDisplay amount={transaction.amount} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Membership Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Your Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Update Auto-Renewal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTierForDialog(undefined)
                setShowPlanDialog(true)
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
            <Button variant="outline" size="sm">
              <Gift className="mr-2 h-4 w-4" />
              View Benefits
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
