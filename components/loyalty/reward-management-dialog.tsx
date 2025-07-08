"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { LoyaltyReward } from "@/lib/types/loyalty"
import { rewardCategories, loyaltyTiers } from "@/lib/loyalty-management-data"
import { useCurrency } from "@/lib/currency-provider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface RewardManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reward?: LoyaltyReward | null
  onSave: (reward: LoyaltyReward) => Promise<void>
}

export function RewardManagementDialog({
  open,
  onOpenChange,
  reward,
  onSave
}: RewardManagementDialogProps) {
  const { toast } = useToast()
  const { currency, formatCurrency } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expiryDate, setExpiryDate] = useState<Date>()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointsCost: "",
    value: "",
    category: "",
    type: "discount" as "service" | "product" | "discount" | "experience",
    isActive: true,
    usageLimit: "",
    minTier: "",
    image: ""
  })

  // Reset form when dialog opens/closes or reward changes
  useEffect(() => {
    if (open) {
      if (reward) {
        // Edit mode
        setFormData({
          name: reward.name,
          description: reward.description,
          pointsCost: reward.pointsCost.toString(),
          value: reward.value?.toString() || "",
          category: reward.category,
          type: reward.type,
          isActive: reward.isActive,
          usageLimit: reward.usageLimit?.toString() || "",
          minTier: reward.minTier || "",
          image: reward.image || ""
        })
        setExpiryDate(new Date(reward.expiresAt))
      } else {
        // Create mode
        setFormData({
          name: "",
          description: "",
          pointsCost: "",
          value: "",
          category: "",
          type: "discount",
          isActive: true,
          usageLimit: "",
          minTier: "",
          image: ""
        })
        setExpiryDate(undefined)
      }
    }
  }, [open, reward])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.description.trim() || !formData.pointsCost || !formData.category || !expiryDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const rewardData: LoyaltyReward = {
        id: reward?.id || `r${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        pointsCost: parseInt(formData.pointsCost),
        value: formData.value ? parseFloat(formData.value) : undefined,
        category: formData.category,
        type: formData.type,
        isActive: formData.isActive,
        expiresAt: expiryDate.toISOString(),
        createdAt: reward?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        usageCount: reward?.usageCount || 0,
        minTier: formData.minTier || undefined,
        image: formData.image || undefined
      }

      // Call the async onSave function and wait for it to complete
      await onSave(rewardData)

      // Only close dialog if save was successful (no error thrown)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving reward:", error)
      // Error handling is now done in the parent component
      // Don't show toast here to avoid duplicate messages
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{reward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              {reward ? "Update the reward details below." : "Create a new reward for your loyalty program."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Reward Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., $25 off next service"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsCost">Points Cost *</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  value={formData.pointsCost}
                  onChange={(e) => handleInputChange("pointsCost", e.target.value)}
                  placeholder="500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Detailed description of the reward..."
                rows={3}
                required
              />
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardCategories.filter(cat => cat.isActive).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Value and Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Monetary Value ({currency.code})</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  placeholder="25.00"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  Enter the monetary value in {currency.code}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => handleInputChange("usageLimit", e.target.value)}
                  placeholder="1000"
                  min="1"
                />
              </div>
            </div>

            {/* Tier and Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTier">Minimum Tier</Label>
                <Select value={formData.minTier || "any"} onValueChange={(value) => handleInputChange("minTier", value === "any" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any tier</SelectItem>
                    {loyaltyTiers.filter(tier => tier.isActive).map((tier) => (
                      <SelectItem key={tier.id} value={tier.name}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiryDate ? format(expiryDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : reward ? "Update Reward" : "Create Reward"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
