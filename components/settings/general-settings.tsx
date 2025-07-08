"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { getAllCurrencies, popularCurrencyCodes, currencies } from "@/lib/currency-data"
import { detectUserCurrency, getUserCurrency } from "@/lib/geolocation"
import { useCurrency } from "@/lib/currency-provider"
import { SettingsStorage, GeneralSettings as GeneralSettingsType, LiveChatUtils } from "@/lib/settings-storage"
import { Loader2, MessageCircle } from "lucide-react"

export function GeneralSettings() {
  const { toast } = useToast()
  const { currencyCode, setCurrency } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null)
  const [formData, setFormData] = useState<GeneralSettingsType>(() => {
    const settings = SettingsStorage.getGeneralSettings()

    // Ensure live chat settings exist with defaults
    if (!settings.liveChat) {
      settings.liveChat = {
        enabled: true,
        serviceName: "Live Chat",
        serviceUrl: "",
        operatingHours: {
          startTime: "09:00",
          endTime: "18:00"
        },
        operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        timezone: settings.timezone || "Asia/Qatar"
      }
    }

    return settings
  })

  // Detect user's location and set currency on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsLoading(true)

        // Set a timeout to ensure we don't wait too long for geolocation
        const timeoutId = setTimeout(() => {
          console.warn('Geolocation detection timed out, using default currency')
          setDetectedCurrency(currencyCode || 'QAR')
          setIsLoading(false)
        }, 5000)

        // Try to detect the currency
        const detectedCurrencyCode = await detectUserCurrency()
        clearTimeout(timeoutId)

        setDetectedCurrency(detectedCurrencyCode)

        // Update the form data to match the current currency from context
        setFormData(prev => ({ ...prev, currency: currencyCode }))
      } catch (error) {
        console.error('Error detecting location:', error)
        // Ensure we have a fallback currency even if detection fails
        setDetectedCurrency(currencyCode || 'QAR')
      } finally {
        setIsLoading(false)
      }
    }

    detectLocation()
  }, [currencyCode])

  const handleChange = (field: string, value: string | boolean | any) => {
    setFormData((prev) => {
      // Special handling for liveChat field to ensure proper structure
      if (field === 'liveChat') {
        const currentLiveChat = prev.liveChat || {
          enabled: false,
          serviceName: "Live Chat",
          serviceUrl: "",
          operatingHours: {
            startTime: "09:00",
            endTime: "18:00"
          },
          operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          timezone: prev.timezone || "Asia/Qatar"
        }

        return { ...prev, [field]: { ...currentLiveChat, ...value } }
      }

      return { ...prev, [field]: value }
    })

    // If currency is changed, update it in the context
    if (field === 'currency' && typeof value === 'string') {
      setCurrency(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Save to localStorage via our settings storage service
      SettingsStorage.saveGeneralSettings(formData)

      // If currency was changed, make sure it's updated in the context
      if (formData.currency !== currencyCode) {
        setCurrency(formData.currency)
      }

      toast({
        title: "Settings saved",
        description: "Your business settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your salon's basic information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>Configure your salon's operational settings</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleChange("timezone", value)}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange("currency", value)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {detectedCurrency && (
                      <SelectGroup>
                        <SelectLabel>Detected Currency</SelectLabel>
                        <SelectItem key={`detected-${detectedCurrency}`} value={detectedCurrency}>
                          {currencies[detectedCurrency]?.code} - {currencies[detectedCurrency]?.name} ({currencies[detectedCurrency]?.symbol})
                          {detectedCurrency === "QAR" && " (Qatari Riyal)"}
                        </SelectItem>
                      </SelectGroup>
                    )}

                    <SelectGroup>
                      <SelectLabel>Popular Currencies</SelectLabel>
                      {popularCurrencyCodes
                        // Filter out the detected currency to avoid duplication
                        .filter(code => code !== detectedCurrency)
                        .map((code) => (
                          <SelectItem key={`popular-${code}`} value={code}>
                            {currencies[code]?.code} - {currencies[code]?.name} ({currencies[code]?.symbol})
                          </SelectItem>
                        ))
                      }
                    </SelectGroup>

                    <SelectGroup>
                      <SelectLabel>All Currencies</SelectLabel>
                      {getAllCurrencies()
                        // Filter out both popular currencies and the detected currency
                        .filter(currency => !popularCurrencyCodes.includes(currency.code) && currency.code !== detectedCurrency)
                        .map((currency) => (
                          <SelectItem key={`all-${currency.code}`} value={currency.code}>
                            {currency.code} - {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {detectedCurrency && (
                  <p className="text-xs text-muted-foreground">
                    We detected your location and set the default currency to {currencies[detectedCurrency]?.name}.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.taxRate}
                  onChange={(e) => handleChange("taxRate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableOnlineBooking">Enable Online Booking</Label>
                  <p className="text-sm text-muted-foreground">Allow clients to book appointments online</p>
                </div>
                <Switch
                  id="enableOnlineBooking"
                  checked={formData.enableOnlineBooking as boolean}
                  onCheckedChange={(checked) => handleChange("enableOnlineBooking", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireDeposit">Require Booking Deposit</Label>
                  <p className="text-sm text-muted-foreground">Require a deposit for online bookings</p>
                </div>
                <Switch
                  id="requireDeposit"
                  checked={formData.requireDeposit as boolean}
                  onCheckedChange={(checked) => handleChange("requireDeposit", checked)}
                />
              </div>

              {formData.requireDeposit && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="depositAmount">
                    Deposit Amount ({currencies[formData.currency]?.symbol || '$'})
                  </Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="0"
                    step={currencies[formData.currency]?.decimalDigits === 0 ? "1" : "0.01"}
                    value={formData.depositAmount}
                    onChange={(e) => handleChange("depositAmount", e.target.value)}
                    required={formData.requireDeposit as boolean}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={formData.cancellationPolicy}
                onChange={(e) => handleChange("cancellationPolicy", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Chat Configuration
            </CardTitle>
            <CardDescription>Configure live chat support for your client portal</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableLiveChat">Enable Live Chat</Label>
                <p className="text-sm text-muted-foreground">Show live chat option in client portal help sections</p>
              </div>
              <Switch
                id="enableLiveChat"
                checked={formData.liveChat?.enabled || false}
                onCheckedChange={(checked) => handleChange("liveChat", { ...formData.liveChat, enabled: checked })}
              />
            </div>

            {formData.liveChat?.enabled && (
              <div className="space-y-6 ml-6 border-l-2 border-gray-100 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liveChatServiceName">Service Name</Label>
                    <Input
                      id="liveChatServiceName"
                      value={formData.liveChat?.serviceName || ""}
                      onChange={(e) => handleChange("liveChat", {
                        ...formData.liveChat,
                        serviceName: e.target.value
                      })}
                      placeholder="Live Chat"
                    />
                    <p className="text-xs text-muted-foreground">
                      Display name for the chat service (e.g., "Live Chat", "Customer Support", "Help Desk")
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liveChatServiceUrl">Service URL (Optional)</Label>
                    <Input
                      id="liveChatServiceUrl"
                      value={formData.liveChat?.serviceUrl || ""}
                      onChange={(e) => handleChange("liveChat", {
                        ...formData.liveChat,
                        serviceUrl: e.target.value
                      })}
                      placeholder="https://your-chat-service.com/chat"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL to open when clients click on live chat (leave empty for display only)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Operating Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liveChatStartTime">Start Time</Label>
                      <Input
                        id="liveChatStartTime"
                        type="time"
                        value={formData.liveChat?.operatingHours?.startTime || "09:00"}
                        onChange={(e) => handleChange("liveChat", {
                          ...formData.liveChat,
                          operatingHours: {
                            ...formData.liveChat?.operatingHours,
                            startTime: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="liveChatEndTime">End Time</Label>
                      <Input
                        id="liveChatEndTime"
                        type="time"
                        value={formData.liveChat?.operatingHours?.endTime || "18:00"}
                        onChange={(e) => handleChange("liveChat", {
                          ...formData.liveChat,
                          operatingHours: {
                            ...formData.liveChat?.operatingHours,
                            endTime: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current preview: {LiveChatUtils.getLiveChatText(formData)}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Operating Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'monday', label: 'Monday' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' }
                    ].map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`liveChat-${day.key}`}
                          checked={formData.liveChat?.operatingDays?.includes(day.key) || false}
                          onCheckedChange={(checked) => {
                            const currentDays = formData.liveChat?.operatingDays || [];
                            const newDays = checked
                              ? [...currentDays, day.key]
                              : currentDays.filter(d => d !== day.key);
                            handleChange("liveChat", {
                              ...formData.liveChat,
                              operatingDays: newDays
                            });
                          }}
                        />
                        <Label htmlFor={`liveChat-${day.key}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}

