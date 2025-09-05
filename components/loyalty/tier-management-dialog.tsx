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
import { LoyaltyTier } from "@/lib/types/loyalty"
import { Plus, X, Medal, Award, Crown, Gem, Diamond } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TierManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tier?: LoyaltyTier | null
  onSave: (tier: LoyaltyTier) => void
  existingTiers: LoyaltyTier[]
}

export function TierManagementDialog({ 
  open, 
  onOpenChange, 
  tier, 
  onSave,
  existingTiers
}: TierManagementDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [benefits, setBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    minPoints: "",
    maxPoints: "",
    pointsMultiplier: "",
    isActive: true,
    color: "",
    icon: "Medal"
  })

  const iconOptions = [
    { value: "Medal", label: "Medal", icon: Medal },
    { value: "Award", label: "Award", icon: Award },
    { value: "Crown", label: "Crown", icon: Crown },
    { value: "Gem", label: "Gem", icon: Gem },
    { value: "Diamond", label: "Diamond", icon: Diamond }
  ]

  const colorOptions = [
    { value: "bg-amber-100 text-amber-800", label: "Bronze", color: "bg-amber-100" },
    { value: "bg-gray-100 text-gray-800", label: "Silver", color: "bg-gray-100" },
    { value: "bg-yellow-100 text-yellow-800", label: "Gold", color: "bg-yellow-100" },
    { value: "bg-purple-100 text-purple-800", label: "Purple", color: "bg-purple-100" },
    { value: "bg-blue-100 text-blue-800", label: "Blue", color: "bg-blue-100" },
    { value: "bg-green-100 text-green-800", label: "Green", color: "bg-green-100" },
    { value: "bg-red-100 text-red-800", label: "Red", color: "bg-red-100" },
    { value: "bg-pink-100 text-pink-800", label: "Pink", color: "bg-pink-100" }
  ]

  // Reset form when dialog opens/closes or tier changes
  useEffect(() => {
    if (open) {
      if (tier) {
        // Edit mode
        setFormData({
          name: tier.name,
          description: tier.description,
          minPoints: tier.minPoints.toString(),
          maxPoints: tier.maxPoints?.toString() || "",
          pointsMultiplier: tier.pointsMultiplier.toString(),
          isActive: tier.isActive,
          color: tier.color,
          icon: tier.icon
        })
        setBenefits([...tier.benefits])
      } else {
        // Create mode
        setFormData({
          name: "",
          description: "",
          minPoints: "",
          maxPoints: "",
          pointsMultiplier: "1.0",
          isActive: true,
          color: "bg-gray-100 text-gray-800",
          icon: "Medal"
        })
        setBenefits([])
      }
      setNewBenefit("")
    }
  }, [open, tier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.minPoints || !formData.pointsMultiplier) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    const minPoints = parseInt(formData.minPoints)
    const maxPoints = formData.maxPoints ? parseInt(formData.maxPoints) : undefined
    const pointsMultiplier = parseFloat(formData.pointsMultiplier)

    if (minPoints < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Points",
        description: "Minimum points must be 0 or greater.",
      })
      return
    }

    if (maxPoints !== undefined && maxPoints <= minPoints) {
      toast({
        variant: "destructive",
        title: "Invalid Range",
        description: "Maximum points must be greater than minimum points.",
      })
      return
    }

    if (pointsMultiplier <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Multiplier",
        description: "Points multiplier must be greater than 0.",
      })
      return
    }

    // Check for overlapping point ranges with other tiers
    const otherTiers = existingTiers.filter(t => t.id !== tier?.id)
    for (const otherTier of otherTiers) {
      const otherMin = otherTier.minPoints
      const otherMax = otherTier.maxPoints || Infinity
      
      // Check if ranges overlap
      if (minPoints < otherMax && (maxPoints || Infinity) > otherMin) {
        toast({
          variant: "destructive",
          title: "Overlapping Range",
          description: `Point range overlaps with ${otherTier.name} tier.`,
        })
        return
      }
    }

    if (benefits.length === 0) {
      toast({
        variant: "destructive",
        title: "Benefits Required",
        description: "Please add at least one benefit for this tier.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const tierData: LoyaltyTier = {
        id: tier?.id || `tier${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        minPoints,
        maxPoints,
        benefits: [...benefits],
        pointsMultiplier,
        isActive: formData.isActive,
        color: formData.color,
        icon: formData.icon
      }

      onSave(tierData)

      toast({
        title: tier ? "Tier updated" : "Tier created",
        description: `${formData.name} tier has been ${tier ? "updated" : "created"} successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving tier:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save tier. Please try again.",
      })
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

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit("")
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addBenefit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{tier ? "Edit Tier" : "Create New Tier"}</DialogTitle>
            <DialogDescription>
              {tier ? "Update the tier details below." : "Create a new loyalty tier with benefits and requirements."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Gold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsMultiplier">Points Multiplier *</Label>
                <Input
                  id="pointsMultiplier"
                  type="number"
                  value={formData.pointsMultiplier}
                  onChange={(e) => handleInputChange("pointsMultiplier", e.target.value)}
                  placeholder="1.5"
                  step="0.1"
                  min="0.1"
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
                placeholder="Description of this tier..."
                rows={2}
                required
              />
            </div>

            {/* Point Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPoints">Minimum Points *</Label>
                <Input
                  id="minPoints"
                  type="number"
                  value={formData.minPoints}
                  onChange={(e) => handleInputChange("minPoints", e.target.value)}
                  placeholder="1000"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPoints">Maximum Points</Label>
                <Input
                  id="maxPoints"
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => handleInputChange("maxPoints", e.target.value)}
                  placeholder="2499 (leave empty for unlimited)"
                  min="1"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color Theme</Label>
                <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.color}`}></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => handleInputChange("icon", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Benefits *</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit..."
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={addBenefit} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {benefits.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm">{benefit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 border rounded-lg">
                  <Badge className={formData.color}>
                    {formData.name}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.minPoints}+ points • {formData.pointsMultiplier}x multiplier
                  </p>
                </div>
              </div>
            )}

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
              {isSubmitting ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
