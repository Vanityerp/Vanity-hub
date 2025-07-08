"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { useMemberships } from "@/lib/membership-provider"
import { useClients } from "@/lib/client-provider"
import { MembershipStatus, getDurationInDays } from "@/lib/membership-types"
import { PaymentMethod } from "@/lib/transaction-types"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Users, Search, Calendar, CreditCard, Star } from "lucide-react"

interface MembershipEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: string
  onSuccess?: () => void
}

export function MembershipEnrollmentDialog({ 
  open, 
  onOpenChange, 
  clientId,
  onSuccess 
}: MembershipEnrollmentDialogProps) {
  const { toast } = useToast()
  const { user, currentLocation } = useAuth()
  const { createMembership, membershipTiers } = useMemberships()
  const { clients } = useClients()
  
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(clientId || "")
  const [selectedTierId, setSelectedTierId] = useState("")
  const [autoRenew, setAutoRenew] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD)
  const [clientSearch, setClientSearch] = useState("")

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedTier = membershipTiers.find(t => t.id === selectedTierId)
  const activeTiers = membershipTiers.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedClient || !selectedTier) return

    setIsLoading(true)
    try {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + (getDurationInDays(selectedTier.duration) * 24 * 60 * 60 * 1000))

      const membership = await createMembership({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        status: MembershipStatus.ACTIVE,
        startDate,
        endDate,
        autoRenew,
        price: selectedTier.price,
        discountPercentage: selectedTier.discountPercentage,
        usedFreeServices: 0,
        totalFreeServices: selectedTier.freeServices,
        location: currentLocation || "loc1"
      })

      toast({
        title: "Membership Created",
        description: `${selectedTier.name} membership has been created for ${selectedClient.name}.`
      })

      // Reset form
      setSelectedClientId("")
      setSelectedTierId("")
      setAutoRenew(true)
      setPaymentMethod(PaymentMethod.CREDIT_CARD)
      setClientSearch("")

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating membership:", error)
      toast({
        title: "Error",
        description: "Failed to create membership. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Membership
          </DialogTitle>
          <DialogDescription>
            Enroll a client in a membership program
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          {!clientId && (
            <div className="space-y-4">
              <Label>Select Client</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span>{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.email} • {client.phone}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Selected Client Info */}
          {selectedClient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selected Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.email} • {selectedClient.phone}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {selectedClient.totalVisits || 0} visits
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Membership Tier Selection */}
          <div className="space-y-4">
            <Label>Select Membership Tier</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTierId === tier.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedTierId(tier.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span className="text-sm font-medium">{tier.discountPercentage}%</span>
                      </div>
                    </div>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={tier.price} />/{tier.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Free Services</span>
                      <span className="font-medium">{tier.freeServices}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Benefits</span>
                      <ul className="text-xs space-y-1">
                        {tier.benefits.slice(0, 3).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-current rounded-full" />
                            {benefit}
                          </li>
                        ))}
                        {tier.benefits.length > 3 && (
                          <li className="text-muted-foreground">
                            +{tier.benefits.length - 3} more benefits
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Membership Options */}
          {selectedTier && (
            <div className="space-y-4">
              <Label>Membership Options</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                />
                <Label>Enable Auto-Renewal</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, the membership will automatically renew at the end of each billing cycle.
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                <SelectItem value={PaymentMethod.MOBILE_PAYMENT}>Mobile Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Membership Summary */}
          {selectedClient && selectedTier && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Membership Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-medium">{selectedClient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tier:</span>
                  <span className="font-medium">{selectedTier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{selectedTier.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">
                    <CurrencyDisplay amount={selectedTier.price} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-medium">{selectedTier.discountPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Services:</span>
                  <span className="font-medium">{selectedTier.freeServices}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Renewal:</span>
                  <Badge variant={autoRenew ? "default" : "secondary"}>
                    {autoRenew ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Due:</span>
                    <span>
                      <CurrencyDisplay amount={selectedTier.price} />
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
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !selectedClient || !selectedTier}
          >
            {isLoading ? "Creating..." : "Create Membership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
