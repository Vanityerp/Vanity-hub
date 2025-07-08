"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { SettingsStorage, GiftCardMembershipSettings } from "@/lib/settings-storage"
import { Gift, CreditCard, Users, Settings, Plus, X } from "lucide-react"

export function GiftCardMembershipSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<GiftCardMembershipSettings>(
    SettingsStorage.getGiftCardMembershipSettings()
  )
  const [newAmount, setNewAmount] = useState("")

  const handleSave = () => {
    try {
      SettingsStorage.saveGiftCardMembershipSettings(settings)
      toast({
        title: "Settings Saved",
        description: "Gift card and membership settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGiftCardChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      giftCards: {
        ...prev.giftCards,
        [key]: value
      }
    }))
  }

  const handleMembershipChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      memberships: {
        ...prev.memberships,
        [key]: value
      }
    }))
  }

  const handleEmailNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      memberships: {
        ...prev.memberships,
        emailNotifications: {
          ...prev.memberships.emailNotifications,
          [key]: value
        }
      }
    }))
  }

  const addPredefinedAmount = () => {
    const amount = parseFloat(newAmount)
    if (amount > 0 && !settings.giftCards.predefinedAmounts.includes(amount)) {
      handleGiftCardChange('predefinedAmounts', [...settings.giftCards.predefinedAmounts, amount].sort((a, b) => a - b))
      setNewAmount("")
    }
  }

  const removePredefinedAmount = (amount: number) => {
    handleGiftCardChange('predefinedAmounts', settings.giftCards.predefinedAmounts.filter(a => a !== amount))
  }

  return (
    <div className="space-y-6">
      {/* Gift Card Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift Card Settings
          </CardTitle>
          <CardDescription>
            Configure gift card options, denominations, and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Gift Cards */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Gift Cards</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to purchase and redeem gift cards
              </p>
            </div>
            <Switch
              checked={settings.giftCards.enabled}
              onCheckedChange={(checked) => handleGiftCardChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Amount Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Amount Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  min="1"
                  value={settings.giftCards.minAmount}
                  onChange={(e) => handleGiftCardChange('minAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Amount</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min="1"
                  value={settings.giftCards.maxAmount}
                  onChange={(e) => handleGiftCardChange('maxAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Custom Amounts</Label>
                <p className="text-sm text-muted-foreground">
                  Let customers enter custom gift card amounts
                </p>
              </div>
              <Switch
                checked={settings.giftCards.allowCustomAmounts}
                onCheckedChange={(checked) => handleGiftCardChange('allowCustomAmounts', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Predefined Amounts</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {settings.giftCards.predefinedAmounts.map((amount) => (
                  <Badge key={amount} variant="secondary" className="flex items-center gap-1">
                    <CurrencyDisplay amount={amount} />
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removePredefinedAmount(amount)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPredefinedAmount()}
                />
                <Button onClick={addPredefinedAmount} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Expiration Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Expiration Settings</h4>
            
            <div className="space-y-2">
              <Label htmlFor="expirationMonths">Default Expiration (Months)</Label>
              <Input
                id="expirationMonths"
                type="number"
                min="1"
                max="120"
                value={settings.giftCards.defaultExpirationMonths}
                onChange={(e) => handleGiftCardChange('defaultExpirationMonths', parseInt(e.target.value) || 12)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow No Expiration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow gift cards that never expire
                </p>
              </div>
              <Switch
                checked={settings.giftCards.allowNoExpiration}
                onCheckedChange={(checked) => handleGiftCardChange('allowNoExpiration', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Purchase Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Purchase Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Require Purchaser Information</Label>
                <p className="text-sm text-muted-foreground">
                  Collect purchaser email and phone number
                </p>
              </div>
              <Switch
                checked={settings.giftCards.requirePurchaserInfo}
                onCheckedChange={(checked) => handleGiftCardChange('requirePurchaserInfo', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Digital Delivery</Label>
                <p className="text-sm text-muted-foreground">
                  Send gift cards via email
                </p>
              </div>
              <Switch
                checked={settings.giftCards.allowDigitalDelivery}
                onCheckedChange={(checked) => handleGiftCardChange('allowDigitalDelivery', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Email Template */}
          <div className="space-y-2">
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Textarea
              id="emailTemplate"
              rows={8}
              value={settings.giftCards.emailTemplate}
              onChange={(e) => handleGiftCardChange('emailTemplate', e.target.value)}
              placeholder="Enter email template for gift card delivery..."
            />
            <p className="text-sm text-muted-foreground">
              Available variables: {'{customerName}'}, {'{giftCardCode}'}, {'{amount}'}, {'{expirationDate}'}, {'{message}'}, {'{businessName}'}
            </p>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <Label htmlFor="giftCardTerms">Terms and Conditions</Label>
            <Textarea
              id="giftCardTerms"
              rows={4}
              value={settings.giftCards.termsAndConditions}
              onChange={(e) => handleGiftCardChange('termsAndConditions', e.target.value)}
              placeholder="Enter gift card terms and conditions..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Membership Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membership Settings
          </CardTitle>
          <CardDescription>
            Configure membership options, renewal policies, and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Memberships */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Memberships</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to purchase and manage memberships
              </p>
            </div>
            <Switch
              checked={settings.memberships.enabled}
              onCheckedChange={(checked) => handleMembershipChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Renewal Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Renewal Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Auto-Renewal</Label>
                <p className="text-sm text-muted-foreground">
                  Enable automatic membership renewals
                </p>
              </div>
              <Switch
                checked={settings.memberships.allowAutoRenewal}
                onCheckedChange={(checked) => handleMembershipChange('allowAutoRenewal', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="autoRenewalDays">Auto-Renewal Notice (Days)</Label>
                <Input
                  id="autoRenewalDays"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.memberships.autoRenewalDaysBefore}
                  onChange={(e) => handleMembershipChange('autoRenewalDaysBefore', parseInt(e.target.value) || 7)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  min="0"
                  max="30"
                  value={settings.memberships.gracePeriodDays}
                  onChange={(e) => handleMembershipChange('gracePeriodDays', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Policy Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Policy Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Proration</Label>
                <p className="text-sm text-muted-foreground">
                  Prorate charges for mid-cycle changes
                </p>
              </div>
              <Switch
                checked={settings.memberships.prorationEnabled}
                onCheckedChange={(checked) => handleMembershipChange('prorationEnabled', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upgradePolicy">Upgrade Policy</Label>
                <Select
                  value={settings.memberships.upgradePolicy}
                  onValueChange={(value) => handleMembershipChange('upgradePolicy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="next_cycle">Next Cycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="downgradePolicy">Downgrade Policy</Label>
                <Select
                  value={settings.memberships.downgradePolicy}
                  onValueChange={(value) => handleMembershipChange('downgradePolicy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="next_cycle">Next Cycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Select
                value={settings.memberships.cancellationPolicy}
                onValueChange={(value) => handleMembershipChange('cancellationPolicy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="end_of_cycle">End of Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Email Notifications</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Welcome Email</Label>
                <Switch
                  checked={settings.memberships.emailNotifications.welcome}
                  onCheckedChange={(checked) => handleEmailNotificationChange('welcome', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Renewal Reminder</Label>
                <Switch
                  checked={settings.memberships.emailNotifications.renewal}
                  onCheckedChange={(checked) => handleEmailNotificationChange('renewal', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Expiration Notice</Label>
                <Switch
                  checked={settings.memberships.emailNotifications.expiration}
                  onCheckedChange={(checked) => handleEmailNotificationChange('expiration', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Cancellation Confirmation</Label>
                <Switch
                  checked={settings.memberships.emailNotifications.cancellation}
                  onCheckedChange={(checked) => handleEmailNotificationChange('cancellation', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Policies */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refundPolicy">Refund Policy</Label>
              <Textarea
                id="refundPolicy"
                rows={3}
                value={settings.memberships.refundPolicy}
                onChange={(e) => handleMembershipChange('refundPolicy', e.target.value)}
                placeholder="Enter membership refund policy..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipTerms">Terms and Conditions</Label>
              <Textarea
                id="membershipTerms"
                rows={4}
                value={settings.memberships.termsAndConditions}
                onChange={(e) => handleMembershipChange('termsAndConditions', e.target.value)}
                placeholder="Enter membership terms and conditions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="w-32">
          <Settings className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
