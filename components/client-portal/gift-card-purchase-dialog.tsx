"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useGiftCards } from "@/lib/gift-card-provider"
import { useAuth } from "@/lib/auth-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { GiftCardType, GiftCardStatus } from "@/lib/gift-card-types"
import { PaymentMethod } from "@/lib/transaction-types"
import { Gift, CreditCard, Smartphone, Banknote, Loader2 } from "lucide-react"

interface GiftCardPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GiftCardPurchaseDialog({ open, onOpenChange, onSuccess }: GiftCardPurchaseDialogProps) {
  const { toast } = useToast()
  const { createGiftCard, settings } = useGiftCards()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Debug: Log the predefined amounts when settings change
  console.log('🎁 Gift Card Purchase Dialog - Predefined amounts:', settings?.predefinedAmounts)

  const [formData, setFormData] = useState({
    type: GiftCardType.DIGITAL,
    amount: "",
    customAmount: "",
    useCustomAmount: false,
    expirationMonths: settings?.defaultExpirationMonths || 12,
    noExpiration: false,
    recipientName: "",
    recipientEmail: "",
    message: "",
    paymentMethod: PaymentMethod.CREDIT_CARD,
    purchaserName: user?.name || "",
    purchaserEmail: user?.email || "",
    purchaserPhone: user?.phone || ""
  })

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase gift cards",
        variant: "destructive"
      })
      return
    }

    const amount = formData.useCustomAmount 
      ? parseFloat(formData.customAmount) 
      : parseFloat(formData.amount)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select or enter a valid amount",
        variant: "destructive"
      })
      return
    }

    if (amount < (settings?.minAmount || 10) || amount > (settings?.maxAmount || 1000)) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ${settings?.minAmount || 10} and ${settings?.maxAmount || 1000}`,
        variant: "destructive"
      })
      return
    }

    if (formData.type === GiftCardType.DIGITAL && !formData.recipientEmail) {
      toast({
        title: "Recipient Email Required",
        description: "Please provide recipient email for digital gift cards",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const expirationDate = formData.noExpiration 
        ? undefined 
        : new Date(Date.now() + (formData.expirationMonths * 30 * 24 * 60 * 60 * 1000))

      const giftCard = await createGiftCard({
        type: formData.type,
        originalAmount: amount,
        currentBalance: amount,
        status: GiftCardStatus.ACTIVE,
        issuedDate: new Date(),
        expirationDate,
        issuedBy: user.id,
        issuedByName: user.name,
        issuedTo: user.id, // Client is purchasing for themselves or as a gift
        issuedToName: formData.recipientName || user.name,
        purchaserEmail: formData.purchaserEmail,
        purchaserPhone: formData.purchaserPhone,
        message: formData.message || undefined,
        location: "online" // Client portal purchases are online
      })

      toast({
        title: "Gift Card Purchased Successfully!",
        description: `Gift card ${giftCard.code} has been created. ${
          formData.type === GiftCardType.DIGITAL 
            ? "Digital gift card will be sent to the recipient's email." 
            : "Physical gift card will be prepared for pickup."
        }`
      })

      // Reset form
      setFormData({
        type: GiftCardType.DIGITAL,
        amount: "",
        customAmount: "",
        useCustomAmount: false,
        expirationMonths: settings?.defaultExpirationMonths || 12,
        noExpiration: false,
        recipientName: "",
        recipientEmail: "",
        message: "",
        paymentMethod: PaymentMethod.CREDIT_CARD,
        purchaserName: user?.name || "",
        purchaserEmail: user?.email || "",
        purchaserPhone: user?.phone || ""
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error purchasing gift card:", error)
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase gift card. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAmount = formData.useCustomAmount 
    ? parseFloat(formData.customAmount) || 0
    : parseFloat(formData.amount) || 0

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return <CreditCard className="h-4 w-4" />
      case PaymentMethod.MOBILE_PAYMENT:
        return <Smartphone className="h-4 w-4" />
      case PaymentMethod.CASH:
        return <Banknote className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Purchase Gift Card
          </DialogTitle>
          <DialogDescription>
            Give the perfect gift with our salon gift cards
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gift Card Type */}
          <div className="space-y-3">
            <Label>Gift Card Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as GiftCardType }))}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={GiftCardType.DIGITAL} id="digital" />
                <Label htmlFor="digital" className="flex-1 cursor-pointer">
                  <Card className="p-3">
                    <div className="text-sm font-medium">Digital Gift Card</div>
                    <div className="text-xs text-muted-foreground">Sent via email instantly</div>
                  </Card>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={GiftCardType.PHYSICAL} id="physical" />
                <Label htmlFor="physical" className="flex-1 cursor-pointer">
                  <Card className="p-3">
                    <div className="text-sm font-medium">Physical Gift Card</div>
                    <div className="text-xs text-muted-foreground">Pick up at salon</div>
                  </Card>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label>Gift Card Amount</Label>
            
            {/* Predefined Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {(settings?.predefinedAmounts || [50, 100, 200, 500, 1000]).map((amount) => (
                <Button
                  key={amount}
                  variant={formData.amount === amount.toString() && !formData.useCustomAmount ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    amount: amount.toString(), 
                    useCustomAmount: false 
                  }))}
                  className="h-12"
                >
                  <CurrencyDisplay amount={amount} />
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            {(settings?.allowCustomAmounts ?? true) && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customAmount"
                    checked={formData.useCustomAmount}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      useCustomAmount: checked as boolean,
                      amount: checked ? "" : prev.amount
                    }))}
                  />
                  <Label htmlFor="customAmount">Custom Amount</Label>
                </div>
                {formData.useCustomAmount && (
                  <Input
                    type="number"
                    min={settings?.minAmount || 10}
                    max={settings?.maxAmount || 1000}
                    placeholder="Enter custom amount"
                    value={formData.customAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, customAmount: e.target.value }))}
                  />
                )}
              </div>
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-3">
            <Label>Expiration</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noExpiration"
                  checked={formData.noExpiration}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, noExpiration: checked as boolean }))}
                  disabled={!(settings?.allowNoExpiration ?? false)}
                />
                <Label htmlFor="noExpiration">No Expiration Date</Label>
              </div>
              {!formData.noExpiration && (
                <Select
                  value={formData.expirationMonths.toString()}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    expirationMonths: parseInt(value) || settings?.defaultExpirationMonths || 12
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-3">
            <Label>Recipient Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  placeholder="Enter recipient's name"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                />
              </div>
              {formData.type === GiftCardType.DIGITAL && (
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="Enter recipient's email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-3">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the gift card..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PaymentMethod.CREDIT_CARD} id="credit_card" />
                <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                  {getPaymentMethodIcon(PaymentMethod.CREDIT_CARD)}
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PaymentMethod.MOBILE_PAYMENT} id="mobile_payment" />
                <Label htmlFor="mobile_payment" className="flex items-center gap-2 cursor-pointer">
                  {getPaymentMethodIcon(PaymentMethod.MOBILE_PAYMENT)}
                  Mobile Payment (Apple Pay, Google Pay)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Order Summary */}
          {selectedAmount > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Gift Card Amount:</span>
                  <span className="font-medium">
                    <CurrencyDisplay amount={selectedAmount} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>
                    <CurrencyDisplay amount={selectedAmount} />
                  </span>
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
              disabled={isLoading || selectedAmount <= 0}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  Purchase Gift Card
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
