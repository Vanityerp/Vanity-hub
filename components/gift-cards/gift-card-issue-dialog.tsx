"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { useGiftCards } from "@/lib/gift-card-provider"
import { GiftCardType, GiftCardStatus } from "@/lib/gift-card-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Gift, Mail, User, Calendar, CreditCard } from "lucide-react"

interface GiftCardIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GiftCardIssueDialog({ open, onOpenChange, onSuccess }: GiftCardIssueDialogProps) {
  const { toast } = useToast()
  const { user, currentLocation } = useAuth()
  const { createGiftCard, settings } = useGiftCards()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: GiftCardType.DIGITAL,
    amount: "",
    customAmount: "",
    useCustomAmount: false,
    expirationMonths: settings?.defaultExpirationMonths || 12,
    noExpiration: false,
    issuedToName: "",
    issuedToEmail: "",
    purchaserName: "",
    purchaserEmail: "",
    purchaserPhone: "",
    message: "",
    paymentMethod: "credit_card"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const amount = formData.useCustomAmount 
        ? parseFloat(formData.customAmount)
        : parseFloat(formData.amount)

      if (!amount || amount < (settings?.minAmount || 10) || amount > (settings?.maxAmount || 1000)) {
        toast({
          title: "Invalid Amount",
          description: `Amount must be between ${settings?.minAmount || 10} and ${settings?.maxAmount || 1000}`,
          variant: "destructive"
        })
        return
      }

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
        issuedToName: formData.issuedToName || undefined,
        purchaserEmail: formData.purchaserEmail || undefined,
        purchaserPhone: formData.purchaserPhone || undefined,
        message: formData.message || undefined,
        location: currentLocation || "loc1"
      })

      toast({
        title: "Gift Card Issued",
        description: `Gift card ${giftCard.code} has been successfully issued.`
      })

      // Reset form
      setFormData({
        type: GiftCardType.DIGITAL,
        amount: "",
        customAmount: "",
        useCustomAmount: false,
        expirationMonths: settings?.defaultExpirationMonths || 12,
        noExpiration: false,
        issuedToName: "",
        issuedToEmail: "",
        purchaserName: "",
        purchaserEmail: "",
        purchaserPhone: "",
        message: "",
        paymentMethod: "credit_card"
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error issuing gift card:", error)
      toast({
        title: "Error",
        description: "Failed to issue gift card. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAmount = formData.useCustomAmount 
    ? parseFloat(formData.customAmount) || 0
    : parseFloat(formData.amount) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Issue Gift Card
          </DialogTitle>
          <DialogDescription>
            Create a new gift card for a customer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gift Card Type */}
          <div className="space-y-2">
            <Label>Gift Card Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as GiftCardType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GiftCardType.DIGITAL}>Digital</SelectItem>
                <SelectItem value={GiftCardType.PHYSICAL}>Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Selection */}
          <div className="space-y-4">
            <Label>Amount</Label>
            
            {/* Predefined Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {(settings?.predefinedAmounts || [25, 50, 100, 200, 500]).map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={formData.amount === amount.toString() && !formData.useCustomAmount ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    amount: amount.toString(), 
                    useCustomAmount: false 
                  }))}
                >
                  <CurrencyDisplay amount={amount} />
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            {(settings?.allowCustomAmounts ?? true) && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.useCustomAmount}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      useCustomAmount: checked,
                      amount: checked ? "" : prev.amount
                    }))}
                  />
                  <Label>Custom Amount</Label>
                </div>
                {formData.useCustomAmount && (
                  <Input
                    type="number"
                    min={settings?.minAmount || 10}
                    max={settings?.maxAmount || 1000}
                    step="0.01"
                    placeholder="Enter custom amount"
                    value={formData.customAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, customAmount: e.target.value }))}
                  />
                )}
              </div>
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-4">
            <Label>Expiration</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.noExpiration}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, noExpiration: checked }))}
                disabled={!(settings?.allowNoExpiration ?? false)}
              />
              <Label>No Expiration</Label>
            </div>
            {!formData.noExpiration && (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.expirationMonths}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    expirationMonths: parseInt(e.target.value) || settings?.defaultExpirationMonths || 12
                  }))}
                  className="w-20"
                />
                <Label>months from issue date</Label>
              </div>
            )}
          </div>

          {/* Recipient Information */}
          <div className="space-y-4">
            <Label>Recipient Information (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedToName">Recipient Name</Label>
                <Input
                  id="issuedToName"
                  value={formData.issuedToName}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuedToName: e.target.value }))}
                  placeholder="Enter recipient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuedToEmail">Recipient Email</Label>
                <Input
                  id="issuedToEmail"
                  type="email"
                  value={formData.issuedToEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuedToEmail: e.target.value }))}
                  placeholder="Enter recipient email"
                />
              </div>
            </div>
          </div>

          {/* Purchaser Information */}
          {(settings?.requirePurchaserInfo ?? true) && (
            <div className="space-y-4">
              <Label>Purchaser Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaserName">Purchaser Name *</Label>
                  <Input
                    id="purchaserName"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaserName: e.target.value }))}
                    placeholder="Enter purchaser name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaserEmail">Purchaser Email *</Label>
                  <Input
                    id="purchaserEmail"
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaserEmail: e.target.value }))}
                    placeholder="Enter purchaser email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaserPhone">Purchaser Phone</Label>
                <Input
                  id="purchaserPhone"
                  value={formData.purchaserPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaserPhone: e.target.value }))}
                  placeholder="Enter purchaser phone"
                />
              </div>
            </div>
          )}

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter a personal message for the gift card"
              rows={3}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {selectedAmount > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Gift Card Amount:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedAmount} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{formData.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiration:</span>
                    <span className="text-sm">
                      {formData.noExpiration 
                        ? "Never expires" 
                        : `${formData.expirationMonths} months`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || selectedAmount === 0}>
            {isLoading ? "Issuing..." : "Issue Gift Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
