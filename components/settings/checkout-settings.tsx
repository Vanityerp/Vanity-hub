"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { SettingsStorage, CheckoutSettings } from "@/lib/settings-storage"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { 
  CreditCard, 
  Truck, 
  Settings, 
  DollarSign, 
  Percent,
  ShoppingCart,
  Phone,
  CheckCircle
} from "lucide-react"

export function CheckoutSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState<CheckoutSettings>(SettingsStorage.getCheckoutSettings())

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = SettingsStorage.getCheckoutSettings()
    setSettings(loadedSettings)
  }, [])

  const handleChange = (field: keyof CheckoutSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: keyof CheckoutSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent] as any,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate tax rate
      if (settings.taxRate < 0 || settings.taxRate > 100) {
        throw new Error("Tax rate must be between 0 and 100")
      }

      // Validate shipping amount
      if (settings.shippingAmount < 0) {
        throw new Error("Shipping amount cannot be negative")
      }

      // Validate free shipping threshold
      if (settings.freeShippingThreshold < 0) {
        throw new Error("Free shipping threshold cannot be negative")
      }

      // Save settings
      SettingsStorage.saveCheckoutSettings(settings)

      toast({
        title: "Settings saved",
        description: "Checkout settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred while saving settings.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tax Configuration
          </CardTitle>
          <CardDescription>
            Configure tax rates applied to all orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <div className="relative">
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                Current rate: {settings.taxRate}% - Applied to subtotal after discounts
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tax Preview</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span><CurrencyDisplay amount={100} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({settings.taxRate}%):</span>
                    <span><CurrencyDisplay amount={100 * (settings.taxRate / 100)} /></span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span><CurrencyDisplay amount={100 + (100 * (settings.taxRate / 100))} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Configuration
          </CardTitle>
          <CardDescription>
            Configure shipping fees and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingType">Shipping Type</Label>
              <Select
                value={settings.shippingType}
                onValueChange={(value: 'free' | 'flat' | 'percentage') => handleChange('shippingType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Shipping</SelectItem>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="percentage">Percentage of Subtotal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.shippingType !== 'free' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAmount">
                    {settings.shippingType === 'flat' ? 'Shipping Fee' : 'Shipping Percentage (%)'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="shippingAmount"
                      type="number"
                      min="0"
                      step={settings.shippingType === 'flat' ? "0.01" : "0.1"}
                      value={settings.shippingAmount}
                      onChange={(e) => handleChange('shippingAmount', parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    {settings.shippingType === 'flat' ? (
                      <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    ) : (
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
              <div className="relative">
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => handleChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                  className="pr-8"
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                Orders above this amount qualify for free shipping
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Enable or disable payment methods for customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Credit/Debit Cards</Label>
                <p className="text-sm text-muted-foreground">
                  Accept online payments via credit and debit cards
                </p>
              </div>
              <Switch
                checked={settings.paymentMethods.creditCard}
                onCheckedChange={(checked) => handleNestedChange('paymentMethods', 'creditCard', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cash on Delivery (COD)</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pay when the order is delivered
                </p>
              </div>
              <Switch
                checked={settings.paymentMethods.cod}
                onCheckedChange={(checked) => handleNestedChange('paymentMethods', 'cod', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Order Processing
          </CardTitle>
          <CardDescription>
            Configure order processing and validation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Require Phone for COD
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require phone number for Cash on Delivery orders
                </p>
              </div>
              <Switch
                checked={settings.orderProcessing.requirePhoneForCOD}
                onCheckedChange={(checked) => handleNestedChange('orderProcessing', 'requirePhoneForCOD', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  COD Confirmation Required
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require manual confirmation for COD orders
                </p>
              </div>
              <Switch
                checked={settings.orderProcessing.codConfirmationRequired}
                onCheckedChange={(checked) => handleNestedChange('orderProcessing', 'codConfirmationRequired', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Auto-Confirm Orders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm orders without manual review
                </p>
              </div>
              <Switch
                checked={settings.orderProcessing.autoConfirmOrders}
                onCheckedChange={(checked) => handleNestedChange('orderProcessing', 'autoConfirmOrders', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  )
}
