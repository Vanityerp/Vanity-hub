"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { MembershipTier, MembershipDuration } from "@/lib/membership-types"
import { Plus, X, Star, Crown, Gem, Diamond, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface MembershipTierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier?: MembershipTier | null
  onSave: (tier: Omit<MembershipTier, 'id' | 'createdAt' | 'updatedAt'>) => void
  existingTiers: MembershipTier[]
}

export function MembershipTierDialog({ 
  open, 
  onOpenChange, 
  tier, 
  onSave,
  existingTiers
}: MembershipTierDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [benefits, setBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState("")
  const [includedServices, setIncludedServices] = useState<string[]>([])
  const [newService, setNewService] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: MembershipDuration.MONTHLY,
    discountPercentage: "",
    maxDiscountAmount: "",
    priorityBooking: true,
    freeServices: "",
    isActive: true,
    sortOrder: ""
  })

  const durationOptions = [
    { value: MembershipDuration.MONTHLY, label: "Monthly" },
    { value: MembershipDuration.QUARTERLY, label: "Quarterly" },
    { value: MembershipDuration.SEMI_ANNUAL, label: "Semi-Annual" },
    { value: MembershipDuration.ANNUAL, label: "Annual" }
  ]

  // Reset form when dialog opens/closes or tier changes
  useEffect(() => {
    if (open) {
      if (tier) {
        // Edit mode
        setFormData({
          name: tier.name,
          description: tier.description,
          price: tier.price.toString(),
          duration: tier.duration,
          discountPercentage: tier.discountPercentage.toString(),
          maxDiscountAmount: tier.maxDiscountAmount?.toString() || "",
          priorityBooking: tier.priorityBooking,
          freeServices: tier.freeServices.toString(),
          isActive: tier.isActive,
          sortOrder: tier.sortOrder.toString()
        })
        setBenefits([...tier.benefits])
        setIncludedServices([...tier.includedServices])
      } else {
        // Create mode
        const nextSortOrder = Math.max(...existingTiers.map(t => t.sortOrder), 0) + 1
        setFormData({
          name: "",
          description: "",
          price: "",
          duration: MembershipDuration.MONTHLY,
          discountPercentage: "5",
          maxDiscountAmount: "",
          priorityBooking: true,
          freeServices: "0",
          isActive: true,
          sortOrder: nextSortOrder.toString()
        })
        setBenefits([])
        setIncludedServices([])
      }
      setNewBenefit("")
      setNewService("")
    }
  }, [open, tier, existingTiers])

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit("")
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const addService = () => {
    if (newService.trim() && !includedServices.includes(newService.trim())) {
      setIncludedServices([...includedServices, newService.trim()])
      setNewService("")
    }
  }

  const removeService = (index: number) => {
    setIncludedServices(includedServices.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push("Tier name is required")
    }

    if (!formData.description.trim()) {
      errors.push("Description is required")
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      errors.push("Valid price is required")
    }

    const discountPercentage = parseFloat(formData.discountPercentage)
    if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      errors.push("Discount percentage must be between 0 and 100")
    }

    if (formData.maxDiscountAmount && (isNaN(parseFloat(formData.maxDiscountAmount)) || parseFloat(formData.maxDiscountAmount) < 0)) {
      errors.push("Max discount amount must be a valid positive number")
    }

    const freeServices = parseInt(formData.freeServices)
    if (isNaN(freeServices) || freeServices < 0) {
      errors.push("Free services must be a valid non-negative number")
    }

    const sortOrder = parseInt(formData.sortOrder)
    if (isNaN(sortOrder) || sortOrder < 0) {
      errors.push("Sort order must be a valid non-negative number")
    }

    // Check for duplicate names (excluding current tier if editing)
    const duplicateName = existingTiers.find(t => 
      t.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      (!tier || t.id !== tier.id)
    )
    if (duplicateName) {
      errors.push("A tier with this name already exists")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors.join(", ")
      })
      return
    }

    setIsSubmitting(true)

    try {
      const tierData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: formData.duration,
        benefits: [...benefits],
        discountPercentage: parseFloat(formData.discountPercentage),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        includedServices: [...includedServices],
        priorityBooking: formData.priorityBooking,
        freeServices: parseInt(formData.freeServices),
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder)
      }

      onSave(tierData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving tier:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save tier. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tier ? "Edit Membership Tier" : "Create New Membership Tier"}</DialogTitle>
            <DialogDescription>
              {tier ? "Update the membership tier details below." : "Create a new membership tier with pricing, benefits, and settings."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Bronze, Silver, Gold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order *</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange("sortOrder", e.target.value)}
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
                placeholder="Describe this membership tier..."
                rows={3}
                required
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="29.99"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleInputChange("duration", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount Percentage *</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
                  placeholder="5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">Max Discount Amount</Label>
                <Input
                  id="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => handleInputChange("maxDiscountAmount", e.target.value)}
                  placeholder="Optional maximum discount"
                />
              </div>
            </div>

            {/* Service Settings */}
            <div className="space-y-2">
              <Label htmlFor="freeServices">Free Services Count *</Label>
              <Input
                id="freeServices"
                type="number"
                min="0"
                value={formData.freeServices}
                onChange={(e) => handleInputChange("freeServices", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <Label>Benefits</Label>
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeBenefit(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Included Services */}
            <div className="space-y-3">
              <Label>Included Services</Label>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Add an included service..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                />
                <Button type="button" onClick={addService} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {includedServices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {includedServices.map((service, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {service}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeService(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Priority Booking</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow members to book appointments with priority
                  </p>
                </div>
                <Switch
                  checked={formData.priorityBooking}
                  onCheckedChange={(checked) => handleInputChange("priorityBooking", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this tier available for new memberships
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
              </div>
            </div>

            {/* Preview */}
            {formData.name && formData.price && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={parseFloat(formData.price) || 0} />/{formData.duration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="font-medium">{formData.discountPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Services:</span>
                    <span className="font-medium">{formData.freeServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Booking:</span>
                    <span className="font-medium">{formData.priorityBooking ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
