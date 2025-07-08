"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useCurrency } from "@/lib/currency-provider"
import { useServices } from "@/lib/service-provider"
import { useLocations } from "@/lib/location-provider"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface EditServiceDialogProps {
  service: {
    id: string
    name: string
    category: string
    price: number
    duration: number
    locations: string[]
    description?: string
    imageUrl?: string
    showPrices?: boolean
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditServiceDialog({ service, open, onOpenChange }: EditServiceDialogProps) {
  const { toast } = useToast()
  const { currency } = useCurrency()
  const { updateService, categories } = useServices()
  const { locations, getLocationName } = useLocations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false)

  const [formData, setFormData] = useState({
    name: service.name,
    category: service.category,
    description: service.description || "",
    duration: service.duration.toString(),
    price: service.price.toString(),
    locations: [...service.locations],
    imageUrl: service.imageUrl || "",
    showPrices: service.showPrices ?? true,
  })

  const [imagePreview, setImagePreview] = useState<string | null>(service.imageUrl || null)

  // Get default locations (all active except Online Store)
  const getDefaultLocations = () => {
    const activeLocationIds = locations
      .filter(location =>
        location.status === "Active" &&
        location.id !== "online" &&
        location.name.toLowerCase() !== "online store"
      )
      .map(location => location.id)
    return activeLocationIds // All active locations except Online Store
  }

  // Update form data when service prop changes (only when service ID changes or dialog opens)
  useEffect(() => {
    console.log("EditServiceDialog service prop changed:", service)

    // Use default locations if service has no locations assigned
    const serviceLocations = service.locations && service.locations.length > 0
      ? [...service.locations]
      : getDefaultLocations()

    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || "",
      duration: service.duration.toString(),
      price: service.price.toString(),
      locations: serviceLocations,
      imageUrl: service.imageUrl || "",
      showPrices: service.showPrices ?? true,
    })
    setImagePreview(service.imageUrl || null)
    setHasUserMadeChanges(false) // Reset the change tracking
  }, [service.id]) // Only depend on service.id to avoid resetting form when user makes changes

  // Reset change tracking when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setHasUserMadeChanges(false)
    }
  }, [open])

  // Log initial state for debugging
  useEffect(() => {
    console.log("EditServiceDialog initialized with service:", service)
    console.log("Initial formData:", formData)
  }, [])

  const handleChange = (field: string, value: string | string[] | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasUserMadeChanges(true)
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
        })
        return
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setFormData(prev => ({ ...prev, imageUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image URL input
  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }))
    setImagePreview(url || null)
  }

  // Remove image
  const handleRemoveImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, imageUrl: "" }))
  }

  const handleLocationChange = (locationId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        locations: [...prev.locations, locationId],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        locations: prev.locations.filter((id) => id !== locationId),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate locations - ensure we have at least one location
      if (formData.locations.length === 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select at least one location for this service.",
        })
        setIsSubmitting(false)
        return
      }

      // Create updated service object
      const updatedService = {
        id: service.id,
        name: formData.name,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        locations: formData.locations,
        description: formData.description,
        imageUrl: formData.imageUrl,
        showPrices: formData.showPrices,
      }

      console.log("Submitting updated service:", updatedService)

      // Update the service using the service provider
      await updateService(updatedService)

      console.log("Service updated successfully")

      toast({
        title: "Service updated",
        description: `${formData.name} has been updated successfully.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update service:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the service details. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ({currency.symbol})</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Service Image</Label>
              <div className="space-y-4">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Service preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Upload Image</p>
                        <p className="text-xs text-gray-400">Max 5MB</p>
                      </div>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="image-url">Or enter image URL</Label>
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price Visibility Control */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-prices"
                  checked={formData.showPrices}
                  onCheckedChange={(checked) => handleChange("showPrices", checked as boolean)}
                />
                <Label htmlFor="show-prices">Show prices to clients</Label>
              </div>
              <p className="text-sm text-gray-500">
                When unchecked, prices will be hidden from the client portal and booking pages
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Available Locations</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, locations: getDefaultLocations() }))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, locations: [] }))}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={location.id}
                      checked={formData.locations.includes(location.id)}
                      onCheckedChange={(checked) => handleLocationChange(location.id, checked as boolean)}
                    />
                    <Label htmlFor={location.id}>{location.name}</Label>
                  </div>
                ))}
              </div>
              {formData.locations.length === 0 && (
                <p className="text-sm text-destructive">Please select at least one location</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

