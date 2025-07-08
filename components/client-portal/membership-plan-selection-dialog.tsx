"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useMemberships } from "@/lib/membership-provider"
import { useAuth } from "@/lib/auth-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { MembershipStatus, MembershipDuration } from "@/lib/membership-types"
import { PaymentMethod } from "@/lib/transaction-types"
import { 
  Users, 
  Star, 
  CheckCircle, 
  CreditCard, 
  Smartphone, 
  Calendar,
  Gift,
  Loader2,
  Crown,
  Zap
} from "lucide-react"

interface MembershipPlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  currentMembership?: any // Current membership if upgrading
  preSelectedTierId?: string // Pre-select a specific tier
}

export function MembershipPlanSelectionDialog({
  open,
  onOpenChange,
  onSuccess,
  currentMembership,
  preSelectedTierId
}: MembershipPlanSelectionDialogProps) {
  const { toast } = useToast()
  const { createMembership, membershipTiers } = useMemberships()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    selectedTierId: preSelectedTierId || "",
    autoRenew: true,
    paymentMethod: PaymentMethod.CREDIT_CARD
  })

  const availableTiers = membershipTiers
    .filter(tier => tier.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const selectedTier = availableTiers.find(tier => tier.id === formData.selectedTierId)

  // Update selected tier when preSelectedTierId changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        selectedTierId: preSelectedTierId || ""
      }))
    }
  }, [preSelectedTierId, open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        selectedTierId: "",
        autoRenew: true,
        paymentMethod: PaymentMethod.CREDIT_CARD
      })
    }
  }, [open])

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase membership",
        variant: "destructive"
      })
      return
    }

    if (!selectedTier) {
      toast({
        title: "Plan Selection Required",
        description: "Please select a membership plan",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const startDate = new Date()
      const endDate = new Date()
      
      // Calculate end date based on duration
      switch (selectedTier.duration) {
        case MembershipDuration.MONTHLY:
          endDate.setMonth(endDate.getMonth() + 1)
          break
        case MembershipDuration.QUARTERLY:
          endDate.setMonth(endDate.getMonth() + 3)
          break
        case MembershipDuration.SEMI_ANNUAL:
          endDate.setMonth(endDate.getMonth() + 6)
          break
        case MembershipDuration.ANNUAL:
          endDate.setFullYear(endDate.getFullYear() + 1)
          break
      }

      const membership = await createMembership({
        clientId: user.id,
        clientName: user.name,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        status: MembershipStatus.ACTIVE,
        startDate,
        endDate,
        autoRenew: formData.autoRenew,
        price: selectedTier.price,
        discountPercentage: selectedTier.discountPercentage,
        usedFreeServices: 0,
        totalFreeServices: selectedTier.freeServices,
        location: "online" // Client portal enrollments are online
      })

      toast({
        title: "Membership Activated!",
        description: `Welcome to ${selectedTier.name}! Your membership is now active and you can start enjoying your benefits.`,
      })

      // Reset form
      setFormData({
        selectedTierId: preSelectedTierId || "",
        autoRenew: true,
        paymentMethod: PaymentMethod.CREDIT_CARD
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating membership:", error)
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in membership. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTierIcon = (tierName: string) => {
    const name = tierName.toLowerCase()
    if (name.includes('gold') || name.includes('premium')) return <Crown className="h-5 w-5" />
    if (name.includes('silver')) return <Star className="h-5 w-5" />
    return <Users className="h-5 w-5" />
  }

  const getTierColor = (tierName: string) => {
    const name = tierName.toLowerCase()
    if (name.includes('gold') || name.includes('premium')) return 'from-yellow-400 to-orange-500'
    if (name.includes('silver')) return 'from-gray-300 to-gray-500'
    return 'from-orange-400 to-red-500'
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return <CreditCard className="h-4 w-4" />
      case PaymentMethod.MOBILE_PAYMENT:
        return <Smartphone className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentMembership ? "Upgrade Membership" : "Choose Your Membership Plan"}
          </DialogTitle>
          <DialogDescription>
            {currentMembership 
              ? "Upgrade to a higher tier for more benefits and savings"
              : "Select a membership plan that fits your needs and start saving today"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Membership Tiers */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Available Plans</Label>
            <RadioGroup
              value={formData.selectedTierId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, selectedTierId: value }))}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {availableTiers.map((tier) => (
                <div key={tier.id} className="flex items-start space-x-2">
                  <RadioGroupItem value={tier.id} id={tier.id} className="mt-4" />
                  <Label htmlFor={tier.id} className="flex-1 cursor-pointer">
                    <Card className={`relative transition-all hover:shadow-lg ${
                      formData.selectedTierId === tier.id 
                        ? 'ring-2 ring-purple-500 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}>
                      {tier.name.toLowerCase().includes('gold') && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-full bg-gradient-to-r ${getTierColor(tier.name)} text-white`}>
                              {getTierIcon(tier.name)}
                            </div>
                            <CardTitle className="text-lg">{tier.name}</CardTitle>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {tier.discountPercentage}% OFF
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">{tier.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            <CurrencyDisplay amount={tier.price} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            per {tier.duration.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Benefits Include:</h4>
                          <ul className="space-y-1">
                            {tier.benefits.slice(0, 4).map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <span className="text-muted-foreground">{benefit}</span>
                              </li>
                            ))}
                            {tier.benefits.length > 4 && (
                              <li className="text-xs text-muted-foreground">
                                +{tier.benefits.length - 4} more benefits
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium">{tier.freeServices}</div>
                            <div className="text-muted-foreground">Free Services</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-medium">{tier.priorityBooking ? 'Yes' : 'No'}</div>
                            <div className="text-muted-foreground">Priority Booking</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Auto-Renewal */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Renewal Settings</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoRenew"
                checked={formData.autoRenew}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRenew: checked as boolean }))}
              />
              <Label htmlFor="autoRenew" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Enable automatic renewal
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Your membership will automatically renew before expiration. You can cancel anytime.
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Payment Method</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PaymentMethod.CREDIT_CARD} id="membership_credit_card" />
                <Label htmlFor="membership_credit_card" className="flex items-center gap-2 cursor-pointer">
                  {getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)}
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PaymentMethod.MOBILE_PAYMENT} id="membership_mobile_payment" />
                <Label htmlFor="membership_mobile_payment" className="flex items-center gap-2 cursor-pointer">
                  {getPaymentMethodIcon(PaymentMethod.MOBILE_PAYMENT)}
                  Mobile Payment (Apple Pay, Google Pay)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Selected Plan Summary */}
          {selectedTier && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Your Selected Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${getTierColor(selectedTier.name)} text-white`}>
                      {getTierIcon(selectedTier.name)}
                    </div>
                    <div>
                      <div className="font-medium">{selectedTier.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedTier.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      <CurrencyDisplay amount={selectedTier.price} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {selectedTier.duration.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-bold text-green-600">{selectedTier.discountPercentage}%</div>
                    <div className="text-muted-foreground">Discount</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-bold text-blue-600">{selectedTier.freeServices}</div>
                    <div className="text-muted-foreground">Free Services</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-bold text-purple-600">{selectedTier.priorityBooking ? 'Yes' : 'No'}</div>
                    <div className="text-muted-foreground">Priority Booking</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="font-bold text-orange-600">{formData.autoRenew ? 'Yes' : 'No'}</div>
                    <div className="text-muted-foreground">Auto-Renewal</div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Today:</span>
                    <span className="text-xl font-bold">
                      <CurrencyDisplay amount={selectedTier.price} />
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.autoRenew && `Next billing: ${selectedTier.duration.replace('_', ' ')} from today`}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !selectedTier}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {currentMembership ? "Upgrade Plan" : "Start Membership"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
